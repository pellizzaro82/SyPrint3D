import { installToastAlerts } from './ui/toast.js';
import { installDialogGlobals } from './ui/dialogs.js';

const AUTH_TOKEN_KEY = 'syprint3d_auth_token';
const AUTH_USER_KEY = 'syprint3d_auth_user';
const runtimeConfig = window.SYPRINT3D_CONFIG || {};

function getAppBasePath() {
  const configured = String(runtimeConfig.appBasePath || '').trim();
  if (configured) return configured.replace(/\/$/, '');

  const pathname = String(window.location.pathname || '');
  if (/\/(index\.html|login\.html)$/.test(pathname)) {
    return pathname.replace(/\/(index\.html|login\.html)$/, '');
  }
  if (pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function buildAppUrl(path = '') {
  const basePath = getAppBasePath();
  const normalizedPath = String(path || '').trim();
  if (!normalizedPath) return basePath || '/';
  const suffix = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  return `${basePath}${suffix}` || suffix;
}

function getApiUrl(path = '') {
  const apiBaseUrl = String(runtimeConfig.apiBaseUrl || '').trim().replace(/\/$/, '');
  const normalizedPath = String(path || '').trim();
  const suffix = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  if (apiBaseUrl) {
    return `${apiBaseUrl}${suffix}`;
  }
  return `/api${suffix}`;
}

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
  window.location.href = buildAppUrl('/');
}

function hasSession() {
  return Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
}

async function validateExistingSession() {
  const token = String(localStorage.getItem(AUTH_TOKEN_KEY) || '').trim();
  if (!token) return false;

  try {
    const response = await fetch(getApiUrl('/me'), {
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
    const response = await fetch(getApiUrl('/login'), {
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
      window.location.href = buildAppUrl('/');
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
