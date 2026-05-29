const DEFAULT_TOAST_DURATION_MS = 4200;
const MAX_VISIBLE_TOASTS = 4;
const TOAST_VOLUME_MULTIPLIER = 4;
const TOAST_MASTER_GAIN = 2;

let toastContainer = null;
let toastAudioContext = null;
let toastCompressorNode = null;
let toastMasterGainNode = null;

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function ensureToastContainer() {
  if (toastContainer && document.body.contains(toastContainer)) {
    return toastContainer;
  }

  const container = document.createElement('div');
  container.id = 'syprintToastContainer';
  container.className = 'toast-container';
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('aria-atomic', 'false');
  document.body.appendChild(container);
  toastContainer = container;
  return container;
}

function scaledGain(gainLevel) {
  const baseGain = Math.max(0.0001, Number(gainLevel || 0.0001));
  return Math.min(0.36, baseGain * TOAST_VOLUME_MULTIPLIER);
}

function ensureToastAudioBus() {
  if (!toastAudioContext) return null;
  if (toastCompressorNode && toastMasterGainNode) {
    return { compressor: toastCompressorNode, masterGain: toastMasterGainNode };
  }

  toastCompressorNode = toastAudioContext.createDynamicsCompressor();
  toastCompressorNode.threshold.value = -28;
  toastCompressorNode.knee.value = 24;
  toastCompressorNode.ratio.value = 10;
  toastCompressorNode.attack.value = 0.003;
  toastCompressorNode.release.value = 0.2;

  toastMasterGainNode = toastAudioContext.createGain();
  toastMasterGainNode.gain.value = TOAST_MASTER_GAIN;

  toastCompressorNode.connect(toastMasterGainNode);
  toastMasterGainNode.connect(toastAudioContext.destination);

  return { compressor: toastCompressorNode, masterGain: toastMasterGainNode };
}

function playToastSound(type = 'info') {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!toastAudioContext) toastAudioContext = new AudioContextClass();

    if (toastAudioContext.state === 'suspended') {
      toastAudioContext.resume().catch(() => {});
    }

    const audioBus = ensureToastAudioBus();
    if (!audioBus?.compressor) return;

    const startBaseTime = toastAudioContext.currentTime + (toastAudioContext.state === 'suspended' ? 0.06 : 0);
    const beep = (frequency, startOffset, duration, gainLevel) => {
      const mainOscillator = toastAudioContext.createOscillator();
      const layerOscillator = toastAudioContext.createOscillator();
      const gain = toastAudioContext.createGain();

      const startTime = startBaseTime + startOffset;

      mainOscillator.type = 'triangle';
      layerOscillator.type = 'sine';

      mainOscillator.frequency.setValueAtTime(frequency, startTime);
      layerOscillator.frequency.setValueAtTime(frequency * 2, startTime);
      layerOscillator.detune.setValueAtTime(5, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(scaledGain(gainLevel), startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      mainOscillator.connect(gain);
      layerOscillator.connect(gain);
      gain.connect(audioBus.compressor);

      mainOscillator.start(startTime);
      layerOscillator.start(startTime);
      mainOscillator.stop(startTime + duration + 0.025);
      layerOscillator.stop(startTime + duration + 0.025);
    };

    if (type === 'error') {
      beep(220, 0, 0.16, 0.03);
      beep(180, 0.18, 0.2, 0.026);
      return;
    }

    if (type === 'success') {
      beep(720, 0, 0.08, 0.02);
      beep(980, 0.1, 0.12, 0.024);
      return;
    }

    if (type === 'warning') {
      beep(520, 0, 0.1, 0.02);
      beep(520, 0.12, 0.1, 0.02);
      return;
    }

    beep(640, 0, 0.11, 0.018);
  } catch {
    // Ignore audio errors to keep the UI flow resilient.
  }
}

export function inferToastType(message) {
  const text = String(message || '').toLowerCase();

  if (/(sucesso|salv|atualizad|criad|removid|concluid)/.test(text)) return 'success';
  if (/(erro|falha|nao foi possivel|invalido|sem estoque|negad|bloquead)/.test(text)) return 'error';
  if (/(atencao|aviso|limite|alerta)/.test(text)) return 'warning';
  return 'info';
}

export function showToast(message, options = {}) {
  const text = String(message || '').trim();
  if (!text) return;

  const type = ['success', 'error', 'warning', 'info'].includes(options.type)
    ? options.type
    : inferToastType(text);
  const duration = Math.max(1800, Number(options.duration || DEFAULT_TOAST_DURATION_MS));

  const container = ensureToastContainer();
  const toast = document.createElement('article');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.innerHTML = `
    <span class="toast-indicator" aria-hidden="true"></span>
    <p class="toast-message">${escapeHtml(text)}</p>
    <button type="button" class="toast-close" aria-label="Fechar notificacao">x</button>
  `;

  const closeToast = () => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    window.setTimeout(() => {
      toast.remove();
    }, 230);
  };

  const closeButton = toast.querySelector('.toast-close');
  if (closeButton) {
    closeButton.addEventListener('click', closeToast);
  }

  container.appendChild(toast);
  while (container.children.length > MAX_VISIBLE_TOASTS) {
    const oldest = container.firstElementChild;
    if (!oldest) break;
    oldest.remove();
  }

  window.requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  if (options.playSound !== false) {
    playToastSound(type);
  }

  window.setTimeout(closeToast, duration);
}

export function installToastAlerts() {
  if (window.__syprint_toast_alerts_installed__) return;
  window.__syprint_toast_alerts_installed__ = true;

  window.alert = (message) => {
    showToast(message, { type: inferToastType(message) });
  };
}
