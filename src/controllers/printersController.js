import { Printer } from '../models/Printer.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { withOwnerPayload, withOwnerScope } from '../utils/requestUser.js';

const MAX_PRINTER_IMAGE_BYTES = 180 * 1024;

function estimateDataUrlBytes(dataUrl) {
  const payload = String(dataUrl || '').split(',')[1] || '';
  return Math.ceil((payload.length * 3) / 4);
}

function sanitizePrinterPayload(raw) {
  const payload = { ...(raw || {}) };
  const foto = String(payload.foto || '').trim();
  if (foto && foto.startsWith('data:image/')) {
    if (estimateDataUrlBytes(foto) > MAX_PRINTER_IMAGE_BYTES) {
      return {
        error: `Foto do equipamento excede o limite de ${Math.round(MAX_PRINTER_IMAGE_BYTES / 1024)} KB.`,
      };
    }
  }

  return { payload };
}

export const listPrinters = asyncHandler(async (req, res) => {
  const printers = await Printer.find(withOwnerScope(req)).sort({ createdAt: -1 });
  res.json(printers);
});

export const createPrinter = asyncHandler(async (req, res) => {
  const sanitized = sanitizePrinterPayload(req.body);
  if (sanitized.error) {
    return res.status(400).json({ message: sanitized.error });
  }

  const printer = await Printer.create(withOwnerPayload(req, sanitized.payload));
  res.status(201).json(printer);
});

export const updatePrinter = asyncHandler(async (req, res) => {
  const sanitized = sanitizePrinterPayload(req.body);
  if (sanitized.error) {
    return res.status(400).json({ message: sanitized.error });
  }

  const printer = await Printer.findOneAndUpdate(withOwnerScope(req, { _id: req.params.id }), sanitized.payload, {
    new: true,
    runValidators: true,
  });

  if (!printer) {
    return res.status(404).json({ message: 'Impressora nao encontrada.' });
  }

  res.json(printer);
});
