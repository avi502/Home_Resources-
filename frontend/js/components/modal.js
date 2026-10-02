// Accessible Modal Management
export function setupModal(modalId, triggerBtnId, closeBtnSelector = '.modal-close-btn') {
  const modal = document.getElementById(modalId);
  const trigger = document.getElementById(triggerBtnId);
  if (!modal) return;

  const openModal = () => {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  };

  const closeModal = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  };

  if (trigger) {
    trigger.addEventListener('click', openModal);
  }

  const closeBtns = modal.querySelectorAll(closeBtnSelector);
  closeBtns.forEach(btn => btn.addEventListener('click', closeModal));

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  return { open: openModal, close: closeModal };
}
