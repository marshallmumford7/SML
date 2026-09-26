// Full sightings map: every marker from the guide on its original base map, with filters.
(function () {
  const data = window.FISH_MAP;
  const METHOD = { dot: 'Underwater video site', dia: 'Trap or seine site', rod: 'Rod and reel spot', bait: 'Bait-fishing spot' };
  const DETAIL = {
    'dot-hi': 'higher abundance', 'dot-lo': 'seen infrequently',
    'dia-hi': 'caught', 'dia-lo': 'fewer caught; for seine species, also a tern foraging spot',
    rod: 'caught on rod and reel', bait: 'caught while bait fishing',
  };
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---- state from URL hash ----
  const params = new URLSearchParams(location.hash.slice(1));
  const areaIds = Object.keys(data.areas);
  const allSpecies = Object.keys(data.species);
  const state = {
    area: areaIds.includes(params.get('area')) ? params.get('area') : 'appledore',
    species: new Set(params.get('species') ? params.get('species').split(',').filter((s) => data.species[s]) : allSpecies),
    methods: new Set(['dot', 'dia', 'rod', 'bait']),
    site: params.get('site'),
  };
  if (!state.species.size) allSpecies.forEach((s) => state.species.add(s));

  // ---- controls ----
  const areaBtns = document.getElementById('areaBtns');
  areaIds.forEach((id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = data.areas[id].name;
    b.dataset.area = id;
    b.addEventListener('click', () => { state.site = null; setArea(id); });
    areaBtns.appendChild(b);
  });

  const spList = document.getElementById('spList');
  allSpecies.forEach((id) => {
    const lab = document.createElement('label');
    const count = data.sites.filter((s) => s.records.some((r) => r.species === id)).length;
    lab.innerHTML = `<input type="checkbox" name="species" value="${id}"> <span>${esc(data.species[id])}</span> <small>${count}</small>`;
    spList.appendChild(lab);
  });
  const spBoxes = [...spList.querySelectorAll('input')];
  const syncSpBoxes = () => spBoxes.forEach((b) => { b.checked = state.species.has(b.value); });
  spBoxes.forEach((b) => b.addEventListener('change', () => {
    b.checked ? state.species.add(b.value) : state.species.delete(b.value);
    render();
  }));
  document.getElementById('spAll').addEventListener('click', () => { allSpecies.forEach((s) => state.species.add(s)); syncSpBoxes(); render(); });
  document.getElementById('spNone').addEventListener('click', () => { state.species.clear(); syncSpBoxes(); render(); });
  document.querySelectorAll('input[name="method"]').forEach((b) => b.addEventListener('change', () => {
    b.checked ? state.methods.add(b.value) : state.methods.delete(b.value);
    render();
  }));
  syncSpBoxes();

  // ---- map ----
  const map = L.map('bigmap', { crs: L.CRS.Simple, minZoom: -3, maxZoom: 2, zoomSnap: 0.25, attributionControl: true });
  map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
  let overlay = null;
  const layer = L.layerGroup().addTo(map);
  const markers = {};

  function bounds(a) { return [[0, 0], [a.h, a.w]]; }
  function toLatLng(a, s) { return [a.h - s.y * a.h, s.x * a.w]; }

  function setArea(id) {
    state.area = id;
    const a = data.areas[id];
    if (overlay) map.removeLayer(overlay);
    overlay = L.imageOverlay('images/' + a.image, bounds(a), {
      alt: 'Base map of ' + a.name,
      attribution: id === 'offshore' ? 'Imagery &copy; Google' : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    map.setMaxBounds(L.latLngBounds(bounds(a)).pad(0.25));
    map.fitBounds(bounds(a));
    [...areaBtns.children].forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.area === id)));
    render();
  }

  function popupHtml(site, recs) {
    const bySp = {};
    recs.forEach((r) => { (bySp[r.species] = bySp[r.species] || new Set()).add(DETAIL[r.kind]); });
    let h = `<p class="pop-title">${METHOD[site.method]}</p><ul>`;
    Object.keys(bySp).sort((a, b) => data.species[a].localeCompare(data.species[b])).forEach((sp) => {
      h += `<li><a href="${sp}.html">${esc(data.species[sp])}</a> <span>${esc([...bySp[sp]].join(', '))}</span></li>`;
    });
    const hidden = site.records.filter((r) => !state.species.has(r.species));
    if (hidden.length) {
      const n = new Set(hidden.map((r) => r.species)).size;
      h += `</ul><p class="pop-sub">${n} more species here hidden by your filters.</p>`;
    } else h += '</ul>';
    return h;
  }

  function render() {
    layer.clearLayers();
    Object.keys(markers).forEach((k) => delete markers[k]);
    const a = data.areas[state.area];
    let shown = 0;
    const speciesHere = new Set();
    data.sites.filter((s) => s.area === state.area && state.methods.has(s.method)).forEach((site) => {
      const recs = site.records.filter((r) => state.species.has(r.species));
      if (!recs.length) return;
      shown++;
      recs.forEach((r) => speciesHere.add(r.species));
      const n = new Set(recs.map((r) => r.species)).size;
      const tone = recs.some((r) => r.kind.endsWith('-hi')) ? 'hi' : (recs.some((r) => r.kind.endsWith('-lo')) ? 'lo' : '');
      const cls = `bm-pin ${site.method} ${tone}`;
      const size = site.method === 'rod' ? 38 : 22;
      const icon = L.divIcon({
        className: 'bm-icon',
        html: `<span class="${cls}"></span>${n > 1 ? `<b class="bm-count">${n}</b>` : ''}`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
      });
      const label = `${METHOD[site.method]}: ${[...new Set(recs.map((r) => data.species[r.species]))].join(', ')}`;
      const m = L.marker(toLatLng(a, site), { icon, title: label, alt: label, keyboard: true, riseOnHover: true })
        .bindPopup(popupHtml(site, recs), { maxWidth: 280, className: 'bm-popup' });
      m.on('popupopen', () => { state.site = site.id; writeHash(); });
      m.on('popupclose', () => { if (state.site === site.id) { state.site = null; writeHash(); } });
      m.addTo(layer);
      markers[site.id] = m;
    });
    const status = document.getElementById('status');
    status.textContent = shown
      ? `${data.areas[state.area].name}: ${shown} site${shown === 1 ? '' : 's'}, ${speciesHere.size} species shown.`
      : `No sites in ${data.areas[state.area].name} match these filters. Try another area or add species.`;
    // area buttons show how many matching sites each area has
    [...areaBtns.children].forEach((b) => {
      const c = data.sites.filter((s) => s.area === b.dataset.area && state.methods.has(s.method) &&
        s.records.some((r) => state.species.has(r.species))).length;
      b.innerHTML = `${esc(data.areas[b.dataset.area].name)} <small>${c}</small>`;
    });
    writeHash();
  }

  function writeHash() {
    const p = new URLSearchParams();
    p.set('area', state.area);
    if (state.species.size && state.species.size < allSpecies.length) p.set('species', [...state.species].join(','));
    if (state.site) p.set('site', state.site);
    history.replaceState(null, '', '#' + p.toString().replace(/%2C/g, ','));
  }

  const startSite = state.site;
  setArea(state.area);
  if (startSite && markers[startSite]) {
    const m = markers[startSite];
    map.setView(m.getLatLng(), -0.5);
    m.openPopup();
  }
})();
window.addEventListener('hashchange', () => location.reload());
