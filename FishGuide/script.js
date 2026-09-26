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

// ---------- Interactive markers on species-page maps ----------
(function () {
  const data = window.FISH_MAP;
  if (!data) return;
  const sites = {};
  data.sites.forEach((s) => { sites[s.id] = s; });
  const METHOD = { dot: 'Underwater video site', dia: 'Trap or seine site', rod: 'Rod and reel spot', bait: 'Bait-fishing spot' };
  const DETAIL = {
    'dot-hi': 'higher abundance', 'dot-lo': 'seen infrequently',
    'dia-hi': 'caught', 'dia-lo': 'fewer caught; for seine species, also a tern foraging spot',
    rod: 'caught on rod and reel', bait: 'caught while bait fishing',
  };
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function content(pin) {
    const site = sites[pin.dataset.site];
    const me = pin.dataset.species;
    const mine = site.records.filter((r) => r.species === me);
    const others = {};
    site.records.filter((r) => r.species !== me).forEach((r) => {
      (others[r.species] = others[r.species] || []).push(DETAIL[r.kind]);
    });
    let h = `<p class="pop-title">${METHOD[site.method]}</p>`;
    h += `<p class="pop-main">${esc(data.species[me])}: ${esc([...new Set(mine.map((r) => DETAIL[r.kind]))].join(', '))}</p>`;
    const keys = Object.keys(others);
    if (keys.length) {
      h += '<p class="pop-sub">Also recorded here</p><ul>';
      keys.forEach((k) => { h += `<li><a href="${k}.html">${esc(data.species[k])}</a> <span>${esc([...new Set(others[k])].join(', '))}</span></li>`; });
      h += '</ul>';
    } else {
      h += '<p class="pop-sub">No other species recorded at this spot yet.</p>';
    }
    h += `<a class="pop-link" href="map.html#area=${site.area}&site=${site.id}">See it on the full map</a>`;
    return h;
  }

  let open = null;
  function close() {
    if (!open) return;
    open.pop.remove();
    open.pin.setAttribute('aria-expanded', 'false');
    open = null;
  }
  function show(pin) {
    close();
    const box = pin.closest('.imap');
    const pop = document.createElement('div');
    pop.className = 'pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', METHOD[sites[pin.dataset.site].method]);
    pop.innerHTML = '<button type="button" class="pop-x" aria-label="Close">×</button>' + content(pin);
    box.appendChild(pop);
    const bx = box.getBoundingClientRect();
    const pr = pin.getBoundingClientRect();
    const px = pr.left + pr.width / 2 - bx.left;
    const py = pr.top + pr.height / 2 - bx.top;
    const w = pop.offsetWidth, h = pop.offsetHeight;
    let left = Math.min(Math.max(px - w / 2, 6), bx.width - w - 6);
    let top = py + 18;
    if (top + h > bx.height - 6 && py - 18 - h > 6) top = py - 18 - h;
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    pop.querySelector('.pop-x').addEventListener('click', () => { const p = pin; close(); p.focus(); });
    pin.setAttribute('aria-expanded', 'true');
    open = { pin, pop };
  }
  document.querySelectorAll('.imap .pin').forEach((pin) => {
    pin.setAttribute('aria-expanded', 'false');
    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      if (open && open.pin === pin) close(); else show(pin);
    });
  });
  document.addEventListener('click', (e) => { if (open && !open.pop.contains(e.target)) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) { const p = open.pin; close(); p.focus(); }
  });
  window.addEventListener('resize', close);
})();
