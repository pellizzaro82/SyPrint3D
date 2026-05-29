import { FinanceEntry } from '../models/FinanceEntry.js';
import { Material } from '../models/Material.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { removeUnreferencedUploads } from '../services/uploadCleanupService.js';
import { upsertUploadsFromDataUrls } from '../services/uploadService.js';
import { withOwnerPayload, withOwnerScope } from '../utils/requestUser.js';
import zlib from 'zlib';

const MAX_NFE_BYTES = 6 * 1024 * 1024;

function parseDataUrl(dataUrl) {
  const text = String(dataUrl || '').trim();
  const match = text.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;

  return {
    mimeType: match[1],
    base64: match[2],
    dataUrl: text,
  };
}

function hydrateNfeDataUrl(upload) {
  if (!upload || typeof upload !== 'object') return '';
  const dataBase64 = String(upload.dataBase64 || '').trim();
  if (!dataBase64) return '';

  if (upload.mimeType !== 'application/gzip') {
    return dataBase64;
  }

  const parsed = parseDataUrl(dataBase64);
  if (!parsed) return '';

  try {
    const compressedBytes = Buffer.from(parsed.base64, 'base64');
    const pdfBytes = zlib.gunzipSync(compressedBytes);
    return `data:application/pdf;base64,${pdfBytes.toString('base64')}`;
  } catch {
    return '';
  }
}

async function attachNfeUploadIfAny(payload, previousEntry = null) {
  const hasNfeField = Object.prototype.hasOwnProperty.call(payload, 'nfeArquivo');
  const shouldRemoveNfe = String(payload.removerNfe || '').toLowerCase() === 'true';

  const previousUploadId = previousEntry?.nfeUpload ? String(previousEntry.nfeUpload) : '';
  const cleanupCandidates = [];

  if (shouldRemoveNfe && previousUploadId) {
    payload.nfeUpload = null;
    payload.nfeNome = '';
    payload.nfeMimeType = '';
    payload.nfeTamanhoBytes = 0;
    cleanupCandidates.push(previousUploadId);
  }

  if (hasNfeField) {
    const rawDataUrl = String(payload.nfeArquivo || '').trim();
    if (!rawDataUrl) {
      if (previousUploadId && !cleanupCandidates.includes(previousUploadId)) {
        cleanupCandidates.push(previousUploadId);
      }
      payload.nfeUpload = null;
      payload.nfeNome = '';
      payload.nfeMimeType = '';
      payload.nfeTamanhoBytes = 0;
    } else {
      const parsed = parseDataUrl(rawDataUrl);
      if (!parsed || parsed.mimeType !== 'application/pdf') {
        return { error: 'A NFe deve ser enviada em PDF (application/pdf).' };
      }

      let bytes;
      try {
        bytes = Buffer.from(parsed.base64, 'base64');
      } catch {
        return { error: 'Nao foi possivel processar o arquivo PDF da NFe.' };
      }

      if (bytes.length > MAX_NFE_BYTES) {
        return { error: 'A NFe excede o limite de 6 MB.' };
      }

      const uploadName = String(payload.nfeArquivoNome || 'nfe-compra.pdf').trim() || 'nfe-compra.pdf';
      const uploaded = await upsertUploadsFromDataUrls({
        dataUrls: [rawDataUrl],
        fileNames: [uploadName],
      });

      if (uploaded.error) {
        return { error: uploaded.error };
      }

      const uploadRef = uploaded.refs?.[0];
      if (uploadRef) {
        payload.nfeUpload = uploadRef;
        payload.nfeNome = uploaded.names?.[0] || uploadName;
        payload.nfeMimeType = 'application/pdf';
        payload.nfeTamanhoBytes = bytes.length;

        if (previousUploadId && String(uploadRef) !== previousUploadId && !cleanupCandidates.includes(previousUploadId)) {
          cleanupCandidates.push(previousUploadId);
        }
      }
    }
  }

  delete payload.nfeArquivo;
  delete payload.nfeArquivoNome;
  delete payload.removerNfe;

  return { cleanupCandidates };
}

function parseQuantity(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function stockDeltaByMaterial(entry) {
  if (!entry || entry.tipo !== 'saida' || !entry.material) return new Map();
  const materialId =
    typeof entry.material === 'object' && entry.material !== null
      ? String(entry.material._id || '')
      : String(entry.material || '');
  if (!materialId) return new Map();
  return new Map([[materialId, parseQuantity(entry.quantidade)]]);
}

async function applyMaterialDelta(materialId, delta, req) {
  const amount = Number(delta || 0);
  if (!materialId || amount === 0) return;

  const material = await Material.findOne(withOwnerScope(req, { _id: materialId })).select('quantidadeDisponivel estoqueAtual');
  if (!material) return;

  const quantidadeDisponivelAtual = Number(material.quantidadeDisponivel || 0);
  const estoqueAtual = Number(material.estoqueAtual || 0);

  material.quantidadeDisponivel = Math.max(0, quantidadeDisponivelAtual + amount);
  material.estoqueAtual = Math.max(0, estoqueAtual + amount);

  await material.save();
}

async function reconcileMaterialStock(previousEntry, nextEntry, req) {
  const previous = stockDeltaByMaterial(previousEntry);
  const next = stockDeltaByMaterial(nextEntry);
  const materialIds = new Set([...previous.keys(), ...next.keys()]);

  for (const materialId of materialIds) {
    const previousAmount = previous.get(materialId) || 0;
    const nextAmount = next.get(materialId) || 0;
    const delta = nextAmount - previousAmount;
    await applyMaterialDelta(materialId, delta, req);
  }

  for (const materialId of materialIds) {
    const lastPurchase = await FinanceEntry.findOne(withOwnerScope(req, { tipo: 'saida', material: materialId }))
      .sort({ data: -1, createdAt: -1 })
      .select('data createdAt')
      .lean();

    const nextDate = lastPurchase?.data || lastPurchase?.createdAt || null;
    await Material.findOneAndUpdate(
      withOwnerScope(req, { _id: materialId }),
      nextDate ? { dataCompra: nextDate } : { $unset: { dataCompra: '' } },
      { new: true }
    );
  }
}

export const listFinanceEntries = asyncHandler(async (req, res) => {
  const entries = await FinanceEntry.find(withOwnerScope(req))
    .populate('material', 'descricao marca quantidadeDisponivel dataCompra')
    .populate('nfeUpload', 'dataBase64 mimeType nomeArquivo tamanhoBytes')
    .sort({ data: -1, createdAt: -1 });

  const hydrated = entries.map((entryDoc) => {
    const entry = entryDoc.toObject();
    const upload = entry.nfeUpload;

    return {
      ...entry,
      nfeUpload: upload?._id || upload || null,
      nfeNome: entry.nfeNome || upload?.nomeArquivo || '',
      nfeTamanhoBytes: Number(entry.nfeTamanhoBytes || upload?.tamanhoBytes || 0),
      nfeArquivoDataUrl: hydrateNfeDataUrl(upload),
    };
  });

  res.json(hydrated);
});

export const createFinanceEntry = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  const nfeResult = await attachNfeUploadIfAny(payload, null);
  if (nfeResult.error) {
    return res.status(400).json({ message: nfeResult.error });
  }

  const entry = await FinanceEntry.create(withOwnerPayload(req, payload));
  await reconcileMaterialStock(null, entry, req);
  res.status(201).json(entry);
});

export const updateFinanceEntry = asyncHandler(async (req, res) => {
  const previous = await FinanceEntry.findOne(withOwnerScope(req, { _id: req.params.id }));
  if (!previous) {
    return res.status(404).json({ message: 'Lancamento nao encontrado.' });
  }

  const payload = { ...req.body };
  const nfeResult = await attachNfeUploadIfAny(payload, previous);
  if (nfeResult.error) {
    return res.status(400).json({ message: nfeResult.error });
  }

  const entry = await FinanceEntry.findOneAndUpdate(withOwnerScope(req, { _id: req.params.id }), payload, {
    new: true,
    runValidators: true,
  });

  await reconcileMaterialStock(previous, entry, req);
  await removeUnreferencedUploads(nfeResult.cleanupCandidates || []);

  return res.json(entry);
});

export const deleteFinanceEntry = asyncHandler(async (req, res) => {
  const entry = await FinanceEntry.findOneAndDelete(withOwnerScope(req, { _id: req.params.id }));

  if (!entry) {
    return res.status(404).json({ message: 'Lancamento nao encontrado.' });
  }

  await reconcileMaterialStock(entry, null, req);
  await removeUnreferencedUploads(entry.nfeUpload ? [entry.nfeUpload] : []);

  return res.status(204).send();
});
