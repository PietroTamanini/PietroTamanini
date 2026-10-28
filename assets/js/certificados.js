(() => {
  const modal = document.querySelector('#pdf-modal');
  const frame = document.querySelector('#pdf-frame');
  const title = document.querySelector('#modal-title');
  const openLink = document.querySelector('#open-pdf');
  if (!modal || !frame || !title || !openLink) return;
  const closeButtons = modal.querySelectorAll('[data-close-modal]');
  let lastTrigger = null;

  function openViewer(button) {
    const pdf = button.dataset.pdf;
    if (!pdf) return;
    lastTrigger = button;
    title.textContent = button.dataset.title || 'Certificate';
    frame.src = `${pdf}#view=FitH`;
    openLink.href = pdf;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    const closeButton = modal.querySelector('.close-modal');
    if (closeButton) closeButton.focus();
  }

  function closeViewer() {
    if (modal.hidden) return;
    modal.hidden = true;
    frame.src = 'about:blank';
    document.body.classList.remove('modal-open');
    if (lastTrigger) lastTrigger.focus();
  }

  document.querySelectorAll('.certificate-card[data-pdf]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      openViewer(link);
    });
  });
  closeButtons.forEach((button) => button.addEventListener('click', closeViewer));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeViewer();
  });
})();
