import { OtherCatalog } from '../models/OtherCatalog.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireRequestUserId } from '../utils/requestUser.js';

const DEFAULT_CATALOG = {
  fornecedores: [],
  categorias: [{ nome: 'Chaveiro' }, { nome: 'Decoracao' }, { nome: 'Utilitarios' }, { nome: 'Personalizado' }, { nome: 'Filamento' }, { nome: 'Resina' }, { nome: 'Embalagens' }, { nome: 'Ferramentas' }, { nome: 'Maquina' }, { nome: 'Frete' }, { nome: 'Outros' }],
  tiposMaterial: [{ nome: 'Filamento' }, { nome: 'Resina' }],
  marcasEquipamentos: [],
  metodosPagamento: [{ nome: 'PIX' }, { nome: 'Cartao' }, { nome: 'Boleto' }, { nome: 'Dinheiro' }, { nome: 'Transferencia' }],
};

function normalizeName(value) {
  return String(value || '').trim();
}

function dedupeByName(items) {
  const unique = new Map();

  for (const item of Array.isArray(items) ? items : []) {
    const nome = normalizeName(item?.nome ?? item);
    if (!nome) continue;

    const key = nome.toLowerCase();
    if (!unique.has(key)) {
      unique.set(key, { nome });
    }
  }

  return Array.from(unique.values());
}

function normalizeFornecedores(items) {
  const unique = new Map();

  for (const item of Array.isArray(items) ? items : []) {
    const nome = normalizeName(item?.nome);
    if (!nome) continue;

    const key = nome.toLowerCase();
    if (unique.has(key)) continue;

    unique.set(key, {
      nome,
      telefone: normalizeName(item?.telefone),
      email: normalizeName(item?.email),
      site: normalizeName(item?.site),
      whatsappVendas: normalizeName(item?.whatsappVendas),
    });
  }

  return Array.from(unique.values());
}

async function ensureCatalogDocument(userId) {
  const chave = `default:${userId}`;
  let catalog = await OtherCatalog.findOne({ ownerUserId: userId, chave });

  if (!catalog) {
    catalog = await OtherCatalog.create({
      ownerUserId: userId,
      chave,
      ...DEFAULT_CATALOG,
    });
  }

  return catalog;
}

export const getOtherCatalog = asyncHandler(async (req, res) => {
  const userId = requireRequestUserId(req);
  const catalog = await ensureCatalogDocument(userId);
  res.json({
    fornecedores: catalog.fornecedores || [],
    categorias: catalog.categorias || [],
    tiposMaterial: catalog.tiposMaterial || [],
    marcasEquipamentos: catalog.marcasEquipamentos || [],
    metodosPagamento: catalog.metodosPagamento || [],
  });
});

export const updateOtherCatalog = asyncHandler(async (req, res) => {
  const userId = requireRequestUserId(req);
  const catalog = await ensureCatalogDocument(userId);

  const payload = req.body || {};

  catalog.fornecedores = normalizeFornecedores(payload.fornecedores);
  catalog.categorias = dedupeByName(payload.categorias);
  catalog.tiposMaterial = dedupeByName(payload.tiposMaterial);
  catalog.marcasEquipamentos = dedupeByName(payload.marcasEquipamentos);
  catalog.metodosPagamento = dedupeByName(payload.metodosPagamento);

  await catalog.save();

  return res.json({
    fornecedores: catalog.fornecedores || [],
    categorias: catalog.categorias || [],
    tiposMaterial: catalog.tiposMaterial || [],
    marcasEquipamentos: catalog.marcasEquipamentos || [],
    metodosPagamento: catalog.metodosPagamento || [],
  });
});
