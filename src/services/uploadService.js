import crypto from 'crypto';
import zlib from 'zlib';

import { Upload } from '../models/Upload.js';

const MAX_IMAGE_UPLOAD_BYTES = 180 * 1024;
const MAX_PDF_UPLOAD_BYTES = 6 * 1024 * 1024;

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

function toStringArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) return [value];
  return [];
}

export async function upsertUploadsFromDataUrls({ dataUrls = [], fileNames = [] }) {
  const refs = [];
  const normalizedNames = [];

  for (let index = 0; index < dataUrls.length; index += 1) {
    const parsed = parseDataUrl(dataUrls[index]);
    if (!parsed) continue;

    let bytes;
    try {
      bytes = Buffer.from(parsed.base64, 'base64');
    } catch {
      continue;
    }

    const isImage = String(parsed.mimeType || '').startsWith('image/');
    if (isImage && bytes.length > MAX_IMAGE_UPLOAD_BYTES) {
      return {
        refs: [],
        names: [],
        error: `Uma das imagens excede o limite de ${Math.round(MAX_IMAGE_UPLOAD_BYTES / 1024)} KB.`,
      };
    }

    if (parsed.mimeType === 'application/pdf' && bytes.length > MAX_PDF_UPLOAD_BYTES) {
      return {
        refs: [],
        names: [],
        error: 'Um dos PDFs excede o limite de 6 MB.',
      };
    }

    let storedBytes = bytes;
    let storedDataUrl = parsed.dataUrl;
    let storedMimeType = parsed.mimeType;

    // PDFs costumam ser a maior fonte de payload no sistema; aplicamos gzip quando reduz tamanho.
    if (parsed.mimeType === 'application/pdf') {
      try {
        const gzipped = zlib.gzipSync(bytes, { level: 9 });
        if (gzipped.length < bytes.length) {
          storedBytes = gzipped;
          storedMimeType = 'application/gzip';
          storedDataUrl = `data:${storedMimeType};base64,${gzipped.toString('base64')}`;
        }
      } catch {
        // Em caso de falha no gzip, mantemos o PDF original.
      }
    }

    const hash = crypto.createHash('sha256').update(bytes).digest('hex');
    const fallbackName = String(fileNames[index] || `foto-${index + 1}`).trim() || `foto-${index + 1}`;

    let upload = await Upload.findOne({ hash }).select('_id nomeArquivo').lean();
    if (!upload) {
      const created = await Upload.create({
        hash,
        mimeType: storedMimeType,
        nomeArquivo: fallbackName,
        tamanhoBytes: storedBytes.length,
        dataBase64: storedDataUrl,
      });
      upload = { _id: created._id, nomeArquivo: created.nomeArquivo };
    }

    refs.push(upload._id);
    normalizedNames.push(upload.nomeArquivo || fallbackName);
  }

  return { refs, names: normalizedNames };
}

export function extractIncomingPhotoPayload(payload, maxPhotos, entityName) {
  const hasAnyPhotoField = ['fotosPedidoNomes', 'fotosPedido', 'fotoPedidoNome', 'fotoPedido'].some((key) =>
    Object.prototype.hasOwnProperty.call(payload, key)
  );

  if (!hasAnyPhotoField) {
    return { hasPhotoUpdate: false, photos: [], names: [] };
  }

  const photoNames = toStringArray(payload.fotosPedidoNomes)
    .map((item) => String(item || '').trim())
    .filter(Boolean);
  const photos = toStringArray(payload.fotosPedido)
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  if (photoNames.length > maxPhotos || photos.length > maxPhotos) {
    return { error: `Maximo de ${maxPhotos} fotos por ${entityName}.` };
  }

  const fallbackName = typeof payload.fotoPedidoNome === 'string' ? payload.fotoPedidoNome.trim() : '';
  const fallbackPhoto = typeof payload.fotoPedido === 'string' ? payload.fotoPedido.trim() : '';

  const normalizedNames = photoNames.length ? photoNames : fallbackName ? [fallbackName] : [];
  const normalizedPhotos = photos.length ? photos : fallbackPhoto ? [fallbackPhoto] : [];

  return {
    hasPhotoUpdate: true,
    photos: normalizedPhotos,
    names: normalizedNames,
  };
}

export function hydratePhotoFieldsFromUploads(rawDoc) {
  const doc = rawDoc && typeof rawDoc.toObject === 'function' ? rawDoc.toObject() : { ...rawDoc };
  const refs = Array.isArray(doc.fotosPedidoUploads) ? doc.fotosPedidoUploads : [];

  if (!refs.length) return doc;

  const fotosPedido = refs
    .map((item) => (item && typeof item === 'object' ? item.dataBase64 : null))
    .filter(Boolean);

  const fotosPedidoNomes = refs
    .map((item, idx) => {
      if (item && typeof item === 'object' && item.nomeArquivo) return item.nomeArquivo;
      return doc.fotosPedidoNomes?.[idx] || '';
    })
    .filter(Boolean);

  return {
    ...doc,
    fotosPedido,
    fotosPedidoNomes,
    fotoPedido: '',
    fotoPedidoNome: '',
  };
}
