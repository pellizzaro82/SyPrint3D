import { AppConfig } from '../models/AppConfig.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireRequestUserId } from '../utils/requestUser.js';

const DEFAULT_CONFIG = {
  chave: 'default',
  perfilEmpresa: {
    nomeFantasia: 'SyPrint3D',
    telefoneWhatsApp: '',
    email: '',
    endereco: '',
    logoDataUrl: '',
    logoNome: '',
  },
  preferenciasTela: {
    temaPadrao: 'claro',
    formatoData: 'pt-BR',
    mostrarCentavos: true,
  },
  orcamentos: {
    validadePadraoDias: 7,
    textoPadraoObservacoes: '',
    mensagemPadraoPdf: 'Proposta comercial para impressao 3D.',
  },
  impressaoPdf: {
    mostrarLogoNoPdf: true,
    corCabecalhoPdf: '#e9eef5',
    rodapePadrao: 'SyPrint3D',
  },
};

const MAX_LOGO_BYTES = 40 * 1024;

function sanitizeColor(value, fallback = '#e9eef5') {
  const text = String(value || '').trim();
  return /^#([0-9a-fA-F]{6})$/.test(text) ? text : fallback;
}

function sanitizeText(value, maxLength = 500) {
  return String(value || '').trim().slice(0, maxLength);
}

function estimateDataUrlBytes(dataUrl) {
  const payload = String(dataUrl || '').split(',')[1] || '';
  return Math.ceil((payload.length * 3) / 4);
}

function sanitizeLogoDataUrl(value) {
  const text = String(value || '').trim();
  if (!text) return '';

  const isValidImageDataUrl = /^data:image\/(png|jpeg|jpg|webp);base64,[a-zA-Z0-9+/=]+$/.test(text);
  if (!isValidImageDataUrl) return '';

  return estimateDataUrlBytes(text) <= MAX_LOGO_BYTES ? text : '';
}

async function normalizeLargeLogo(config) {
  const sanitizedLogo = sanitizeLogoDataUrl(config?.perfilEmpresa?.logoDataUrl);
  const currentLogo = String(config?.perfilEmpresa?.logoDataUrl || '');
  if (sanitizedLogo === currentLogo) return config;

  config.perfilEmpresa = {
    ...(config.perfilEmpresa || {}),
    logoDataUrl: sanitizedLogo,
    logoNome: sanitizedLogo ? String(config?.perfilEmpresa?.logoNome || '').trim().slice(0, 160) : '',
  };

  await config.save();
  return config;
}

function sanitizePayload(payload) {
  const source = payload && typeof payload === 'object' ? payload : {};
  const sanitizedLogoDataUrl = sanitizeLogoDataUrl(source?.perfilEmpresa?.logoDataUrl);
  const sanitizedLogoNome = sanitizeText(source?.perfilEmpresa?.logoNome, 160);

  return {
    perfilEmpresa: {
      nomeFantasia: sanitizeText(source?.perfilEmpresa?.nomeFantasia, 80) || DEFAULT_CONFIG.perfilEmpresa.nomeFantasia,
      telefoneWhatsApp: sanitizeText(source?.perfilEmpresa?.telefoneWhatsApp, 30),
      email: sanitizeText(source?.perfilEmpresa?.email, 120),
      endereco: sanitizeText(source?.perfilEmpresa?.endereco, 220),
      logoDataUrl: sanitizedLogoDataUrl,
      logoNome: sanitizedLogoDataUrl ? sanitizedLogoNome : '',
    },
    preferenciasTela: {
      temaPadrao: String(source?.preferenciasTela?.temaPadrao || DEFAULT_CONFIG.preferenciasTela.temaPadrao) === 'escuro' ? 'escuro' : 'claro',
      formatoData: String(source?.preferenciasTela?.formatoData || DEFAULT_CONFIG.preferenciasTela.formatoData) === 'en-US' ? 'en-US' : 'pt-BR',
      mostrarCentavos: String(source?.preferenciasTela?.mostrarCentavos) !== 'false' && source?.preferenciasTela?.mostrarCentavos !== false,
    },
    orcamentos: {
      validadePadraoDias: Math.min(365, Math.max(1, Number(source?.orcamentos?.validadePadraoDias || DEFAULT_CONFIG.orcamentos.validadePadraoDias))),
      textoPadraoObservacoes: sanitizeText(source?.orcamentos?.textoPadraoObservacoes, 800),
      mensagemPadraoPdf: sanitizeText(source?.orcamentos?.mensagemPadraoPdf, 240) || DEFAULT_CONFIG.orcamentos.mensagemPadraoPdf,
    },
    impressaoPdf: {
      mostrarLogoNoPdf: String(source?.impressaoPdf?.mostrarLogoNoPdf) !== 'false' && source?.impressaoPdf?.mostrarLogoNoPdf !== false,
      corCabecalhoPdf: sanitizeColor(source?.impressaoPdf?.corCabecalhoPdf, DEFAULT_CONFIG.impressaoPdf.corCabecalhoPdf),
      rodapePadrao: sanitizeText(source?.impressaoPdf?.rodapePadrao, 140) || DEFAULT_CONFIG.impressaoPdf.rodapePadrao,
    },
  };
}

async function ensureConfigDocument(userId) {
  const chave = `default:${userId}`;
  let config = await AppConfig.findOne({ ownerUserId: userId, chave });
  if (config) return config;

  config = await AppConfig.create({ ...DEFAULT_CONFIG, ownerUserId: userId, chave });
  return config;
}

export const getConfiguracoes = asyncHandler(async (req, res) => {
  const userId = requireRequestUserId(req);
  const config = await ensureConfigDocument(userId);
  await normalizeLargeLogo(config);
  res.json({
    ...DEFAULT_CONFIG,
    ...config.toObject(),
    perfilEmpresa: {
      ...DEFAULT_CONFIG.perfilEmpresa,
      ...(config.perfilEmpresa || {}),
    },
    preferenciasTela: {
      ...DEFAULT_CONFIG.preferenciasTela,
      ...(config.preferenciasTela || {}),
    },
    orcamentos: {
      ...DEFAULT_CONFIG.orcamentos,
      ...(config.orcamentos || {}),
    },
    impressaoPdf: {
      ...DEFAULT_CONFIG.impressaoPdf,
      ...(config.impressaoPdf || {}),
    },
  });
});

export const updateConfiguracoes = asyncHandler(async (req, res) => {
  const userId = requireRequestUserId(req);
  const config = await ensureConfigDocument(userId);
  const sanitized = sanitizePayload(req.body || {});

  config.perfilEmpresa = sanitized.perfilEmpresa;
  config.preferenciasTela = sanitized.preferenciasTela;
  config.orcamentos = sanitized.orcamentos;
  config.impressaoPdf = sanitized.impressaoPdf;

  await config.save();

  res.json({
    ...DEFAULT_CONFIG,
    ...config.toObject(),
    perfilEmpresa: {
      ...DEFAULT_CONFIG.perfilEmpresa,
      ...(config.perfilEmpresa || {}),
    },
    preferenciasTela: {
      ...DEFAULT_CONFIG.preferenciasTela,
      ...(config.preferenciasTela || {}),
    },
    orcamentos: {
      ...DEFAULT_CONFIG.orcamentos,
      ...(config.orcamentos || {}),
    },
    impressaoPdf: {
      ...DEFAULT_CONFIG.impressaoPdf,
      ...(config.impressaoPdf || {}),
    },
  });
});
