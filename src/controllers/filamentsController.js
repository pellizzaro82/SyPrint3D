import { Filament } from '../models/Filament.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listFilaments = asyncHandler(async (req, res) => {
  const filaments = await Filament.find().sort({ createdAt: -1 });
  res.json(filaments);
});

function normalizeFilamentPayload(body) {
  const descricao = body.descricao || body.tipo || '';
  const tipoMaterial = body.tipoMaterial || body.material || 'Filamento';
  const precoCusto = Number(body.precoCusto ?? body.precoPorKg ?? 0);
  const quantidadeDisponivel = Number(body.quantidadeDisponivel ?? body.estoqueAtual ?? 0);
  const dataCompra = body.dataCompra ? new Date(body.dataCompra) : undefined;
  const validade = body.validade ? new Date(body.validade) : undefined;

  return {
    ...body,
    descricao,
    tipoMaterial,
    unidadeMedida: body.unidadeMedida || 'g',
    marca: body.marca || '',
    fornecedor: body.fornecedor || '',
    lote: body.lote || '',
    dataCompra,
    validade,
    tipo: descricao,
    material: tipoMaterial,
    precoCusto,
    quantidadeDisponivel,
    precoPorKg: precoCusto,
    estoqueAtual: quantidadeDisponivel,
    estoqueMinimo: Number(body.estoqueMinimo ?? 0),
  };
}

export const createFilament = asyncHandler(async (req, res) => {
  const filament = await Filament.create(normalizeFilamentPayload(req.body));
  res.status(201).json(filament);
});

export const updateFilament = asyncHandler(async (req, res) => {
  const filament = await Filament.findByIdAndUpdate(req.params.id, normalizeFilamentPayload(req.body), {
    new: true,
    runValidators: true,
  });

  if (!filament) {
    return res.status(404).json({ message: 'Filamento nao encontrado.' });
  }

  res.json(filament);
});

export const deleteFilament = asyncHandler(async (req, res) => {
  const filament = await Filament.findByIdAndDelete(req.params.id);

  if (!filament) {
    return res.status(404).json({ message: 'Filamento nao encontrado.' });
  }

  res.json({ message: 'Filamento removido com sucesso.' });
});
