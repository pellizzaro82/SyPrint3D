import { Client } from '../models/Client.js';
import { FinanceEntry } from '../models/FinanceEntry.js';
import Orcamento from '../models/Orcamento.js';
import { Order } from '../models/Order.js';
import { AppConfig } from '../models/AppConfig.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireRequestUserId, requireRequestUserObjectId } from '../utils/requestUser.js';

const TZ = 'America/Sao_Paulo';
const MS_DAY = 24 * 60 * 60 * 1000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.resolve(__dirname, '..', '..', 'public', 'images', 'Logo.png');

function parseEmbeddedLogoDataUrl(dataUrl) {
  const text = String(dataUrl || '').trim();
  if (!text) return null;

  const match = text.match(/^data:image\/(png|jpe?g);base64,([a-zA-Z0-9+/=]+)$/i);
  if (!match) return null;

  try {
    return Buffer.from(match[2], 'base64');
  } catch {
    return null;
  }
}

async function resolveRelatorioLogo(userId) {
  try {
    const config = await AppConfig.findOne({ ownerUserId: userId, chave: `default:${userId}` })
      .select('perfilEmpresa.logoDataUrl impressaoPdf.mostrarLogoNoPdf')
      .lean();

    const showLogo = config?.impressaoPdf?.mostrarLogoNoPdf !== false;
    if (!showLogo) {
      return { showLogo: false, source: null };
    }

    const embeddedLogo = parseEmbeddedLogoDataUrl(config?.perfilEmpresa?.logoDataUrl);
    if (embeddedLogo) {
      return { showLogo: true, source: embeddedLogo };
    }
  } catch {
    // Fallback para o logo padrao do sistema quando a configuracao nao estiver disponivel.
  }

  return { showLogo: true, source: logoPath };
}

function startOfDay(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(value) {
  const d = new Date(value);
  d.setHours(23, 59, 59, 999);
  return d;
}

function parseDateInput(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function resolveRange(query) {
  const now = new Date();
  const periodo = String(query?.periodo || 'mes_atual').trim();
  const inicioCustom = parseDateInput(query?.inicio);
  const fimCustom = parseDateInput(query?.fim);

  if (periodo === 'personalizado' && inicioCustom && fimCustom) {
    return {
      periodo,
      inicio: startOfDay(inicioCustom),
      fim: endOfDay(fimCustom),
      descricao: 'Periodo personalizado',
    };
  }

  if (periodo === 'ultimos_30') {
    return {
      periodo,
      inicio: startOfDay(new Date(now.getTime() - 29 * MS_DAY)),
      fim: endOfDay(now),
      descricao: 'Ultimos 30 dias',
    };
  }

  if (periodo === 'ultimos_90') {
    return {
      periodo,
      inicio: startOfDay(new Date(now.getTime() - 89 * MS_DAY)),
      fim: endOfDay(now),
      descricao: 'Ultimos 90 dias',
    };
  }

  if (periodo === 'ano_atual') {
    return {
      periodo,
      inicio: startOfDay(new Date(now.getFullYear(), 0, 1)),
      fim: endOfDay(now),
      descricao: 'Ano atual',
    };
  }

  return {
    periodo: 'mes_atual',
    inicio: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
    fim: endOfDay(now),
    descricao: 'Mes atual',
  };
}

function formatSeriesLabel(key, dayLevel) {
  if (!key) return '-';
  if (dayLevel) {
    const [year, month, day] = String(key).split('-');
    return `${day}/${month}`;
  }

  const [year, month] = String(key).split('-');
  return `${month}/${year}`;
}

function numberValue(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function formatCurrency(value) {
  return numberValue(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPercent(value) {
  return `${numberValue(value).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function formatDate(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR');
}

async function buildRelatoriosPayload(query, userId, ownerObjectId) {
  const range = resolveRange(query || {});
  const matchPedidosPeriodo = { ownerUserId: ownerObjectId, createdAt: { $gte: range.inicio, $lte: range.fim } };
  const matchPedidosVenda = {
    ...matchPedidosPeriodo,
    status: { $in: ['aprovado', 'em_producao', 'finalizacao', 'enviado', 'entregue'] },
  };
  const matchComprasPeriodo = {
    ownerUserId: ownerObjectId,
    data: { $gte: range.inicio, $lte: range.fim },
  };
  const matchSaidasPeriodo = {
    ...matchComprasPeriodo,
    tipo: 'saida',
  };

  const rangeDays = Math.max(1, Math.ceil((range.fim.getTime() - range.inicio.getTime()) / MS_DAY) + 1);
  const dayLevelSeries = rangeDays <= 62;
  const seriesKeyFormat = dayLevelSeries ? '%Y-%m-%d' : '%Y-%m';

  const [
    vendasResumo,
    statusPedidos,
    topClientes,
    topProdutos,
    comprasResumo,
    comprasPorCategoria,
    comprasPorFornecedor,
    pedidosSeries,
    comprasSeries,
    clientesAtivos,
    orcamentosStats,
  ] = await Promise.all([
    Order.aggregate([
      { $match: matchPedidosVenda },
      {
        $group: {
          _id: null,
          pedidos: { $sum: 1 },
          totalVendido: { $sum: '$valor' },
          lucroTotal: { $sum: '$custos.lucroReal' },
          pesoTotal: { $sum: '$pesoEstimado' },
          tempoTotalMin: { $sum: '$tempoImpressao' },
        },
      },
    ]),
    Order.aggregate([
      { $match: matchPedidosPeriodo },
      {
        $group: {
          _id: '$status',
          total: { $sum: 1 },
          valor: { $sum: '$valor' },
        },
      },
      { $sort: { total: -1 } },
    ]),
    Order.aggregate([
      { $match: matchPedidosVenda },
      {
        $group: {
          _id: '$cliente',
          pedidos: { $sum: 1 },
          totalVendido: { $sum: '$valor' },
          lucro: { $sum: '$custos.lucroReal' },
        },
      },
      { $sort: { totalVendido: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from: 'Clientes',
          localField: '_id',
          foreignField: '_id',
          as: 'cliente',
        },
      },
      { $unwind: { path: '$cliente', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          clienteId: '$_id',
          nome: { $ifNull: ['$cliente.nome', 'Sem cliente'] },
          pedidos: 1,
          totalVendido: 1,
          lucro: 1,
        },
      },
    ]),
    Order.aggregate([
      { $match: matchPedidosVenda },
      {
        $group: {
          _id: '$produto',
          pedidos: { $sum: 1 },
          totalVendido: { $sum: '$valor' },
          lucro: { $sum: '$custos.lucroReal' },
        },
      },
      { $sort: { totalVendido: -1 } },
      { $limit: 6 },
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
          nome: { $ifNull: ['$produto.nome', 'Sem produto'] },
          pedidos: 1,
          totalVendido: 1,
          lucro: 1,
        },
      },
    ]),
    FinanceEntry.aggregate([
      { $match: matchSaidasPeriodo },
      {
        $group: {
          _id: null,
          totalCompras: { $sum: '$valor' },
          totalItens: { $sum: '$quantidade' },
        },
      },
    ]),
    FinanceEntry.aggregate([
      { $match: matchSaidasPeriodo },
      {
        $group: {
          _id: { $ifNull: ['$categoria', 'Sem categoria'] },
          total: { $sum: '$valor' },
          lancamentos: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 8 },
    ]),
    FinanceEntry.aggregate([
      { $match: matchSaidasPeriodo },
      {
        $group: {
          _id: { $ifNull: ['$fornecedor', 'Sem fornecedor'] },
          total: { $sum: '$valor' },
          lancamentos: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 8 },
    ]),
    Order.aggregate([
      { $match: matchPedidosVenda },
      {
        $group: {
          _id: {
            $dateToString: {
              format: seriesKeyFormat,
              date: '$createdAt',
              timezone: TZ,
            },
          },
          vendas: { $sum: '$valor' },
          lucro: { $sum: '$custos.lucroReal' },
          pedidos: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    FinanceEntry.aggregate([
      { $match: matchSaidasPeriodo },
      {
        $group: {
          _id: {
            $dateToString: {
              format: seriesKeyFormat,
              date: '$data',
              timezone: TZ,
            },
          },
          compras: { $sum: '$valor' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Client.countDocuments({ ownerUserId: ownerObjectId, ativo: true }),
    Orcamento.aggregate([
      { $match: { ownerUserId: ownerObjectId, createdAt: { $gte: range.inicio, $lte: range.fim } } },
      {
        $group: {
          _id: '$status',
          total: { $sum: 1 },
        },
      },
    ]),
  ]);

  const resumoVendas = vendasResumo[0] || {};
  const resumoCompras = comprasResumo[0] || {};

  const pedidosConfirmados = numberValue(resumoVendas.pedidos);
  const totalVendido = numberValue(resumoVendas.totalVendido);
  const lucroTotal = numberValue(resumoVendas.lucroTotal);
  const totalCompras = numberValue(resumoCompras.totalCompras);
  const ticketMedio = pedidosConfirmados > 0 ? totalVendido / pedidosConfirmados : 0;
  const margemLucro = totalVendido > 0 ? (lucroTotal / totalVendido) * 100 : 0;

  const totalOrcamentos = orcamentosStats.reduce((acc, item) => acc + numberValue(item.total), 0);
  const orcamentosAprovados = orcamentosStats
    .filter((item) => item._id === 'aprovado')
    .reduce((acc, item) => acc + numberValue(item.total), 0);
  const taxaConversao = totalOrcamentos > 0 ? (orcamentosAprovados / totalOrcamentos) * 100 : 0;

  const seriesMap = new Map();
  pedidosSeries.forEach((item) => {
    const key = String(item._id);
    seriesMap.set(key, {
      chave: key,
      periodo: formatSeriesLabel(key, dayLevelSeries),
      pedidos: numberValue(item.pedidos),
      vendas: numberValue(item.vendas),
      lucro: numberValue(item.lucro),
      compras: 0,
    });
  });

  comprasSeries.forEach((item) => {
    const key = String(item._id);
    const row = seriesMap.get(key) || {
      chave: key,
      periodo: formatSeriesLabel(key, dayLevelSeries),
      pedidos: 0,
      vendas: 0,
      lucro: 0,
      compras: 0,
    };
    row.compras = numberValue(item.compras);
    seriesMap.set(key, row);
  });

  const seriePeriodo = [...seriesMap.values()].sort((a, b) => a.chave.localeCompare(b.chave));

  const insights = [];
  const topCliente = topClientes[0];
  const topCategoria = comprasPorCategoria[0];

  if (topCliente) {
    insights.push(`Cliente destaque: ${topCliente.nome} com ${topCliente.pedidos} pedidos no periodo.`);
  }

  insights.push(
    margemLucro >= 30
      ? 'Margem saudavel: operacao acima de 30% de lucro no periodo.'
      : 'Margem de atencao: revise custos e precificacao para melhorar a lucratividade.'
  );

  if (topCategoria) {
    insights.push(`Maior centro de custo: ${topCategoria._id} (${formatCurrency(topCategoria.total)}).`);
  }

  insights.push(
    taxaConversao >= 50
      ? 'Boa conversao de orcamentos para aprovados no periodo.'
      : 'Conversao de orcamentos baixa: considere reforcar follow-up comercial.'
  );

  return {
    periodo: {
      preset: range.periodo,
      descricao: range.descricao,
      inicio: range.inicio,
      fim: range.fim,
      granularidade: dayLevelSeries ? 'dia' : 'mes',
    },
    resumo: {
      pedidosConfirmados,
      totalVendido,
      lucroTotal,
      margemLucro,
      totalCompras,
      ticketMedio,
      clientesAtivos: numberValue(clientesAtivos),
      orcamentos: totalOrcamentos,
      orcamentosAprovados,
      taxaConversao,
      pesoTotal: numberValue(resumoVendas.pesoTotal),
      horasImpressao: numberValue(resumoVendas.tempoTotalMin) / 60,
      totalItensComprados: numberValue(resumoCompras.totalItens),
    },
    listas: {
      topClientes,
      topProdutos,
      comprasPorCategoria: comprasPorCategoria.map((item) => ({
        nome: item._id,
        total: numberValue(item.total),
        lancamentos: numberValue(item.lancamentos),
      })),
      comprasPorFornecedor: comprasPorFornecedor.map((item) => ({
        nome: item._id,
        total: numberValue(item.total),
        lancamentos: numberValue(item.lancamentos),
      })),
      statusPedidos: statusPedidos.map((item) => ({
        status: item._id,
        total: numberValue(item.total),
        valor: numberValue(item.valor),
      })),
      seriePeriodo,
    },
    insights,
  };
}

export const getRelatoriosData = asyncHandler(async (req, res) => {
  const userId = requireRequestUserId(req);
  const ownerObjectId = requireRequestUserObjectId(req);
  const payload = await buildRelatoriosPayload(req.query || {}, userId, ownerObjectId);
  res.json(payload);
});

export const getRelatoriosPdf = asyncHandler(async (req, res) => {
  const userId = requireRequestUserId(req);
  const ownerObjectId = requireRequestUserObjectId(req);
  const payload = await buildRelatoriosPayload(req.query || {}, userId, ownerObjectId);
  const reportLogo = await resolveRelatorioLogo(userId);
  const secao = String(req.query?.secao || 'geral').trim();
  const download = String(req.query?.download || '') === '1';
  const secaoLabel = secao === 'clientes'
    ? 'Clientes e Vendas'
    : secao === 'compras'
      ? 'Compras e Custos'
      : secao === 'pedidos'
        ? 'Pedidos e Performance'
        : 'Visao Geral';

  const fileName = `relatorio-${secao}-${Date.now()}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${fileName}"`);

  const doc = new PDFDocument({ margin: 36, size: 'A4' });
  doc.pipe(res);

  const pageLeft = doc.page.margins.left;
  const pageRight = doc.page.width - doc.page.margins.right;
  const contentWidth = pageRight - pageLeft;

  const ensureSpace = (space = 72) => {
    if (doc.y > doc.page.height - space) {
      doc.addPage();
    }
  };

  const drawCard = ({ x, y, w, h, fill = '#ffffff', stroke = '#d8e2ef', radius = 10 }) => {
    doc.save();
    doc.roundedRect(x, y, w, h, radius).fillAndStroke(fill, stroke);
    doc.restore();
  };

  const writeLine = (label, value, small = false) => {
    ensureSpace();
    const lineTop = doc.y;
    doc.font('Helvetica-Bold').fontSize(small ? 9 : 10).fillColor('#355073').text(label, pageLeft, lineTop, { continued: true });
    doc.font('Helvetica').fontSize(small ? 9 : 10).fillColor('#1f2f46').text(` ${value}`);
  };

  const writeSectionTitle = (title) => {
    ensureSpace();
    doc.moveDown(0.35);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#163b69').text(title, pageLeft, doc.y);
    doc.moveTo(pageLeft, doc.y + 3).lineTo(pageRight, doc.y + 3).strokeColor('#dce6f3').stroke();
    doc.moveDown(0.45);
  };

  const writeListBlock = (title, lines, options = {}) => {
    const topPadding = options.topPadding ?? 10;
    const sidePadding = options.sidePadding ?? 12;
    const titleGap = options.titleGap ?? 8;
    const lineGap = options.lineGap ?? 4;
    const minHeight = options.minHeight ?? 64;
    const bodyFontSize = options.bodyFontSize ?? 10;

    const estimatedLines = Math.max(1, (Array.isArray(lines) ? lines.length : 0));
    const estimatedHeight = minHeight + estimatedLines * (bodyFontSize + lineGap);

    ensureSpace(estimatedHeight + 18);
    const top = doc.y;
    drawCard({ x: pageLeft, y: top, w: contentWidth, h: estimatedHeight, fill: '#ffffff', stroke: '#d9e4f2', radius: 12 });

    doc.font('Helvetica-Bold').fontSize(12).fillColor('#163b69').text(title, pageLeft + sidePadding, top + topPadding);
    let y = top + topPadding + titleGap + 8;

    (Array.isArray(lines) ? lines : []).forEach((line) => {
      doc.font('Helvetica').fontSize(bodyFontSize).fillColor('#1f2f46').text(line, pageLeft + sidePadding, y, {
        width: contentWidth - sidePadding * 2,
      });
      y = doc.y + lineGap;
    });

    doc.y = Math.max(top + estimatedHeight + 12, y + 4);
    doc.x = pageLeft;
  };

  // Header visual com logo e dados do periodo
  const headerTop = doc.y;
  const headerHeight = 96;
  drawCard({ x: pageLeft, y: headerTop, w: contentWidth, h: headerHeight, fill: '#f5f8fc', stroke: '#d9e4f2', radius: 14 });

  let logoBottom = headerTop + 20;
  if (reportLogo.showLogo && reportLogo.source) {
    try {
      doc.image(reportLogo.source, pageLeft + 16, headerTop + 14, { fit: [116, 42] });
      logoBottom = headerTop + 58;
    } catch {
      logoBottom = headerTop + 22;
    }
  } else {
    logoBottom = headerTop + 22;
  }

  doc.font('Helvetica-Bold').fontSize(18).fillColor('#12335f').text('Relatorio Inteligente', pageLeft + 16, logoBottom + 2);
  doc.font('Helvetica').fontSize(10).fillColor('#4a6386').text('SyPrint3D', pageLeft + 16, logoBottom + 24);

  const rightX = pageLeft + contentWidth - 238;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#355073').text('Secao', rightX, headerTop + 16);
  doc.font('Helvetica').fontSize(10).fillColor('#1f2f46').text(secaoLabel, rightX + 54, headerTop + 16, { width: 180 });
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#355073').text('Periodo', rightX, headerTop + 34);
  doc.font('Helvetica').fontSize(10).fillColor('#1f2f46').text(`${payload.periodo.descricao} (${formatDate(payload.periodo.inicio)} a ${formatDate(payload.periodo.fim)})`, rightX + 54, headerTop + 34, { width: 180 });

  doc.y = headerTop + headerHeight + 14;
  doc.x = pageLeft;

  writeSectionTitle('Resumo executivo');
  const kpiTop = doc.y;
  const kpiHeight = 78;
  const gap = 8;
  const kpiW = (contentWidth - gap * 2) / 3;
  drawCard({ x: pageLeft, y: kpiTop, w: kpiW, h: kpiHeight, fill: '#ffffff', stroke: '#d9e4f2' });
  drawCard({ x: pageLeft + kpiW + gap, y: kpiTop, w: kpiW, h: kpiHeight, fill: '#ffffff', stroke: '#d9e4f2' });
  drawCard({ x: pageLeft + (kpiW + gap) * 2, y: kpiTop, w: kpiW, h: kpiHeight, fill: '#ffffff', stroke: '#d9e4f2' });

  doc.font('Helvetica').fontSize(9).fillColor('#6f84a3').text('VENDIDO', pageLeft + 10, kpiTop + 10);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#123d75').text(formatCurrency(payload.resumo.totalVendido), pageLeft + 10, kpiTop + 26);
  doc.font('Helvetica').fontSize(9).fillColor('#6f84a3').text('LUCRO', pageLeft + 10, kpiTop + 50);
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#2a5a8f').text(formatCurrency(payload.resumo.lucroTotal), pageLeft + 10, kpiTop + 62);

  const col2 = pageLeft + kpiW + gap + 10;
  doc.font('Helvetica').fontSize(9).fillColor('#6f84a3').text('COMPRAS', col2, kpiTop + 10);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#123d75').text(formatCurrency(payload.resumo.totalCompras), col2, kpiTop + 26);
  doc.font('Helvetica').fontSize(9).fillColor('#6f84a3').text('TICKET MEDIO', col2, kpiTop + 50);
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#2a5a8f').text(formatCurrency(payload.resumo.ticketMedio), col2, kpiTop + 62);

  const col3 = pageLeft + (kpiW + gap) * 2 + 10;
  doc.font('Helvetica').fontSize(9).fillColor('#6f84a3').text('MARGEM DE LUCRO (PERIODO)', col3, kpiTop + 10);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#123d75').text(formatPercent(payload.resumo.margemLucro), col3, kpiTop + 26);
  doc.font('Helvetica').fontSize(9).fillColor('#6f84a3').text('CONVERSAO DE ORCAMENTOS', col3, kpiTop + 50);
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#2a5a8f').text(formatPercent(payload.resumo.taxaConversao), col3, kpiTop + 62);

  doc.y = kpiTop + kpiHeight + 14;

  if (secao === 'clientes') {
    writeListBlock(
      'Top clientes',
      (payload.listas.topClientes || []).map(
        (item, index) => `${index + 1}. ${item.nome}: ${item.pedidos} pedidos | ${formatCurrency(item.totalVendido)} | lucro ${formatCurrency(item.lucro)}`
      )
    );

    writeListBlock(
      'Top produtos',
      (payload.listas.topProdutos || []).map(
        (item, index) => `${index + 1}. ${item.nome}: ${item.pedidos} pedidos | ${formatCurrency(item.totalVendido)} | lucro ${formatCurrency(item.lucro)}`
      )
    );
  } else if (secao === 'compras') {
    writeListBlock(
      'Compras por categoria',
      (payload.listas.comprasPorCategoria || []).map(
        (item, index) => `${index + 1}. ${item.nome}: ${item.lancamentos} lancamentos | ${formatCurrency(item.total)}`
      )
    );

    writeListBlock(
      'Compras por fornecedor',
      (payload.listas.comprasPorFornecedor || []).map(
        (item, index) => `${index + 1}. ${item.nome}: ${item.lancamentos} lancamentos | ${formatCurrency(item.total)}`
      )
    );
  } else if (secao === 'pedidos') {
    writeListBlock('Performance operacional', [
      `Pedidos confirmados: ${payload.resumo.pedidosConfirmados}`,
      `Horas de impressao: ${numberValue(payload.resumo.horasImpressao).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} h`,
      `Peso produzido: ${numberValue(payload.resumo.pesoTotal).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} g`,
      `Clientes ativos: ${payload.resumo.clientesAtivos}`,
    ]);

    writeListBlock(
      'Pedidos por status',
      (payload.listas.statusPedidos || []).map(
        (item) => `${String(item.status || '-').replaceAll('_', ' ')}: ${item.total} pedidos | ${formatCurrency(item.valor)}`
      )
    );
  } else {
    writeListBlock(
      'Evolucao por periodo',
      (payload.listas.seriePeriodo || []).map(
        (item) => `${item.periodo}: pedidos ${item.pedidos} | vendas ${formatCurrency(item.vendas)} | lucro ${formatCurrency(item.lucro)} | compras ${formatCurrency(item.compras)}`
      )
    );
  }

  writeListBlock(
    'Insights',
    (payload.insights || []).map((item, index) => `${index + 1}. ${item}`),
    { minHeight: 72, lineGap: 3 }
  );

  doc.font('Helvetica').fontSize(8.5).fillColor('#6f84a3').text(
    `Gerado em ${new Date().toLocaleString('pt-BR')} • SyPrint3D`,
    pageLeft,
    doc.page.height - 28,
    { width: contentWidth, align: 'center' }
  );

  doc.end();
});
