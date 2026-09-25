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
