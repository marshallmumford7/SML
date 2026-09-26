// Sightings map on real map tiles. Video sites use surveyed GPS coordinates; other markers
// were positioned by georeferencing the guide's maps (see README).
(function () {
  const data = window.FISH_MAP;
  const box = document.getElementById('bigmap');
  if (!window.L || !data) {
    const missing = [!window.L && 'vendor/leaflet/leaflet.js', !data && 'map-data.js'].filter(Boolean).join(' and ');
    box.innerHTML = '<p class="map-error">The map could not load because <code>' + missing +
      '</code> is missing from the site. Check that the file was uploaded to the repository, then reload this page.</p>';
    return;
  }
  const METHOD = { dot: 'Underwater video (RUVS)', dia: 'Trap or seine', rod: 'Rod and reel', bait: 'Bait fishing' };
  const DETAIL = {
    'dot-hi': 'higher abundance', 'dot-lo': 'seen infrequently',
    'dia-hi': 'caught', 'dia-lo': 'fewer caught; for seine species, also a tern foraging spot',
    rod: 'caught on rod and reel', bait: 'caught while bait fishing',
  };
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (v) => v.toFixed(5);

  // ---- state from URL ----
  const params = new URLSearchParams(location.hash.slice(1));
  const viewIds = Object.keys(data.views);
  const allSpecies = Object.keys(data.species);
  let siteParam = params.get('site');
  if (siteParam && data.alias[siteParam]) siteParam = data.alias[siteParam];
  const state = {
    view: viewIds.includes(params.get('area')) ? params.get('area') : 'appledore',
    species: new Set(params.get('species') ? params.get('species').split(',').filter((s) => data.species[s]) : allSpecies),
    methods: new Set(['dot', 'dia', 'rod', 'bait']),
    survey: true, pools: false,
    site: siteParam,
  };
  if (!state.species.size) allSpecies.forEach((s) => state.species.add(s));

  // ---- map + base layers ----
  const map = L.map('bigmap', { zoomSnap: 0.5, maxZoom: 19 });
  map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
  const streets = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  });
  const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19, attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
  });
  satellite.addTo(map);
  L.control.layers({ Satellite: satellite, Streets: streets }, null, { position: 'topright' }).addTo(map);
  L.control.scale({ imperial: false }).addTo(map);
  const layer = L.layerGroup().addTo(map);
  const markers = {};

  // ---- controls ----
  const viewBtns = document.getElementById('areaBtns');
  viewIds.forEach((id) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = data.views[id].name; b.dataset.view = id;
    b.addEventListener('click', () => { state.view = id; fly(); markViews(); writeHash(); });
    viewBtns.appendChild(b);
  });
  const markViews = () => [...viewBtns.children].forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === state.view)));
  const fly = () => map.fitBounds(data.views[state.view].bounds, { padding: [20, 20] });

  const spList = document.getElementById('spList');
  allSpecies.forEach((id) => {
    const n = data.sites.filter((s) => s.records.some((r) => r.species === id)).length;
    const lab = document.createElement('label');
    lab.innerHTML = `<input type="checkbox" name="species" value="${id}"> <span>${esc(data.species[id])}</span> <small>${n}</small>`;
    spList.appendChild(lab);
  });
  const spBoxes = [...spList.querySelectorAll('input')];
  const syncSp = () => spBoxes.forEach((b) => { b.checked = state.species.has(b.value); });
  spBoxes.forEach((b) => b.addEventListener('change', () => { b.checked ? state.species.add(b.value) : state.species.delete(b.value); render(); }));
  document.getElementById('spAll').addEventListener('click', () => { allSpecies.forEach((s) => state.species.add(s)); syncSp(); render(); });
  document.getElementById('spNone').addEventListener('click', () => { state.species.clear(); syncSp(); render(); });
  document.querySelectorAll('input[name="method"]').forEach((b) => b.addEventListener('change', () => {
    b.checked ? state.methods.add(b.value) : state.methods.delete(b.value); render();
  }));
  const surveyBox = document.getElementById('showSurvey'), poolBox = document.getElementById('showPools');
  surveyBox.checked = state.survey; poolBox.checked = state.pools;
  surveyBox.addEventListener('change', () => { state.survey = surveyBox.checked; render(); });
  poolBox.addEventListener('change', () => { state.pools = poolBox.checked; render(); });
  syncSp();

  // ---- markers ----
  function icon(cls, size, badge) {
    return L.divIcon({
      className: 'bm-icon', html: `<span class="${cls}"></span>${badge ? `<b class="bm-count">${badge}</b>` : ''}`,
      iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2],
    });
  }
  function where(s) {
    return s.exact
      ? `<p class="pop-coord">${fmt(s.lat)}, ${fmt(s.lng)}</p>`
      : `<p class="pop-coord">≈ ${fmt(s.lat)}, ${fmt(s.lng)} <span>(placed from the guide's map, about ±50 m)</span></p>`;
  }
  function popupHtml(site, recs) {
    const bySp = {};
    recs.forEach((r) => { (bySp[r.species] = bySp[r.species] || new Set()).add(DETAIL[r.kind]); });
    let h = `<p class="pop-title">${esc(site.name)}</p><p class="pop-sub">${METHOD[site.method]}</p><ul>`;
    Object.keys(bySp).sort((a, b) => data.species[a].localeCompare(data.species[b])).forEach((sp) => {
      h += `<li><a href="${sp}.html">${esc(data.species[sp])}</a> <span>${esc([...bySp[sp]].join(', '))}</span></li>`;
    });
    h += '</ul>';
    const hidden = new Set(site.records.filter((r) => !state.species.has(r.species)).map((r) => r.species)).size;
    if (hidden) h += `<p class="pop-sub">${hidden} more species here hidden by your filters.</p>`;
    return h + where(site);
  }

  function render() {
    layer.clearLayers();
    Object.keys(markers).forEach((k) => delete markers[k]);
    let shown = 0; const spHere = new Set();
    data.sites.filter((s) => state.methods.has(s.method)).forEach((site) => {
      const recs = site.records.filter((r) => state.species.has(r.species));
      if (!recs.length) return;
      shown++; recs.forEach((r) => spHere.add(r.species));
      const n = new Set(recs.map((r) => r.species)).size;
      const tone = recs.some((r) => r.kind.endsWith('-hi')) ? 'hi' : (recs.some((r) => r.kind.endsWith('-lo')) ? 'lo' : '');
      const size = site.method === 'rod' ? 38 : 22;
      const label = `${site.name}: ${[...new Set(recs.map((r) => data.species[r.species]))].join(', ')}`;
      const m = L.marker([site.lat, site.lng], { icon: icon(`bm-pin ${site.method} ${tone}`, size, n > 1 ? n : ''), title: label, alt: label, riseOnHover: true })
        .bindPopup(popupHtml(site, recs), { maxWidth: 290, className: 'bm-popup' });
      m.on('popupopen', () => { state.site = site.id; writeHash(); });
      m.on('popupclose', () => { if (state.site === site.id) { state.site = null; writeHash(); } });
      m.addTo(layer); markers[site.id] = m;
    });
    if (state.survey) data.survey.forEach((s) => {
      L.marker([s.lat, s.lng], { icon: icon('bm-pin survey', 14), title: s.name, alt: s.name, zIndexOffset: -500 })
        .bindPopup(`<p class="pop-title">${esc(s.name)}</p><p class="pop-sub">No species records in the guide yet.</p><p class="pop-coord">${fmt(s.lat)}, ${fmt(s.lng)}</p>`, { className: 'bm-popup' })
        .addTo(layer);
    });
    if (state.pools) data.pools.forEach((p) => {
      L.circleMarker([p.lat, p.lng], { radius: 5, color: '#1c2a2e', weight: 1, fillColor: '#ffd23f', fillOpacity: 1 })
        .bindPopup(`<p class="pop-title">Tide pool ${esc(p.id)}</p><p class="pop-sub">2025 SURG tide-pool sampling (mummichog)</p><p class="pop-coord">${fmt(p.lat)}, ${fmt(p.lng)}</p>`, { className: 'bm-popup' })
        .addTo(layer);
    });
    document.getElementById('status').textContent = shown
      ? `${shown} site${shown === 1 ? '' : 's'} with records, ${spHere.size} species shown.`
      : 'No sites match these filters. Try adding species or methods.';
    writeHash();
  }

  function writeHash() {
    const p = new URLSearchParams();
    p.set('area', state.view);
    if (state.species.size && state.species.size < allSpecies.length) p.set('species', [...state.species].join(','));
    if (state.site) p.set('site', state.site);
    history.replaceState(null, '', '#' + p.toString().replace(/%2C/g, ','));
  }

  const startSite = state.site;
  render(); markViews(); fly();
  if (startSite && markers[startSite]) {
    map.setView(markers[startSite].getLatLng(), 17);
    markers[startSite].openPopup();
  }
  window.addEventListener('hashchange', () => location.reload());
})();
