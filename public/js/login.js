import { installToastAlerts } from './ui/toast.js';
import { installDialogGlobals } from './ui/dialogs.js';

const AUTH_TOKEN_KEY = 'syprint3d_auth_token';
const AUTH_USER_KEY = 'syprint3d_auth_user';

function showMessage(element, text, type = 'error') {
  if (!element) return;
  element.textContent = text || '';
  element.classList.remove('is-error', 'is-success');
  if (text) {
    element.classList.add(type === 'success' ? 'is-success' : 'is-error');
    alert(text);
  }
}

function setLoadingState(button, loading) {
  if (!button) return;
  button.disabled = loading;
  button.textContent = loading ? 'Entrando...' : 'Entrar';
}

function redirectToApp() {
  window.location.href = '/';
}

function hasSession() {
  return Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
}

async function validateExistingSession() {
  const token = String(localStorage.getItem(AUTH_TOKEN_KEY) || '').trim();
  if (!token) return false;

  try {
    const response = await fetch('/api/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const email = String(form.email?.value || '').trim();
  const senha = String(form.senha?.value || '').trim();
  const submitButton = form.querySelector('.login-submit');
  const messageElement = document.querySelector('#loginMessage');

  if (!email || !senha) {
    showMessage(messageElement, 'Informe e-mail e senha.', 'error');
    return;
  }

  setLoadingState(submitButton, true);
  showMessage(messageElement, '');

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(String(data?.message || 'Nao foi possivel entrar.'));
    }

    localStorage.setItem(AUTH_TOKEN_KEY, String(data?.token || ''));
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data?.user || {}));

    showMessage(messageElement, 'Login realizado com sucesso.', 'success');
    setTimeout(redirectToApp, 250);
  } catch (error) {
    showMessage(messageElement, error.message || 'Nao foi possivel entrar.', 'error');
  } finally {
    setLoadingState(submitButton, false);
  }
}

async function bootstrapLogin() {
  if (hasSession()) {
    const isValid = await validateExistingSession();
    if (isValid) {
      redirectToApp();
      return;
    }
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }

  const closeButton = document.querySelector('.login-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      window.location.href = '/';
    });
  }

  const form = document.querySelector('#loginForm');
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }
}

installToastAlerts();
installDialogGlobals();
bootstrapLogin();
