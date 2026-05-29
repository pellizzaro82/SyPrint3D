let activeConfirmDialog = null;

function createLineMarkup(message) {
  const text = String(message || '').trim();
  if (!text) return '<p class="app-confirm-text">Tem certeza?</p>';

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p class="app-confirm-text">${line.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</p>`)
    .join('');
}

function closeActiveDialog() {
  if (!activeConfirmDialog) return;
  const { backdrop, onKeyDown } = activeConfirmDialog;
  window.removeEventListener('keydown', onKeyDown);
  backdrop.remove();
  activeConfirmDialog = null;
}

export function showConfirmDialog(message, options = {}) {
  return new Promise((resolve) => {
    if (activeConfirmDialog) {
      closeActiveDialog();
    }

    const title = String(options.title || 'Confirmacao').trim() || 'Confirmacao';
    const confirmText = String(options.confirmText || 'Confirmar').trim() || 'Confirmar';
    const cancelText = String(options.cancelText || 'Cancelar').trim() || 'Cancelar';

    const backdrop = document.createElement('div');
    backdrop.className = 'app-confirm-backdrop';

    const dialog = document.createElement('section');
    dialog.className = 'app-confirm-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', title);

    dialog.innerHTML = `
      <header class="app-confirm-head">
        <h3>${title.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</h3>
      </header>
      <div class="app-confirm-body">
        ${createLineMarkup(message)}
      </div>
      <footer class="app-confirm-actions">
        <button type="button" class="app-confirm-btn cancel">${cancelText.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</button>
        <button type="button" class="app-confirm-btn confirm">${confirmText.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</button>
      </footer>
    `;

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    const finish = (confirmed) => {
      closeActiveDialog();
      resolve(Boolean(confirmed));
    };

    const cancelButton = dialog.querySelector('.app-confirm-btn.cancel');
    const confirmButton = dialog.querySelector('.app-confirm-btn.confirm');

    cancelButton?.addEventListener('click', () => finish(false));
    confirmButton?.addEventListener('click', () => finish(true));

    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) {
        finish(false);
      }
    });

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        finish(false);
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        finish(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    activeConfirmDialog = { backdrop, onKeyDown };

    window.requestAnimationFrame(() => {
      backdrop.classList.add('show');
      dialog.classList.add('show');
      confirmButton?.focus();
    });
  });
}

export function installDialogGlobals() {
  if (window.__syprint_dialogs_installed__) return;
  window.__syprint_dialogs_installed__ = true;

  window.appConfirm = showConfirmDialog;
}
