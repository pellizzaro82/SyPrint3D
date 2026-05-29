import Orcamento from '../models/Orcamento.js';
import {
  extractIncomingPhotoPayload,
  hydratePhotoFieldsFromUploads,
  upsertUploadsFromDataUrls,
} from '../services/uploadService.js';
import { diffRemovedUploadIds, removeUnreferencedUploads } from '../services/uploadCleanupService.js';
import { calcularCustosImpressao } from '../services/printCostService.js';
import { formatOrderCode, getNextSequenceValue } from '../services/sequenceService.js';
import { withOwnerPayload, withOwnerScope } from '../utils/requestUser.js';

const MAX_PROJECT_PHOTOS = 5;
const ORCAMENTO_ITEM_MUTATION_FIELDS = [
  'produto',
  'quantidade',
  'material',
  'cor',
  'pesoEstimado',
  'tempoImpressao',
  'valor',
  'impressora',
  'custos',
  'itens',
];

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function asRefId(value) {
  if (!value) return undefined;
  if (typeof value === 'string' || typeof value === 'number') return value;
  return value._id || value.id || undefined;
}

function asTrimmedString(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function asPositiveNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function buildLegacyOrcamentoItem(source = {}) {
  return {
    produto: source.produto,
    quantidade: source.quantidade,
    impressora: source.impressora,
    material: source.material,
    cor: source.cor,
    pesoEstimado: source.pesoEstimado,
    tempoImpressao: source.tempoImpressao,
    valor: source.valor,
    custos: source.custos,
    observacoes: source.observacoes,
  };
}

function hasIncomingItemMutation(payload = {}) {
  return ORCAMENTO_ITEM_MUTATION_FIELDS.some((field) => hasOwn(payload, field));
}

function normalizeOrcamentoItems(source) {
  const rawItems = Array.isArray(source?.itens) && source.itens.length ? source.itens : [buildLegacyOrcamentoItem(source)];

  return rawItems
    .filter((item) => item && (asRefId(item.produto) || asTrimmedString(item.material) || asPositiveNumber(item.valor) > 0))
    .map((item) => {
      const quantidade = Math.max(1, asPositiveNumber(item.quantidade, 1));
      const material = asTrimmedString(item.material || 'PLA', 'PLA');
      const pesoEstimado = Math.max(0, asPositiveNumber(item.pesoEstimado, 0));
      const tempoImpressao = Math.max(0, asPositiveNumber(item.tempoImpressao, 0));
      const valor = Math.max(0, asPositiveNumber(item.valor, 0));

      return {
        produto: asRefId(item.produto),
        quantidade,
        impressora: asRefId(item.impressora),
        material,
        cor: asTrimmedString(item.cor || '', ''),
        pesoEstimado,
        tempoImpressao,
        valor,
        custos: calcularCustosImpressao({
          ...item,
          quantidade,
          material,
          pesoEstimado,
          tempoImpressao,
          valor,
          custos: item?.custos,
        }),
        observacoes: asTrimmedString(item?.observacoes || '', ''),
      };
    });
}

function summarizeOrcamentoItems(items = [], fallback = {}) {
  const firstItem = items[0] || buildLegacyOrcamentoItem(fallback);
  const aggregateCosts = items.reduce(
    (acc, item) => {
      acc.filamentoKg += asPositiveNumber(item?.custos?.filamentoKg, 0);
      acc.custoFilamento += asPositiveNumber(item?.custos?.custoFilamento, 0);
      acc.energiaKwh += asPositiveNumber(item?.custos?.energiaKwh, 0);
      acc.custoKwh += asPositiveNumber(item?.custos?.custoKwh, 0);
      acc.custoEnergia += asPositiveNumber(item?.custos?.custoEnergia, 0);
      acc.custoDesgasteHora += asPositiveNumber(item?.custos?.custoDesgasteHora, 0);
      acc.custoDesgaste += asPositiveNumber(item?.custos?.custoDesgaste, 0);
      acc.custoTotal += asPositiveNumber(item?.custos?.custoTotal, 0);
      acc.lucroReal += asPositiveNumber(item?.custos?.lucroReal, 0);
      return acc;
    },
    {
      filamentoKg: 0,
      custoFilamento: 0,
      energiaKwh: 0,
      custoKwh: 0,
      custoEnergia: 0,
      custoDesgasteHora: 0,
      custoDesgaste: 0,
      custoTotal: 0,
      lucroReal: 0,
    }
  );

  return {
    itens: items,
    produto: firstItem?.produto,
    quantidade: items.reduce((sum, item) => sum + Math.max(1, asPositiveNumber(item?.quantidade, 1)), 0) || 1,
    impressora: firstItem?.impressora || fallback.impressora,
    material: firstItem?.material || fallback.material || 'PLA',
    cor: firstItem?.cor || fallback.cor || '',
    pesoEstimado: Number(items.reduce((sum, item) => sum + asPositiveNumber(item?.pesoEstimado, 0), 0).toFixed(2)),
    tempoImpressao: Number(items.reduce((sum, item) => sum + asPositiveNumber(item?.tempoImpressao, 0), 0).toFixed(2)),
    valor: Number(items.reduce((sum, item) => sum + asPositiveNumber(item?.valor, 0), 0).toFixed(2)),
    custos: {
      filamentoKg: Number(aggregateCosts.filamentoKg.toFixed(2)),
      custoFilamento: Number(aggregateCosts.custoFilamento.toFixed(2)),
      energiaKwh: Number(aggregateCosts.energiaKwh.toFixed(3)),
      custoKwh: Number((items.length ? aggregateCosts.custoKwh / items.length : 0.95).toFixed(2)),
      custoEnergia: Number(aggregateCosts.custoEnergia.toFixed(2)),
      custoDesgasteHora: Number((items.length ? aggregateCosts.custoDesgasteHora / items.length : 0.5).toFixed(2)),
      custoDesgaste: Number(aggregateCosts.custoDesgaste.toFixed(2)),
      custoTotal: Number(aggregateCosts.custoTotal.toFixed(2)),
      lucroReal: Number(aggregateCosts.lucroReal.toFixed(2)),
    },
  };
}

function buildOrcamentoWritePayload(source) {
  const items = normalizeOrcamentoItems(source);
  return summarizeOrcamentoItems(items, source);
}

function attachResponseItems(orcamento) {
  const hydrated = hydratePhotoFieldsFromUploads(orcamento);
  const plain = hydrated?.toObject ? hydrated.toObject() : hydrated;
  const itens = Array.isArray(plain?.itens) && plain.itens.length ? plain.itens : [buildLegacyOrcamentoItem(plain)];
  return {
    ...plain,
    itens,
  };
}

async function ensureOrcamentoCode(payload, existing) {
  const numeroExistente = Number(existing?.numeroOrcamento || payload?.numeroOrcamento || 0);
  const codigoExistente = String(existing?.codigoOrcamento || payload?.codigoOrcamento || '').trim();

  if (numeroExistente && codigoExistente) {
    payload.numeroOrcamento = numeroExistente;
    payload.codigoOrcamento = codigoExistente;
    return;
  }

  if (numeroExistente) {
    payload.numeroOrcamento = numeroExistente;
    payload.codigoOrcamento = formatOrderCode(numeroExistente);
    return;
  }

  const numeroOrcamento = await getNextSequenceValue('quote_number');
  payload.numeroOrcamento = numeroOrcamento;
  payload.codigoOrcamento = formatOrderCode(numeroOrcamento);
}

async function ensureOrcamentoDocumentCode(orcamento) {
  if (!orcamento) return orcamento;
  if (orcamento.numeroOrcamento && orcamento.codigoOrcamento) return orcamento;

  const payload = {};
  await ensureOrcamentoCode(payload, orcamento);
  orcamento.numeroOrcamento = payload.numeroOrcamento;
  orcamento.codigoOrcamento = payload.codigoOrcamento;
  await orcamento.save();
  return orcamento;
}

async function persistSharedUploads(payload) {
  const extracted = extractIncomingPhotoPayload(payload, MAX_PROJECT_PHOTOS, 'orcamento');
  if (extracted.error) return extracted;

  delete payload.fotosPedido;
  delete payload.fotoPedido;
  delete payload.fotoPedidoNome;

  if (!extracted.hasPhotoUpdate) {
    return { hasPhotoUpdate: false };
  }

  const uploaded = await upsertUploadsFromDataUrls({
    dataUrls: extracted.photos,
    fileNames: extracted.names,
  });

  if (uploaded.error) {
    return { error: uploaded.error };
  }

  payload.fotosPedidoUploads = uploaded.refs;
  payload.fotosPedidoNomes = uploaded.names;

  return { hasPhotoUpdate: true };
}

export const getOrcamentos = async (req, res) => {
  const orcamentos = await Orcamento.find(withOwnerScope(req))
    .populate('cliente')
    .populate('produto')
    .populate('itens.produto')
    .populate('impressora')
    .populate('itens.impressora')
    .populate('fotosPedidoUploads', 'dataBase64 nomeArquivo');

  const normalized = await Promise.all(orcamentos.map((item) => ensureOrcamentoDocumentCode(item)));
  res.json(normalized.map((item) => attachResponseItems(item)));
};

export const createOrcamento = async (req, res) => {
  const photosResult = await persistSharedUploads(req.body);
  if (photosResult.error) {
    return res.status(400).json({ message: photosResult.error });
  }

  const data = req.body;
  Object.assign(data, buildOrcamentoWritePayload(data));
  await ensureOrcamentoCode(data);
  const orcamento = new Orcamento(withOwnerPayload(req, data));
  await orcamento.save();

  const populated = await Orcamento.findById(orcamento._id)
    .populate('cliente')
    .populate('produto')
    .populate('itens.produto')
    .populate('impressora')
    .populate('itens.impressora')
    .populate('fotosPedidoUploads', 'dataBase64 nomeArquivo');

  res.status(201).json(attachResponseItems(populated));
};

export const updateOrcamento = async (req, res) => {
  const { id } = req.params;
  const photosResult = await persistSharedUploads(req.body);
  if (photosResult.error) {
    return res.status(400).json({ message: photosResult.error });
  }

  const existing = await Orcamento.findOne(withOwnerScope(req, { _id: id })).select('fotosPedidoUploads numeroOrcamento codigoOrcamento');
  if (!existing) {
    return res.status(404).json({ message: 'Orcamento nao encontrado.' });
  }

  const existingUploadRefs = Array.isArray(existing.fotosPedidoUploads) ? existing.fotosPedidoUploads : [];

  const data = { ...req.body };
  if (hasIncomingItemMutation(req.body)) {
    Object.assign(data, buildOrcamentoWritePayload(data));
  }
  await ensureOrcamentoCode(data, existing);
  if (photosResult.hasPhotoUpdate) {
    data.$unset = {
      fotoPedido: '',
      fotoPedidoNome: '',
      fotosPedido: '',
    };
  }

  const orcamento = await Orcamento.findOneAndUpdate(withOwnerScope(req, { _id: id }), data, { new: true })
    .populate('cliente')
    .populate('produto')
    .populate('itens.produto')
    .populate('impressora')
    .populate('itens.impressora')
    .populate('fotosPedidoUploads', 'dataBase64 nomeArquivo');

  if (photosResult.hasPhotoUpdate) {
    const removedUploadIds = diffRemovedUploadIds(existingUploadRefs, req.body.fotosPedidoUploads || []);
    await removeUnreferencedUploads(removedUploadIds);
  }

  res.json(attachResponseItems(orcamento));
};

export const deleteOrcamento = async (req, res) => {
  const { id } = req.params;
  const deleted = await Orcamento.findOneAndDelete(withOwnerScope(req, { _id: id }));
  if (!deleted) {
    return res.status(404).json({ message: 'Orcamento nao encontrado.' });
  }

  await removeUnreferencedUploads(deleted.fotosPedidoUploads || []);

  res.status(204).end();
};
