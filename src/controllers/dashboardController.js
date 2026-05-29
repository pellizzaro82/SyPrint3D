import { Client } from '../models/Client.js';
import { FinanceEntry } from '../models/FinanceEntry.js';
import { Material } from '../models/Material.js';
import Orcamento from '../models/Orcamento.js';
import { Order } from '../models/Order.js';
import { Printer } from '../models/Printer.js';
import { Product } from '../models/Product.js';

import { asyncHandler } from '../utils/asyncHandler.js';
import { requireRequestUserId, requireRequestUserObjectId } from '../utils/requestUser.js';

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function monthKey(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

function monthLabel(date) {
  const label = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  return label.replace('.', '');
}

function toPercent(value, total) {
  if (!total) return 0;
  return Number(((value / total) * 100).toFixed(1));
}

function buildMonthRange(monthCount = 6) {
  const now = new Date();
  const list = [];
  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    list.push({
      date,
      key: monthKey(date),
      label: monthLabel(date),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    });
  }
  return list;
}

function aggregateToMap(rows, mapper) {
  const map = new Map();
  rows.forEach((item) => {
    const parsed = mapper(item);
    if (!parsed || !parsed.key) return;
    map.set(parsed.key, parsed.value);
  });
  return map;
}

function normalizeOrderStatus(status) {
  const value = String(status || 'sem_status').toLowerCase();
  if (value === 'aprovado') return 'recebido';
  if (value === 'finalizacao' || value === 'acabamento') return 'em_producao';
  return value;
}

export const getDashboardData = asyncHandler(async (req, res) => {
  const userId = requireRequestUserId(req);
  const ownerObjectId = requireRequestUserObjectId(req);
  const startOfMonth = startOfCurrentMonth();
  const monthRange = buildMonthRange(6);
  const seriesStartDate = monthRange[0]?.date || startOfMonth;
  const now = new Date();

  const [
    entradas,
    saidas,
    pedidosProducao,
    pedidosEntregues,
    clientesAtivos,
    totalClientes,
    clientesNovosMes,
    pedidosMes,
    pedidosAtrasados,
    pedidosPorStatus,
    orcamentosMes,
    orcamentosPendentes,
    orcamentosAprovados,
    orcamentosVencidos,
    orcamentosAprovadosMes,
    orcamentosVencidosMes,
    orcamentosValorMes,
    orcamentosValorAprovadosMes,
    orcamentosValorVencidosMes,
    materialMaisUtilizadoMes,
    fornecedorMaisUsadoMes,
    materialCriticoEstoque,
    totalProdutos,
    produtosEstoqueBaixo,
    totalMateriais,
    materiaisEstoqueBaixo,
    totalEquipamentos,
    equipamentosInativos,
    equipamentosAtivos,
    mediaUptimeEquipamentos,
    mediaHorasEquipamentos,
    comprasMes,
    pedidosReceitaMes,
    comprasCustoMes,
    comprasPorCategoriaMes,
    comprasRecentesMes,
    equipamentosGastoMes,
    pedidosPorMes,
    financeiroPorMes,
    orcamentosPorMes,
    produtosMaisVendidos,
    categoriasDespesaMes,
  ] = await Promise.all([
    FinanceEntry.aggregate([
      { $match: { ownerUserId: ownerObjectId, tipo: 'entrada', data: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$valor' } } },
    ]),
    FinanceEntry.aggregate([
      { $match: { ownerUserId: ownerObjectId, tipo: 'saida', data: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$valor' } } },
    ]),
    Order.countDocuments({ ownerUserId: ownerObjectId, status: { $in: ['em_producao', 'finalizacao', 'acabamento'] } }),
    Order.countDocuments({ ownerUserId: ownerObjectId, status: 'entregue' }),
    Client.countDocuments({ ownerUserId: ownerObjectId, ativo: true }),
    Client.countDocuments({ ownerUserId: ownerObjectId }),
    Client.countDocuments({ ownerUserId: ownerObjectId, createdAt: { $gte: startOfMonth } }),
    Order.countDocuments({ ownerUserId: ownerObjectId, createdAt: { $gte: startOfMonth } }),
    Order.countDocuments({
      ownerUserId: ownerObjectId,
      status: { $ne: 'entregue' },
      dataEntregaPrevista: { $lt: now },
    }),
    Order.aggregate([
      { $match: { ownerUserId: ownerObjectId } },
      {
        $group: {
          _id: '$status',
          quantidade: { $sum: 1 },
        },
      },
    ]),
    Orcamento.countDocuments({ ownerUserId: ownerObjectId, createdAt: { $gte: startOfMonth } }),
    Orcamento.countDocuments({ ownerUserId: ownerObjectId, status: 'orcamento' }),
    Orcamento.countDocuments({ ownerUserId: ownerObjectId, status: 'aprovado' }),
    Orcamento.countDocuments({
      ownerUserId: ownerObjectId,
      status: { $ne: 'aprovado' },
      dataEntregaPrevista: { $lt: now },
    }),
    Orcamento.countDocuments({
      ownerUserId: ownerObjectId,
      createdAt: { $gte: startOfMonth },
      status: 'aprovado',
    }),
    Orcamento.countDocuments({
      ownerUserId: ownerObjectId,
      createdAt: { $gte: startOfMonth },
      status: { $ne: 'aprovado' },
      dataEntregaPrevista: { $lt: now },
    }),
    Orcamento.aggregate([
      { $match: { ownerUserId: ownerObjectId, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$valor', 0] } } } },
    ]),
    Orcamento.aggregate([
      { $match: { ownerUserId: ownerObjectId, createdAt: { $gte: startOfMonth }, status: 'aprovado' } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$valor', 0] } } } },
    ]),
    Orcamento.aggregate([
      {
        $match: {
          ownerUserId: ownerObjectId,
          createdAt: { $gte: startOfMonth },
          status: { $ne: 'aprovado' },
          dataEntregaPrevista: { $lt: now },
        },
      },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$valor', 0] } } } },
    ]),
    Order.aggregate([
      {
        $match: {
          ownerUserId: ownerObjectId,
          createdAt: { $gte: startOfMonth },
          material: { $exists: true, $ne: null, $ne: '' },
        },
      },
      {
        $group: {
          _id: '$material',
          pedidos: { $sum: 1 },
          quantidadeTotal: { $sum: { $ifNull: ['$quantidade', 1] } },
          volumeBase: { $sum: { $ifNull: ['$pesoEstimado', 0] } },
        },
      },
      { $sort: { volumeBase: -1, quantidadeTotal: -1, pedidos: -1 } },
      {
        $lookup: {
          from: 'Materiais',
          let: { materialPedido: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$material', '$$materialPedido'] },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $project: {
                _id: 0,
                unidadeMedida: { $ifNull: ['$unidadeMedida', 'g'] },
                tipoMaterial: { $ifNull: ['$tipoMaterial', '$tipo'] },
              },
            },
          ],
          as: 'materialRef',
        },
      },
      { $unwind: { path: '$materialRef', preserveNullAndEmptyArrays: true } },
      { $limit: 1 },
      {
        $project: {
          _id: 0,
          material: '$_id',
          pedidos: 1,
          quantidadeTotal: 1,
          volumeBase: 1,
          unidadeMedida: { $ifNull: ['$materialRef.unidadeMedida', 'g'] },
          tipoMaterial: { $ifNull: ['$materialRef.tipoMaterial', '-'] },
        },
      },
    ]),
    FinanceEntry.aggregate([
      {
        $match: {
          ownerUserId: ownerObjectId,
          tipo: 'saida',
          data: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: { $ifNull: ['$fornecedor', 'Fornecedor nao informado'] },
          compras: { $sum: 1 },
          quantidadeTotal: { $sum: { $ifNull: ['$quantidade', 1] } },
          valorTotal: { $sum: { $ifNull: ['$valor', 0] } },
        },
      },
      { $sort: { quantidadeTotal: -1, compras: -1, valorTotal: -1 } },
      { $limit: 1 },
      {
        $project: {
          _id: 0,
          fornecedor: '$_id',
          compras: 1,
          quantidadeTotal: 1,
          valorTotal: 1,
        },
      },
    ]),
    Material.aggregate([
      {
        $match: {
          ownerUserId: ownerObjectId,
          $expr: { $lte: ['$estoqueAtual', '$estoqueMinimo'] },
        },
      },
      {
        $project: {
          _id: 0,
          material: { $ifNull: ['$material', { $ifNull: ['$descricao', 'Material sem nome'] }] },
          estoqueAtual: { $ifNull: ['$estoqueAtual', 0] },
          estoqueMinimo: { $ifNull: ['$estoqueMinimo', 0] },
          deficit: {
            $subtract: [{ $ifNull: ['$estoqueMinimo', 0] }, { $ifNull: ['$estoqueAtual', 0] }],
          },
        },
      },
      { $sort: { deficit: -1, estoqueAtual: 1 } },
      { $limit: 1 },
    ]),
    Product.countDocuments({ ownerUserId: ownerObjectId }),
    Product.countDocuments({ ownerUserId: ownerObjectId, $expr: { $lte: ['$estoqueInicial', '$estoqueMinimo'] } }),
    Material.countDocuments({ ownerUserId: ownerObjectId }),
    Material.countDocuments({ ownerUserId: ownerObjectId, $expr: { $lte: ['$estoqueAtual', '$estoqueMinimo'] } }),
    Printer.countDocuments({ ownerUserId: ownerObjectId }),
    Printer.countDocuments({ ownerUserId: ownerObjectId, ativo: false }),
    Printer.countDocuments({ ownerUserId: ownerObjectId, ativo: { $ne: false } }),
    Printer.aggregate([{ $match: { ownerUserId: ownerObjectId } }, { $group: { _id: null, media: { $avg: '$uptimePercentual' } } }]),
    Printer.aggregate([{ $match: { ownerUserId: ownerObjectId } }, { $group: { _id: null, media: { $avg: '$horasUso' } } }]),
    FinanceEntry.countDocuments({ ownerUserId: ownerObjectId, tipo: 'saida', data: { $gte: startOfMonth } }),
    FinanceEntry.aggregate([
      { $match: { ownerUserId: ownerObjectId, tipo: 'entrada', data: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$valor' } } },
    ]),
    FinanceEntry.aggregate([
      { $match: { ownerUserId: ownerObjectId, tipo: 'saida', data: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$valor' } } },
    ]),
    FinanceEntry.aggregate([
      {
        $match: {
          ownerUserId: ownerObjectId,
          tipo: 'saida',
          data: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: '$categoria',
          total: { $sum: '$valor' },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          categoria: { $ifNull: ['$_id', 'Sem categoria'] },
          total: 1,
        },
      },
    ]),
    FinanceEntry.aggregate([
      {
        $match: {
          ownerUserId: ownerObjectId,
          tipo: 'saida',
          data: { $gte: startOfMonth },
        },
      },
      {
        $lookup: {
          from: 'Materiais',
          localField: 'material',
          foreignField: '_id',
          as: 'materialRef',
        },
      },
      { $unwind: { path: '$materialRef', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          data: 1,
          fornecedor: { $ifNull: ['$fornecedor', 'Fornecedor nao informado'] },
          quantidade: { $ifNull: ['$quantidade', 1] },
          valorUnitario: {
            $ifNull: [
              '$valorUnitario',
              {
                $cond: [
                  { $gt: [{ $ifNull: ['$quantidade', 0] }, 0] },
                  { $divide: ['$valor', { $ifNull: ['$quantidade', 1] }] },
                  '$valor',
                ],
              },
            ],
          },
          valor: 1,
          descricao: { $ifNull: ['$descricao', ''] },
          materialLabel: {
            $ifNull: ['$materialRef.material', { $ifNull: ['$materialRef.descricao', { $ifNull: ['$descricao', 'Item sem descricao'] }] }],
          },
        },
      },
      {
        $group: {
          _id: {
            fornecedor: '$fornecedor',
            materialLabel: '$materialLabel',
          },
          totalQuantidade: { $sum: '$quantidade' },
          totalValor: { $sum: '$valor' },
          valorUnitarioMedio: { $avg: '$valorUnitario' },
          descricao: { $first: '$descricao' },
          dataUltimaCompra: { $max: '$data' },
        },
      },
      { $sort: { totalQuantidade: -1, totalValor: -1, dataUltimaCompra: -1 } },
      { $limit: 3 },
      {
        $project: {
          _id: 0,
          fornecedor: '$_id.fornecedor',
          material: '$_id.materialLabel',
          descricao: 1,
          quantidade: '$totalQuantidade',
          valorUnitario: '$valorUnitarioMedio',
          valor: '$totalValor',
          data: '$dataUltimaCompra',
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          ownerUserId: ownerObjectId,
          createdAt: { $gte: startOfMonth },
          impressora: { $exists: true, $ne: null },
        },
      },
      {
        $lookup: {
          from: 'Equipamentos',
          localField: 'impressora',
          foreignField: '_id',
          as: 'equipamento',
        },
      },
      { $unwind: { path: '$equipamento', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          tempoHoras: { $divide: [{ $ifNull: ['$tempoImpressao', 0] }, 60] },
          custoEnergiaCalculado: {
            $multiply: [
              { $divide: [{ $ifNull: ['$tempoImpressao', 0] }, 60] },
              { $divide: [{ $ifNull: ['$equipamento.consumoW', 0] }, 1000] },
              { $ifNull: ['$equipamento.custoKwh', 0.95] },
            ],
          },
          custoDepreciacaoCalculado: {
            $multiply: [
              { $divide: [{ $ifNull: ['$tempoImpressao', 0] }, 60] },
              { $ifNull: ['$equipamento.custoDepreciacaoHora', 0] },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$impressora',
          equipamentoNome: { $first: '$equipamento.nome' },
          equipamentoModelo: { $first: '$equipamento.modelo' },
          pedidos: { $sum: 1 },
          tempoImpressaoHoras: { $sum: { $ifNull: ['$tempoHoras', 0] } },
          receita: { $sum: '$valor' },
          custoEnergia: { $sum: { $ifNull: ['$custoEnergiaCalculado', 0] } },
          custoDepreciacao: { $sum: { $ifNull: ['$custoDepreciacaoCalculado', 0] } },
          lucro: { $sum: { $ifNull: ['$custos.lucroReal', 0] } },
        },
      },
      {
        $addFields: {
          custoTotal: { $add: [{ $ifNull: ['$custoEnergia', 0] }, { $ifNull: ['$custoDepreciacao', 0] }] },
        },
      },
      { $sort: { custoTotal: -1 } },
      {
        $project: {
          _id: 0,
          impressoraId: '$_id',
          nome: {
            $ifNull: [
              {
                $cond: [
                  { $ifNull: ['$equipamentoNome', false] },
                  '$equipamentoNome',
                  '$equipamentoModelo',
                ],
              },
              'Equipamento removido',
            ],
          },
          pedidos: 1,
          tempoImpressaoHoras: 1,
          receita: 1,
          custoEnergia: 1,
          custoDepreciacao: 1,
          custoTotal: 1,
          lucro: 1,
        },
      },
    ]),
    Order.aggregate([
      { $match: { ownerUserId: ownerObjectId, createdAt: { $gte: seriesStartDate } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          pedidos: { $sum: 1 },
          faturamentoPedidos: { $sum: '$valor' },
          custoPedidos: { $sum: { $ifNull: ['$custos.custoTotal', 0] } },
          lucroPedidos: { $sum: '$custos.lucroReal' },
          filamento: { $sum: '$pesoEstimado' },
          horas: { $sum: { $divide: ['$tempoImpressao', 60] } },
        },
      },
    ]),
    FinanceEntry.aggregate([
      { $match: { ownerUserId: ownerObjectId, data: { $gte: seriesStartDate } } },
      {
        $group: {
          _id: {
            month: { $month: '$data' },
            year: { $year: '$data' },
            tipo: '$tipo',
          },
          total: { $sum: '$valor' },
        },
      },
    ]),
    Orcamento.aggregate([
      { $match: { ownerUserId: ownerObjectId, createdAt: { $gte: seriesStartDate } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          total: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      { $match: { ownerUserId: ownerObjectId } },
      {
        $group: {
          _id: '$produto',
          quantidade: { $sum: { $ifNull: ['$quantidade', 1] } },
          valor: { $sum: '$valor' },
        },
      },
      { $sort: { quantidade: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'Produtos',
          localField: '_id',
          foreignField: '_id',
          as: 'produto',
        },
      },
      { $unwind: { path: '$produto', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          produtoId: '$_id',
          nome: { $ifNull: ['$produto.nome', 'Produto removido'] },
          quantidade: 1,
          valor: 1,
        },
      },
    ]),
  ]);

  const faturamentoMensal = entradas[0]?.total || 0;
  const custoMensal = saidas[0]?.total || 0;
  const lucroMensal = faturamentoMensal - custoMensal;
  const receitasMensais = pedidosReceitaMes[0]?.total || 0;
  const custosMensais = comprasCustoMes[0]?.total || 0;

  const pedidosMesAggregate = pedidosPorMes.find(
    (item) => item?._id?.month === now.getMonth() + 1 && item?._id?.year === now.getFullYear()
  );
  const consumoFilamento = Number(pedidosMesAggregate?.filamento || 0);
  const horasImpressao = Number(pedidosMesAggregate?.horas || 0);
  const faturamentoPedidosMes = Number(pedidosMesAggregate?.faturamentoPedidos || 0);
  const custoPedidosMes = Number(pedidosMesAggregate?.custoPedidos || 0);
  const lucroPedidosMes = Number(pedidosMesAggregate?.lucroPedidos || faturamentoPedidosMes - custoPedidosMes);
  const margemPedidosMesPercent = toPercent(lucroPedidosMes, Math.max(1, faturamentoPedidosMes));

  const ticketMedioPedidosMes = pedidosMes ? faturamentoPedidosMes / pedidosMes : 0;
  const margemLucroPercent = faturamentoMensal > 0 ? (lucroMensal / faturamentoMensal) * 100 : 0;
  const conversaoOrcamentosPercent = toPercent(orcamentosAprovados, Math.max(1, orcamentosMes));
  const valorOrcamentosMes = Number(orcamentosValorMes[0]?.total || 0);
  const valorOrcamentosAprovadosMes = Number(orcamentosValorAprovadosMes[0]?.total || 0);
  const valorOrcamentosVencidosMes = Number(orcamentosValorVencidosMes[0]?.total || 0);
  const materialTopMes = materialMaisUtilizadoMes[0] || {};
  const fornecedorTopMes = fornecedorMaisUsadoMes[0] || {};
  const materialCritico = materialCriticoEstoque[0] || {};
  const unidadeMaterialTop = String(materialTopMes.unidadeMedida || 'g');
  const volumeBaseMaterialTop = Number(materialTopMes.volumeBase || 0);
  const volumeMaterialTopNormalizado =
    unidadeMaterialTop === 'g' || unidadeMaterialTop === 'ml'
      ? volumeBaseMaterialTop / 1000
      : volumeBaseMaterialTop;
  const unidadeMaterialTopNormalizada =
    unidadeMaterialTop === 'g'
      ? 'kg'
      : unidadeMaterialTop === 'ml'
      ? 'L'
      : unidadeMaterialTop;
  const financeMap = aggregateToMap(financeiroPorMes, (item) => {
    const month = Number(item?._id?.month || 0);
    const year = Number(item?._id?.year || 0);
    const type = String(item?._id?.tipo || '');
    if (!month || !year || !type) return null;
    return {
      key: `${year}-${String(month).padStart(2, '0')}:${type}`,
      value: Number(item.total || 0),
    };
  });

  const ordersMap = aggregateToMap(pedidosPorMes, (item) => {
    const month = Number(item?._id?.month || 0);
    const year = Number(item?._id?.year || 0);
    if (!month || !year) return null;
    return {
      key: `${year}-${String(month).padStart(2, '0')}`,
      value: {
        pedidos: Number(item.pedidos || 0),
        faturamentoPedidos: Number(item.faturamentoPedidos || 0),
        custoPedidos: Number(item.custoPedidos || 0),
        lucroPedidos: Number(item.lucroPedidos || 0),
      },
    };
  });

  const quotesMap = aggregateToMap(orcamentosPorMes, (item) => {
    const month = Number(item?._id?.month || 0);
    const year = Number(item?._id?.year || 0);
    if (!month || !year) return null;
    return {
      key: `${year}-${String(month).padStart(2, '0')}`,
      value: Number(item.total || 0),
    };
  });

  const series = monthRange.map((monthItem) => {
    const key = monthItem.key;
    const pedidos = Number(ordersMap.get(key)?.pedidos || 0);
    const pedidosValor = Number(ordersMap.get(key)?.faturamentoPedidos || 0);
    const pedidosCusto = Number(ordersMap.get(key)?.custoPedidos || 0);
    const pedidosLucro = Number(ordersMap.get(key)?.lucroPedidos || pedidosValor - pedidosCusto);
    const orcamentos = Number(quotesMap.get(key) || 0);

    return {
      key,
      label: monthItem.label,
      entrada: pedidosValor,
      custo: pedidosCusto,
      lucro: pedidosLucro,
      pedidos,
      pedidosValor,
      pedidosCusto,
      pedidosLucro,
      orcamentos,
    };
  });

  const statusMap = new Map();
  pedidosPorStatus.forEach((item) => {
    const normalized = normalizeOrderStatus(item?._id);
    const current = Number(statusMap.get(normalized) || 0);
    statusMap.set(normalized, current + Number(item.quantidade || 0));
  });

  const totalPedidosStatus = Array.from(statusMap.values()).reduce((acc, qtd) => acc + Number(qtd || 0), 0);
  const pedidosStatus = Array.from(statusMap.entries()).map(([status, quantidade]) => ({
    status,
    quantidade: Number(quantidade || 0),
    percentual: toPercent(Number(quantidade || 0), Math.max(1, totalPedidosStatus)),
  }));

  const custoEquipamentosMes = equipamentosGastoMes.reduce(
    (acc, item) => acc + Number(item.custoTotal || 0),
    0
  );

  const equipamentosMensais = equipamentosGastoMes.map((item) => ({
    equipamentoId: item.impressoraId,
    nome: item.nome,
    pedidos: Number(item.pedidos || 0),
    tempoImpressaoHoras: Number(item.tempoImpressaoHoras || 0),
    receita: Number(item.receita || 0),
    custoEnergia: Number(item.custoEnergia || 0),
    custoDepreciacao: Number(item.custoDepreciacao || 0),
    custoTotal: Number(item.custoTotal || 0),
    lucro: Number(item.lucro || 0),
    percentualGasto: toPercent(Number(item.custoTotal || 0), Math.max(1, custoEquipamentosMes)),
  }));

  res.json({
    cards: {
      faturamentoMensal: faturamentoPedidosMes,
      lucroMensal: lucroPedidosMes,
      pedidosEmProducao: pedidosProducao,
      pedidosEntregues,
      consumoFilamento,
      horasImpressao: Number(horasImpressao.toFixed(2)),
      notasEmitidas: pedidosEntregues,
      clientesAtivos,
    },
    overview: {
      faturamentoMensal: faturamentoPedidosMes,
      custoMensal: custoPedidosMes,
      lucroMensal: lucroPedidosMes,
      pedidosEntradaMensal: faturamentoPedidosMes,
      pedidosCustoMensal: custoPedidosMes,
      pedidosLucroMensal: lucroPedidosMes,
      margemPedidosMesPercent,
      receitasMensais,
      custosMensais,
      margemLucroPercent: Number(margemLucroPercent.toFixed(1)),
      ticketMedioPedidosMes: Number(ticketMedioPedidosMes.toFixed(2)),
      pedidosMes,
      faturamentoPedidosMes,
      custoPedidosMes,
      lucroPedidosMes,
      orcamentosMes,
      conversaoOrcamentosPercent,
      clientesAtivos,
      totalClientes,
      consumoFilamento,
      horasImpressao: Number(horasImpressao.toFixed(2)),
      equipamentosGastoMensal: Number(custoEquipamentosMes.toFixed(2)),
    },
    modulos: {
      clientes: {
        total: totalClientes,
        ativos: clientesAtivos,
        inativos: Math.max(0, totalClientes - clientesAtivos),
        novosMes: clientesNovosMes,
      },
      pedidos: {
        total: totalPedidosStatus,
        mes: pedidosMes,
        emProducao: pedidosProducao,
        entreguesTotal: pedidosEntregues,
        atrasados: pedidosAtrasados,
        ticketMedio: Number(ticketMedioPedidosMes.toFixed(2)),
        faturamentoMes: faturamentoPedidosMes,
        entradaMes: faturamentoPedidosMes,
        custoMes: custoPedidosMes,
        lucroMes: lucroPedidosMes,
        margemMesPercent: margemPedidosMesPercent,
      },
      orcamentos: {
        mes: orcamentosMes,
        pendentes: orcamentosPendentes,
        aprovados: orcamentosAprovados,
        vencidos: orcamentosVencidos,
        quantidadeMes: orcamentosMes,
        aprovadosMes: orcamentosAprovadosMes,
        vencidosMes: orcamentosVencidosMes,
        valorMes: Number(valorOrcamentosMes.toFixed(2)),
        valorAprovadosMes: Number(valorOrcamentosAprovadosMes.toFixed(2)),
        valorVencidosMes: Number(valorOrcamentosVencidosMes.toFixed(2)),
        conversaoPercent: conversaoOrcamentosPercent,
      },
      estoque: {
        totalProdutos,
        produtosBaixo: produtosEstoqueBaixo,
        totalMateriais,
        materiaisBaixo: materiaisEstoqueBaixo,
        indicadoresMateriais: {
          baixaEstoqueQtd: Number(materiaisEstoqueBaixo || 0),
          materialMaisUtilizado: String(materialTopMes.material || '-'),
          volumeMaisUsado: Number(volumeMaterialTopNormalizado.toFixed(2)),
          volumeMaisUsadoUnidade: unidadeMaterialTopNormalizada,
          materialMaisUtilizadoQtd: Number(materialTopMes.quantidadeTotal || 0),
          materialMaisUtilizadoPedidos: Number(materialTopMes.pedidos || 0),
          fornecedorMaisUsado: String(fornecedorTopMes.fornecedor || '-'),
          fornecedorMaisUsadoQtd: Number(fornecedorTopMes.quantidadeTotal || 0),
          fornecedorMaisUsadoCompras: Number(fornecedorTopMes.compras || 0),
          fornecedorMaisUsadoValor: Number(fornecedorTopMes.valorTotal || 0),
          materialCritico: String(materialCritico.material || '-'),
          materialCriticoDeficit: Number(materialCritico.deficit || 0),
          materialCriticoAtual: Number(materialCritico.estoqueAtual || 0),
          materialCriticoMinimo: Number(materialCritico.estoqueMinimo || 0),
        },
      },
      equipamentos: {
        total: totalEquipamentos,
        ativos: equipamentosAtivos,
        inativos: equipamentosInativos,
        uptimeMedioPercent: Number((mediaUptimeEquipamentos[0]?.media || 0).toFixed(1)),
        horasMediaUso: Number((mediaHorasEquipamentos[0]?.media || 0).toFixed(1)),
      },
      compras: {
        totalMes: comprasMes,
        custoMes: custosMensais,
        itensMes: comprasRecentesMes.map((item) => ({
          data: item.data,
          fornecedor: item.fornecedor,
          quantidade: Number(item.quantidade || 0),
          valorUnitario: Number(item.valorUnitario || 0),
          valor: Number(item.valor || 0),
          descricao: item.descricao,
          material: item.material,
        })),
      },
      equipamentosMes: equipamentosMensais,
    },
    graficos: {
      series,
      pedidosStatus,
      produtosMaisVendidos,
      categoriasDespesaMes,
      equipamentosMensais,
    },
  });
});
