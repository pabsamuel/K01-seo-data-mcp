// Click-to-zoom viewer for product screenshots (27 Nov 2026).
// Every <button class="shot-zoom"> that holds a 2x screenshot opens a full-screen <dialog>:
// the picture is never smaller than on the page (up to 1.6x its own size), a click on it shows it at 2x,
// Esc, the close button or a click beside the picture closes, focus returns, pinch zoom stays on.
(() => {
  const triggers = document.querySelectorAll('button.shot-zoom');
  if (!triggers.length || typeof HTMLDialogElement !== 'function') return;
  const dlg = document.createElement('dialog');
  dlg.className = 'zoom-dlg';
  dlg.setAttribute('aria-label', 'Enlarged screenshot');
  const stage = document.createElement('div');
  stage.className = 'zoom-stage';
  const img = document.createElement('img');
  img.alt = '';
  img.decoding = 'async';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'zoom-close';
  close.setAttribute('aria-label', 'Close');
  close.textContent = '×';
  const hint = document.createElement('p');
  hint.className = 'zoom-hint';
  hint.textContent = 'Click the picture to zoom. Esc closes.';
  stage.append(img);
  dlg.append(close, stage, hint);
  document.body.append(dlg);

  let opener = null;
  let base = 0;
  let cssW = 0;
  const size = (w) => {
    img.style.width = `${Math.round(w)}px`;
  };
  const open = (btn) => {
    const pic = btn.querySelector('img');
    if (!pic) return;
    opener = btn;
    const src = pic.currentSrc || pic.src;
    // The picture's own CSS width is the width attribute of the <source> or <img> that is showing (files are 1x or 2x).
    const file = src.split('/').pop().split('?')[0];
    const active = [...btn.querySelectorAll('source')].find((s) => (s.getAttribute('srcset') || '').split(/[\s,]/)[0].endsWith(file)) || pic;
    const ratio = Number(active.getAttribute('width')) ? pic.naturalWidth / Number(active.getAttribute('width')) || 2 : Number(btn.dataset.dpr || 2);
    const shown = pic.getBoundingClientRect().width;
    const show = () => {
      cssW = Number(active.getAttribute('width')) || (img.naturalWidth || pic.naturalWidth) / ratio;
      const room = window.innerWidth - 32;
      base = Math.max(shown, Math.min(cssW * 1.6, room));
      size(base);
    };
    img.alt = pic.alt;
    dlg.classList.remove('is-zoomed');
    if (img.src !== src) {
      img.onload = show;
      img.src = src;
    }
    dlg.showModal();
    if (img.complete && img.naturalWidth) show();
    else if (pic.naturalWidth) {
      cssW = Number(active.getAttribute('width')) || pic.naturalWidth / ratio;
      base = Math.max(shown, Math.min(cssW * 1.6, window.innerWidth - 32));
      size(base);
    }
    close.focus();
  };
  for (const btn of triggers) btn.addEventListener('click', () => open(btn));
  img.addEventListener('click', (e) => {
    e.stopPropagation();
    const on = !dlg.classList.contains('is-zoomed');
    dlg.classList.toggle('is-zoomed', on);
    size(on ? cssW * 2 : base);
  });
  close.addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => {
    if (e.target !== img) dlg.close();
  });
  dlg.addEventListener('close', () => {
    dlg.classList.remove('is-zoomed');
    opener?.focus();
  });
})();
