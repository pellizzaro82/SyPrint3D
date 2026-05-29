import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { withOwnerPayload, withOwnerScope } from '../utils/requestUser.js';

const MAX_PRODUCT_IMAGE_BYTES = 180 * 1024;

function estimateDataUrlBytes(dataUrl) {
  const payload = String(dataUrl || '').split(',')[1] || '';
  return Math.ceil((payload.length * 3) / 4);
}

function sanitizeProductPayload(raw) {
  const payload = { ...(raw || {}) };
  const fotos = Array.isArray(payload.fotos) ? payload.fotos : [];

  for (const foto of fotos) {
    const text = String(foto || '').trim();
    if (!text) continue;
    if (!text.startsWith('data:image/')) continue;

    if (estimateDataUrlBytes(text) > MAX_PRODUCT_IMAGE_BYTES) {
      return {
        error: `Imagem de produto excede o limite de ${Math.round(MAX_PRODUCT_IMAGE_BYTES / 1024)} KB.`,
      };
    }
  }

  return { payload };
}

export const listProducts = asyncHandler(async (req, res) => {
  const products = await Product.find(withOwnerScope(req)).sort({ createdAt: -1 });
  res.json(products);
});

export const createProduct = asyncHandler(async (req, res) => {
  const sanitized = sanitizeProductPayload(req.body);
  if (sanitized.error) {
    return res.status(400).json({ message: sanitized.error });
  }

  const product = await Product.create(withOwnerPayload(req, sanitized.payload));
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const sanitized = sanitizeProductPayload(req.body);
  if (sanitized.error) {
    return res.status(400).json({ message: sanitized.error });
  }

  const product = await Product.findOneAndUpdate(withOwnerScope(req, { _id: req.params.id }), sanitized.payload, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return res.status(404).json({ message: 'Produto nao encontrado.' });
  }

  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const deleted = await Product.findOneAndDelete(withOwnerScope(req, { _id: req.params.id }));
  if (!deleted) {
    return res.status(404).json({ message: 'Produto nao encontrado.' });
  }
  res.status(204).send();
});
