import { Order } from '../models/Order.js';
import Orcamento from '../models/Orcamento.js';
import { FinanceEntry } from '../models/FinanceEntry.js';
import { Upload } from '../models/Upload.js';

function normalizeUploadIds(uploadIds) {
  const unique = new Set();

  for (const id of Array.isArray(uploadIds) ? uploadIds : []) {
    const text = String(id || '').trim();
    if (text) unique.add(text);
  }

  return Array.from(unique);
}

export async function removeUnreferencedUploads(uploadIds) {
  const candidateIds = normalizeUploadIds(uploadIds);
  if (!candidateIds.length) return 0;

  const [usedInOrders, usedInOrcamentos, usedInFinance] = await Promise.all([
    Order.distinct('fotosPedidoUploads', { fotosPedidoUploads: { $in: candidateIds } }),
    Orcamento.distinct('fotosPedidoUploads', { fotosPedidoUploads: { $in: candidateIds } }),
    FinanceEntry.distinct('nfeUpload', { nfeUpload: { $in: candidateIds } }),
  ]);

  const usedSet = new Set([
    ...usedInOrders.map((id) => String(id)),
    ...usedInOrcamentos.map((id) => String(id)),
    ...usedInFinance.map((id) => String(id)),
  ]);

  const orphanIds = candidateIds.filter((id) => !usedSet.has(String(id)));
  if (!orphanIds.length) return 0;

  const result = await Upload.deleteMany({ _id: { $in: orphanIds } });
  return Number(result.deletedCount || 0);
}

export function diffRemovedUploadIds(previousIds, nextIds) {
  const prev = normalizeUploadIds(previousIds);
  if (!prev.length) return [];

  const nextSet = new Set(normalizeUploadIds(nextIds));
  return prev.filter((id) => !nextSet.has(id));
}
