// Open photos and maps in an in-page viewer; falls back to the plain image link without JS.
(function () {
  if (!window.HTMLDialogElement) return;
  const dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.innerHTML = '<button type="button">Close</button><img alt="">';
  document.body.appendChild(dlg);
  const img = dlg.querySelector('img');
  dlg.querySelector('button').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  document.querySelectorAll('a.zoom').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      img.src = a.getAttribute('href');
      img.alt = (a.querySelector('img') || {}).alt || '';
      dlg.showModal();
    });
  });
})();

// ---------- Species-page maps: pins drawn from points.json ----------
// Each .imap carries data-geo: six numbers converting (lng, lat) to a fraction of the image
// width/height, so any point in points.json appears on every map it falls inside.
(function () {
  const maps = [...document.querySelectorAll('.imap')];
  if (!maps.length) return;
  const PIN = { video: 'dot', trap: 'dia', rod: 'rod', bait: 'bait' };
  const TYPE_TITLE = { video: 'Underwater video site', trap: 'Trap or seine site', rod: 'Rod and reel spot', bait: 'Bait-fishing spot' };
  const DETAIL = {
    video: { high: 'higher abundance', low: 'seen infrequently', present: 'seen' },
    trap: { high: 'caught', low: 'fewer caught; for seine species, also a tern foraging spot', present: 'caught' },
    rod: { high: 'caught on rod and reel', low: 'caught on rod and reel', present: 'caught on rod and reel' },
    bait: { high: 'caught while bait fishing', low: 'caught while bait fishing', present: 'caught while bait fishing' },
  };
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let data = null, open = null;

  function draw() {
    const byId = {};
    data.points.forEach((p) => { byId[p.id] = p; });
    maps.forEach((box) => {
      box.querySelectorAll('.pin').forEach((b) => b.remove());
      const sp = box.dataset.species, types = box.dataset.types.split(',');
      const g = box.dataset.geo.split(',').map(Number);
      let grid = null;
      if (box.dataset.grid) {          // bent (tilted-photo) maps: bilinear lookup on a lng/lat lattice
        const [hd, gx, gy] = box.dataset.grid.split('|');
        const [lng0, lng1, lat0, lat1, n] = hd.split(',').map(Number);
        grid = { lng0, lng1, lat0, lat1, n, fx: gx.split(',').map(Number), fy: gy.split(',').map(Number) };
      }
      const toFrac = (lng, lat) => {
        if (!grid) return [g[0] * lng + g[1] * lat + g[2], g[3] * lng + g[4] * lat + g[5]];
        const u = (lng - grid.lng0) / (grid.lng1 - grid.lng0) * (grid.n - 1), v = (lat - grid.lat0) / (grid.lat1 - grid.lat0) * (grid.n - 1);
        if (u < 0 || v < 0 || u > grid.n - 1 || v > grid.n - 1) return [-1, -1];
        const i = Math.min(Math.floor(u), grid.n - 2), j = Math.min(Math.floor(v), grid.n - 2), a = u - i, b = v - j;
        const at = (A) => A[j * grid.n + i] * (1 - a) * (1 - b) + A[j * grid.n + i + 1] * a * (1 - b) + A[(j + 1) * grid.n + i] * (1 - a) * b + A[(j + 1) * grid.n + i + 1] * a * b;
        return [at(grid.fx), at(grid.fy)];
      };
      let n = 0;
      data.points.forEach((p) => {
        const level = p.species && p.species[sp];
        if (!level || !types.includes(p.type)) return;
        const [fx, fy] = toFrac(p.lng, p.lat);
        if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `pin ${PIN[p.type]} ${level === 'high' ? 'hi' : level === 'low' ? 'lo' : ''}`;
        b.style.left = (fx * 100).toFixed(2) + '%';
        b.style.top = (fy * 100).toFixed(2) + '%';
        b.dataset.id = p.id;
        b.setAttribute('aria-label', `${p.name}: ${DETAIL[p.type][level]}`);
        b.setAttribute('aria-expanded', 'false');
        b.addEventListener('click', (e) => { e.stopPropagation(); if (open && open.pin === b) close(); else show(b, byId[p.id], sp); });
        box.appendChild(b); n++;
      });
      const msg = box.parentElement.querySelector('.map-msg');
      if (msg) msg.textContent = n ? 'Select a marker for details.' : 'No points recorded on this map yet.';
    });
  }

  function content(p, me) {
    let h = `<p class="pop-title">${esc(p.name)}</p>`;
    h += `<p class="pop-main">${esc(data.species[me] || me)}: ${esc(DETAIL[p.type][p.species[me]])}</p>`;
    const others = Object.keys(p.species).filter((s) => s !== me);
    if (others.length) {
      h += '<p class="pop-sub">Also recorded here</p><ul>';
      others.forEach((s) => {
        const nm = esc(data.species[s] || s);
        h += `<li>${(window.FISH_REF && window.FISH_REF.pages && !window.FISH_REF.pages.includes(s)) ? nm : `<a href="${s}.html">${nm}</a>`} <span>${esc(DETAIL[p.type][p.species[s]])}</span></li>`;
      });
      h += '</ul>';
    } else h += '<p class="pop-sub">No other species recorded at this spot yet.</p>';
    if (p.note) h += `<p class="pop-sub">${esc(p.note)}</p>`;
    const area = p.lat > 43.03 ? 'new-castle' : 'appledore';
    return h + `<a class="pop-link" href="map.html#area=${area}&site=${encodeURIComponent(p.id)}">See it on the full map</a>`;
  }
  function close() {
    if (!open) return;
    open.pop.remove(); open.pin.setAttribute('aria-expanded', 'false'); open = null;
  }
  function show(pin, p, me) {
    close();
    const box = pin.closest('.imap');
    const pop = document.createElement('div');
    pop.className = 'pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', p.name);
    pop.innerHTML = '<button type="button" class="pop-x" aria-label="Close">×</button>' + content(p, me);
    box.appendChild(pop);
    const bx = box.getBoundingClientRect(), pr = pin.getBoundingClientRect();
    const px = pr.left + pr.width / 2 - bx.left, py = pr.top + pr.height / 2 - bx.top;
    const w = pop.offsetWidth, h = pop.offsetHeight;
    pop.style.left = Math.min(Math.max(px - w / 2, 6), bx.width - w - 6) + 'px';
    let top = py + 18; if (top + h > bx.height - 6 && py - 18 - h > 6) top = py - 18 - h;
    pop.style.top = top + 'px';
    pop.querySelector('.pop-x').addEventListener('click', () => { close(); pin.focus(); });
    pin.setAttribute('aria-expanded', 'true');
    open = { pin, pop };
  }
  document.addEventListener('click', (e) => { if (open && !open.pop.contains(e.target)) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { const p = open.pin; close(); p.focus(); } });
  window.addEventListener('resize', close);

  fetch('points.json', { cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((d) => { data = d; draw(); })
    .catch(() => maps.forEach((box) => {
      const msg = box.parentElement.querySelector('.map-msg');
      if (msg) msg.textContent = 'Markers could not load (points.json). They appear when the site is served from GitHub Pages or a local web server.';
    }));
})();
