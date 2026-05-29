import { Material } from '../models/Material.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { withOwnerPayload, withOwnerScope } from '../utils/requestUser.js';

export const listMateriais = asyncHandler(async (req, res) => {
  const materiais = await Material.find(withOwnerScope(req)).sort({ createdAt: -1 });
  res.json(materiais);
});

function normalizeMaterialPayload(body) {
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
    cor: body.cor || '',
    material: tipoMaterial,
    precoCusto,
    quantidadeDisponivel,
    precoPorKg: precoCusto,
    estoqueAtual: quantidadeDisponivel,
    estoqueMinimo: Number(body.estoqueMinimo ?? 0),
  };
}

export const createMaterial = asyncHandler(async (req, res) => {
  const material = await Material.create(withOwnerPayload(req, normalizeMaterialPayload(req.body)));
  res.status(201).json(material);
});

export const updateMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findOneAndUpdate(withOwnerScope(req, { _id: req.params.id }), normalizeMaterialPayload(req.body), {
    new: true,
    runValidators: true,
  });

  if (!material) {
    return res.status(404).json({ message: 'Material nao encontrado.' });
  }

  res.json(material);
});

export const deleteMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findOneAndDelete(withOwnerScope(req, { _id: req.params.id }));

  if (!material) {
    return res.status(404).json({ message: 'Material nao encontrado.' });
  }

  res.json({ message: 'Material removido com sucesso.' });
});