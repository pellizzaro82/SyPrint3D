import { Order } from '../models/Order.js';
import { Filament } from '../models/Filament.js';
import { Printer } from '../models/Printer.js';
import {
  extractIncomingPhotoPayload,
  hydratePhotoFieldsFromUploads,
  upsertUploadsFromDataUrls,
} from '../services/uploadService.js';
import { diffRemovedUploadIds, removeUnreferencedUploads } from '../services/uploadCleanupService.js';
import {
  calcularCustosImpressao,
  sugerirFilamentoParaPedido,
  sugerirImpressoraParaPedido,
} from '../services/printCostService.js';
import { formatOrderCode, getNextSequenceValue } from '../services/sequenceService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const statusFlow = ['orcamento', 'aprovado', 'em_producao', 'finalizacao', 'enviado', 'entregue'];
const MAX_PROJECT_PHOTOS = 5;
const ORDER_ITEM_MUTATION_FIELDS = [
  'produto',
  'quantidade',
  'material',
  'cor',
  'pesoEstimado',
  'tempoImpressao',
  'valor',
  'filamento',
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

function buildLegacyOrderItem(source = {}) {
  return {
    produto: source.produto,
    quantidade: source.quantidade,
    material: source.material,
    cor: source.cor,
    pesoEstimado: source.pesoEstimado,
    tempoImpressao: source.tempoImpressao,
    valor: source.valor,
    filamento: source.filamento,
    impressora: source.impressora,
    custos: source.custos,
    observacoes: source.observacoes,
  };
}

function hasIncomingItemMutation(payload = {}) {
  return ORDER_ITEM_MUTATION_FIELDS.some((field) => hasOwn(payload, field));
}

function normalizeOrderItems(source, { filamentos = [], impressoras = [] } = {}) {
  const rawItems = Array.isArray(source?.itens) && source.itens.length ? source.itens : [buildLegacyOrderItem(source)];

  return rawItems
    .filter((item) => item && (asRefId(item.produto) || asTrimmedString(item.material) || asPositiveNumber(item.valor) > 0))
    .map((item) => {
      const produto = asRefId(item.produto);
      const quantidade = Math.max(1, asPositiveNumber(item.quantidade, 1));
      const material = asTrimmedString(item.material || 'PLA', 'PLA');
      const cor = asTrimmedString(item.cor || '', '');
      const pesoEstimado = Math.max(0, asPositiveNumber(item.pesoEstimado, 0));
      const tempoImpressao = Math.max(0, asPositiveNumber(item.tempoImpressao, 0));
      const valor = Math.max(0, asPositiveNumber(item.valor, 0));
      const filamentoRef = asRefId(item.filamento);
      const impressoraRef = asRefId(item.impressora);
      const filamentoSelecionado =
        filamentos.find((entry) => String(entry?._id || '') === String(filamentoRef || '')) ||
        sugerirFilamentoParaPedido({
          filamentos,
          pesoEstimado,
          corDesejada: cor,
          materialDesejado: material,
        });
      const impressoraSelecionada =
        impressoras.find((entry) => String(entry?._id || '') === String(impressoraRef || '')) ||
        sugerirImpressoraParaPedido({ impressoras });

      const custos = calcularCustosImpressao({
        ...item,
        pesoEstimado,
        tempoImpressao,
        valor,
        material,
        custos: {
          ...item?.custos,
          filamentoKg: filamentoSelecionado?.precoPorKg || item?.custos?.filamentoKg || 120,
        },
      });

      return {
        produto,
        quantidade,
        material,
        cor,
        pesoEstimado,
        tempoImpressao,
        valor,
        filamento: filamentoRef || filamentoSelecionado?._id,
        impressora: impressoraRef || impressoraSelecionada?._id,
        custos,
        observacoes: asTrimmedString(item?.observacoes || '', ''),
      };
    });
}

function summarizeOrderItems(items = [], fallback = {}) {
  const firstItem = items[0] || buildLegacyOrderItem(fallback);
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
    material: firstItem?.material || fallback.material || 'PLA',
    cor: firstItem?.cor || fallback.cor || '',
    pesoEstimado: Number(items.reduce((sum, item) => sum + asPositiveNumber(item?.pesoEstimado, 0), 0).toFixed(2)),
    tempoImpressao: Number(items.reduce((sum, item) => sum + asPositiveNumber(item?.tempoImpressao, 0), 0).toFixed(2)),
    valor: Number(items.reduce((sum, item) => sum + asPositiveNumber(item?.valor, 0), 0).toFixed(2)),
    filamento: firstItem?.filamento || fallback.filamento,
    impressora: firstItem?.impressora || fallback.impressora,
    custos: {
      filamentoKg: Number(aggregateCosts.filamentoKg.toFixed(2)),
      custoFilamento: Number(aggregateCosts.custoFilamento.toFixed(2)),
      energiaKwh: Number(aggregateCosts.energiaKwh.toFixed(3)),
      custoKwh: Number((items.length ? aggregateCosts.custoKwh / items.length : asPositiveNumber(fallback?.custos?.custoKwh, 0.95)).toFixed(2)),
      custoEnergia: Number(aggregateCosts.custoEnergia.toFixed(2)),
      custoDesgasteHora: Number((items.length ? aggregateCosts.custoDesgasteHora / items.length : asPositiveNumber(fallback?.custos?.custoDesgasteHora, 0.5)).toFixed(2)),
      custoDesgaste: Number(aggregateCosts.custoDesgaste.toFixed(2)),
      custoTotal: Number(aggregateCosts.custoTotal.toFixed(2)),
      lucroReal: Number(aggregateCosts.lucroReal.toFixed(2)),
    },
  };
}

function buildOrderWritePayload(source, { filamentos = [], impressoras = [] } = {}) {
  const items = normalizeOrderItems(source, { filamentos, impressoras });
  return summarizeOrderItems(items, source);
}

function attachResponseItems(order) {
  const hydrated = hydratePhotoFieldsFromUploads(order);
  const plain = hydrated?.toObject ? hydrated.toObject() : hydrated;
  const itens = Array.isArray(plain?.itens) && plain.itens.length ? plain.itens : [buildLegacyOrderItem(plain)];
  return {
    ...plain,
    itens,
  };
}

function statusToLane(status) {
  if (status === 'orcamento') return 'recebido';
  if (status === 'aprovado' || status === 'em_producao') return 'imprimindo';
  if (status === 'finalizacao') return 'acabamento';
  if (status === 'enviado') return 'enviado';
  if (status === 'entregue') return 'entregue';
  return 'recebido';
}

function laneToStatus(lane) {
  // "Recebido" no quadro de pedidos nao deve regredir para orcamento.
  if (lane === 'recebido') return 'aprovado';
  if (lane === 'imprimindo') return 'em_producao';
  if (lane === 'acabamento') return 'finalizacao';
  if (lane === 'pronto') return 'aprovado';
  if (lane === 'entrega') return 'enviado';
  if (lane === 'enviado') return 'enviado';
  if (lane === 'entregue') return 'entregue';
  return null;
}

function canTransition(currentStatus, nextStatus) {
  const nextIndex = statusFlow.indexOf(nextStatus);
  return nextIndex !== -1;
}

async function persistSharedUploads(payload) {
  const extracted = extractIncomingPhotoPayload(payload, MAX_PROJECT_PHOTOS, 'pedido');
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

export const listOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate('cliente', 'nome whatsapp')
    .populate('produto', 'nome categoria precoFinal')
    .populate('itens.produto', 'nome categoria precoFinal')
    .populate('filamento', 'tipo material cor precoPorKg estoqueAtual')
    .populate('itens.filamento', 'tipo material cor precoPorKg estoqueAtual')
    .populate('impressora', 'nome modelo uptimePercentual horasUso')
    .populate('itens.impressora', 'nome modelo uptimePercentual horasUso')
    .populate('fotosPedidoUploads', 'dataBase64 nomeArquivo')
    .sort({ createdAt: -1 });

  res.json(orders.map((item) => attachResponseItems(item)));
});

export const createOrder = asyncHandler(async (req, res) => {
  const photosResult = await persistSharedUploads(req.body);
  if (photosResult.error) {
    return res.status(400).json({ message: photosResult.error });
  }

  const numeroPedido = await getNextSequenceValue('order_number');
  const codigoPedido = formatOrderCode(numeroPedido);

  const [filamentos, impressoras] = await Promise.all([Filament.find(), Printer.find()]);

  const itemPayload = buildOrderWritePayload(req.body, { filamentos, impressoras });

  const statusSolicitado = req.body.status;
  const statusInicial = statusSolicitado && statusSolicitado !== 'orcamento' ? statusSolicitado : 'aprovado';
  const laneInicial = req.body.lane || 'recebido';

  const order = await Order.create({
    ...req.body,
    ...itemPayload,
    numeroPedido,
    codigoPedido,
    status: statusInicial,
    lane: laneInicial,
    historicoStatus: [{ status: statusInicial }],
  });

  const populated = await Order.findById(order._id)
    .populate('cliente', 'nome whatsapp')
    .populate('produto', 'nome categoria precoFinal')
    .populate('itens.produto', 'nome categoria precoFinal')
    .populate('filamento', 'tipo material cor precoPorKg estoqueAtual')
    .populate('itens.filamento', 'tipo material cor precoPorKg estoqueAtual')
    .populate('impressora', 'nome modelo uptimePercentual horasUso')
    .populate('itens.impressora', 'nome modelo uptimePercentual horasUso')
    .populate('fotosPedidoUploads', 'dataBase64 nomeArquivo');

  res.status(201).json(attachResponseItems(populated));
});

export const updateOrder = asyncHandler(async (req, res) => {
  const photosResult = await persistSharedUploads(req.body);
  if (photosResult.error) {
    return res.status(400).json({ message: photosResult.error });
  }

  const existing = await Order.findById(req.params.id);

  if (!existing) {
    return res.status(404).json({ message: 'Pedido nao encontrado.' });
  }

  const existingUploadRefs = Array.isArray(existing.fotosPedidoUploads) ? existing.fotosPedidoUploads : [];

  const statusFromLane = req.body.lane ? laneToStatus(req.body.lane) : null;
  const nextStatus = req.body.status || statusFromLane;

  if (nextStatus && !canTransition(existing.status, nextStatus)) {
    return res.status(400).json({
      message: 'Transicao de status invalida para o fluxo de producao.',
    });
  }

  const shouldRewriteItems = hasIncomingItemMutation(req.body);
  const [filamentos, impressoras] = shouldRewriteItems ? await Promise.all([Filament.find(), Printer.find()]) : [[], []];
  const itemPayload = shouldRewriteItems ? buildOrderWritePayload(req.body, { filamentos, impressoras }) : {};
  const updatePayload = {
    ...req.body,
    ...itemPayload,
    status: nextStatus || existing.status,
    lane: req.body.lane || existing.lane || statusToLane(nextStatus || existing.status),
  };

  if (photosResult.hasPhotoUpdate) {
    updatePayload.$unset = {
      fotoPedido: '',
      fotoPedidoNome: '',
      fotosPedido: '',
    };
  }

  if (nextStatus && nextStatus !== existing.status) {
    updatePayload.$push = {
      historicoStatus: {
        status: nextStatus,
      },
    };
  }

  const updated = await Order.findByIdAndUpdate(req.params.id, updatePayload, {
    new: true,
    runValidators: true,
  })
    .populate('cliente', 'nome whatsapp')
    .populate('produto', 'nome categoria precoFinal')
    .populate('itens.produto', 'nome categoria precoFinal')
    .populate('filamento', 'tipo material cor precoPorKg estoqueAtual')
    .populate('itens.filamento', 'tipo material cor precoPorKg estoqueAtual')
    .populate('impressora', 'nome modelo uptimePercentual horasUso')
    .populate('itens.impressora', 'nome modelo uptimePercentual horasUso')
    .populate('fotosPedidoUploads', 'dataBase64 nomeArquivo');

  if (photosResult.hasPhotoUpdate) {
    const removedUploadIds = diffRemovedUploadIds(existingUploadRefs, req.body.fotosPedidoUploads || []);
    await removeUnreferencedUploads(removedUploadIds);
  }

  res.json(attachResponseItems(updated));
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const deleted = await Order.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Pedido não encontrado' });
  }

  await removeUnreferencedUploads(deleted.fotosPedidoUploads || []);

  res.status(204).send();
});
