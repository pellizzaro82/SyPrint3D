import { renderInicioPage } from './pages/inicio.page.js';
import { renderClientesPage } from './pages/clientes.page.js';
import { renderOrcamentosPage } from './pages/orcamentos.page.js';
import { renderProdutosPage } from './pages/produtos.page.js';
import { renderMateriaisPage } from './pages/materiais.page.js';
import { renderPedidosPage } from './pages/pedidos.page.js';
import { renderComprasPage } from './pages/compras.page.js';
import { renderCalculadoraPage } from './pages/calculadora.page.js';
import { renderAtivosPage } from './pages/ativos.page.js';
import { renderGerenciamentoMasterPage } from './pages/gerenciamento-master.page.js';
import { renderUsuariosPage } from './pages/usuarios.page.js';
import { renderPlanosPage } from './pages/planos.page.js';
import { renderAssinaturaPage } from './pages/assinatura.page.js';
import { renderConfiguracoesPage } from './pages/configuracoes.page.js';
import { renderOutrosCadastrosPage } from './pages/outros-cadastros.page.js';

const API_URL = '/api';
const AUTH_TOKEN_KEY = 'syprint3d_auth_token';

const STATUS_FLOW = ['orcamento', 'aprovado', 'em_producao', 'finalizacao', 'enviado', 'entregue'];

const MENU_SECTIONS = [
  {
    title: 'MENU',
    items: [
      { id: 'inicio', label: 'Inicio' },
      { id: 'pedidos', label: 'Pedidos' },
      { id: 'orcamentos', label: 'Orcamentos' },
      { id: 'clientes', label: 'Clientes' },
      { id: 'produtos', label: 'Produtos' },
      { id: 'materiais', label: 'Materiais' },
      { id: 'compras', label: 'Compras' },
      { id: 'calculadora', label: 'Calculadora' },
      { id: 'ativos', label: 'Equipamentos' },
      { id: 'outros-cadastros', label: 'Outros Cadastros' },
    ],
  },
  {
    title: 'SISTEMA',
    items: [
      { id: 'assinatura', label: 'Minha Assinatura' },
      { id: 'gerenciamento-master', label: 'Gerenciamento Master' },
      { id: 'configuracoes', label: 'Configuracoes' },
      { id: 'relatorios', label: 'Relatorios' },
      { id: 'suporte', label: 'Suporte' },
    ],
  },
];

const HIDDEN_PAGE_LABELS = {
  planos: 'Gestao de Planos',
  usuarios: 'Gestao de Usuarios',
  'gerenciamento-master': 'Gerenciamento Master',
};

const appState = {
  dashboard: null,
  conta: null,
  configuracoes: null,
  clientes: [],
  produtos: [],
  pedidos: [],
  orcamentos: [],
  financeiro: [],
  filamentos: [],
  materiais: [],
  impressoras: [],
  outrosCadastros: null,
  adminUsers: [],
  masterPlans: [],
  masterPlanMeta: null,
  ui: {
    page: 'inicio',
    mostrarNovoCliente: false,
    clienteEmEdicaoId: null,
    clientesBusca: '',
    clientesSomenteAtivos: false,
    mostrarNovoOrcamento: false,
    orcamentoEmEdicaoId: null,
    orcamentosBusca: '',
    orcamentosFiltro: 'todos',
    mostrarNovoFilamento: false,
    filamentoEmEdicaoId: null,
    materiaisBusca: '',
    materiaisSomenteEstoqueBaixo: false,
    mostrarNovaCompra: false,
    compraEmEdicaoId: null,
    comprasBusca: '',
    comprasSomenteMesAtual: false,
    produtosBusca: '',
    produtosCategoria: 'todas',
    produtosSomenteEstoqueBaixo: false,
    mostrarNovoProduto: false,
    produtoEmEdicaoId: null,
    produtoImagemVisualizando: null,
    outrosCadastrosSecao: '',
    outrosCadastrosBusca: '',
    mostrarOutroCadastroModal: false,
    outroCadastroEditIndex: null,
    pedidosBusca: '',
    pedidosFiltro: 'todos',
    pedidosDataFiltro: 'mes_atual',
    pedidosDataInicio: '',
    pedidosDataFim: '',
    mostrarNovoPedido: false,
    mostrarEditarPedido: false,
    pedidoEmEdicaoId: null,
    vendasBusca: '',
    vendasFiltro: 'todos',
    mostrarNovaVenda: false,
    vendaSelecionadaId: null,
    mostrarTrocaPlanoModal: false,
    configuracoesSecao: '',
    adminUsersBusca: '',
    mostrarNovoUsuarioModal: false,
    adminUserPasswordModalId: null,
  },
};

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function number(value) {
  return Number(value || 0).toLocaleString('pt-BR');
}

function safeDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR');
}

function getOrderCode(order) {
  if (order?.codigoPedido) return order.codigoPedido;
  if (order?.numeroPedido) return `Nº ${String(order.numeroPedido).padStart(5, '0')}`;
  return '-';
}

function getAuthToken() {
  return String(localStorage.getItem(AUTH_TOKEN_KEY) || '').trim();
}

function buildApiHeaders(extraHeaders = {}) {
  const token = getAuthToken();
  const headers = { ...extraHeaders };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function apiFetch(path, options = {}) {
  const nextOptions = { ...options };
  nextOptions.headers = buildApiHeaders(options.headers || {});
  return fetch(`${API_URL}${path}`, nextOptions);
}

async function getOrFallback(path, fallback) {
  try {
    const response = await apiFetch(path);
    if (!response.ok) throw new Error('request_failed');
    return await response.json();
  } catch {
    return fallback;
  }
}


// Equipamentos (ativos) - API
async function carregarImpressoras() {
  const res = await apiFetch('/equipamentos');
  if (res.ok) {
    appState.impressoras = await res.json();
  } else {
    appState.impressoras = [];
  }
}

async function salvarImpressora(impressora) {
  const objectIdRegex = /^[a-fA-F0-9]{24}$/;
  const id = String(impressora._id || '');
  const isEdit = objectIdRegex.test(id);
  const payload = { ...impressora };
  delete payload.id;
  if (!objectIdRegex.test(String(payload._id || ''))) delete payload._id;
  if (isEdit) {
    const res = await apiFetch(`/equipamentos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  }

  const res = await apiFetch('/equipamentos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

async function excluirImpressora(id) {
  const objectIdRegex = /^[a-fA-F0-9]{24}$/;
  const safeId = String(id || '');
  if (!objectIdRegex.test(safeId)) return false;
  const res = await apiFetch(`/equipamentos/${safeId}`, { method: 'DELETE' });
  return res.ok;
}

async function postJson(path, payload) {
  const response = await apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response;
}

async function putJson(path, payload) {
  const response = await apiFetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response;
}

function setPage(page) {
  appState.ui.page = page;
  if (page !== 'clientes') {
    appState.ui.mostrarNovoCliente = false;
    appState.ui.clienteEmEdicaoId = null;
  }
  if (page !== 'assinatura') {
    appState.ui.mostrarTrocaPlanoModal = false;
  }
  if (page !== 'configuracoes') {
    appState.ui.configuracoesSecao = '';
  }
  if (page !== 'orcamentos') {
    appState.ui.mostrarNovoOrcamento = false;
    appState.ui.orcamentoEmEdicaoId = null;
  }
  if (page !== 'produtos') {
    appState.ui.mostrarNovoProduto = false;
    appState.ui.produtoEmEdicaoId = null;
    appState.ui.produtoImagemVisualizando = null;
  }
  if (page !== 'materiais') {
    appState.ui.mostrarNovoFilamento = false;
    appState.ui.filamentoEmEdicaoId = null;
  }
  if (page !== 'outros-cadastros') {
    appState.ui.outrosCadastrosSecao = '';
    appState.ui.outrosCadastrosBusca = '';
    appState.ui.mostrarOutroCadastroModal = false;
    appState.ui.outroCadastroEditIndex = null;
  }
    if (page !== 'compras') {
      appState.ui.mostrarNovaCompra = false;
      appState.ui.compraEmEdicaoId = null;
    }
  render();
}

function toggleTheme() {
  document.body.classList.toggle('theme-light');
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function filesToDataUrls(files) {
  return Promise.all((Array.isArray(files) ? files : []).map((file) => fileToDataUrl(file)));
}

function laneConfig() {
  return [
    { key: 'recebido', label: 'Recebido', color: 'lane-blue' },
    { key: 'imprimindo', label: 'Imprimindo', color: 'lane-purple' },
    { key: 'acabamento', label: 'Acabamento', color: 'lane-yellow' },
    { key: 'pronto', label: 'Pronto', color: 'lane-green' },
    { key: 'entrega', label: 'Saiu p/ Entrega', color: 'lane-orange' },
    { key: 'enviado', label: 'Enviado', color: 'lane-indigo' },
    { key: 'entregue', label: 'Entregue', color: 'lane-emerald' },
  ];
}

function statusToLane(status) {
  if (status === 'orcamento') return 'recebido';
  if (status === 'aprovado' || status === 'em_producao') return 'imprimindo';
  if (status === 'finalizacao') return 'acabamento';
  if (status === 'enviado') return 'enviado';
  if (status === 'entregue') return 'entregue';
  return 'recebido';
}

function nextStatus(current) {
  const index = STATUS_FLOW.indexOf(current);
  if (index < 0 || index === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[index + 1];
}

function laneToStatus(lane) {
  // Em Pedidos, ao retornar para "Recebido" o item deve continuar no fluxo de producao.
  if (lane === 'recebido') return 'aprovado';
  if (lane === 'imprimindo') return 'em_producao';
  if (lane === 'acabamento') return 'finalizacao';
  if (lane === 'pronto') return 'finalizacao';
  if (lane === 'entrega') return 'enviado';
  if (lane === 'enviado') return 'enviado';
  if (lane === 'entregue') return 'entregue';
  return null;
}

async function moverPedido(orderId, laneDestino) {
  const statusDestino = laneToStatus(laneDestino);
  if (!statusDestino) return;

  const response = await putJson(`/pedidos/${orderId}`, { status: statusDestino, lane: laneDestino });
  if (response.ok) {
    await bootstrap();
  }
}

async function avancarPedido(orderId, statusAtual) {
  const prox = nextStatus(statusAtual);
  if (!prox) return;

  const response = await putJson(`/pedidos/${orderId}`, { status: prox });
  if (response.ok) {
    await bootstrap();
  }
}

async function excluirPedido(orderId) {
  if (!confirm('Deseja realmente excluir este pedido?')) return;

  const response = await apiFetch(`/pedidos/${orderId}`, { method: 'DELETE' });
  if (response.ok) {
    await bootstrap();
  }
}

async function excluirOrcamento(orcamentoId) {
  if (!confirm('Deseja realmente excluir este orcamento?')) return;

  const response = await apiFetch(`/orcamentos/${orcamentoId}`, { method: 'DELETE' });
  if (response.ok) {
    await bootstrap();
  }
}

async function excluirProduto(productId) {
  if (!confirm('Deseja realmente excluir este produto?')) return;
  const response = await apiFetch(`/produtos/${productId}`, { method: 'DELETE' });
  if (response.ok) {
    await bootstrap();
  }
}

async function excluirFilamento(filamentId) {
  if (!confirm('Deseja realmente excluir este item do estoque?')) return;
  const response = await apiFetch(`/materiais/${filamentId}`, { method: 'DELETE' });
  if (response.ok) {
    await bootstrap();
  }
}

async function excluirCompra(compraId) {
  if (!confirm('Deseja realmente excluir esta compra?')) return;
  const response = await apiFetch(`/financeiro/${compraId}`, { method: 'DELETE' });
  if (response.ok) {
    await bootstrap();
  }
}

async function excluirCliente(clientId) {
  if (!confirm('Deseja realmente excluir este cliente?')) return;
  const response = await apiFetch(`/clientes/${clientId}`, { method: 'DELETE' });
  if (response.ok) {
    await bootstrap();
  }
}

function abrirEditarPedido(orderId) {
  appState.ui.pedidoEmEdicaoId = orderId;
  appState.ui.mostrarEditarPedido = true;
  render();
}

function fecharEditarPedido() {
  appState.ui.mostrarEditarPedido = false;
  appState.ui.pedidoEmEdicaoId = null;
  render();
}

function abrirEditarProduto(productId) {
  appState.ui.produtoEmEdicaoId = productId;
  appState.ui.mostrarNovoProduto = true;
  render();
}

function fecharModalProduto() {
  appState.ui.mostrarNovoProduto = false;
  appState.ui.produtoEmEdicaoId = null;
  render();
}

function abrirEditarFilamento(filamentId) {
  appState.ui.filamentoEmEdicaoId = filamentId;
  appState.ui.mostrarNovoFilamento = true;
  render();
}

function fecharModalFilamento() {
  appState.ui.mostrarNovoFilamento = false;
  appState.ui.filamentoEmEdicaoId = null;
  render();
}

function abrirEditarCompra(compraId) {
  appState.ui.compraEmEdicaoId = compraId;
  appState.ui.mostrarNovaCompra = true;
  render();
}

function fecharModalCompra() {
  appState.ui.mostrarNovaCompra = false;
  appState.ui.compraEmEdicaoId = null;
  render();
}

function abrirEditarCliente(clientId) {
  appState.ui.clienteEmEdicaoId = clientId;
  appState.ui.mostrarNovoCliente = true;
  render();
}

function fecharModalCliente() {
  appState.ui.mostrarNovoCliente = false;
  appState.ui.clienteEmEdicaoId = null;
  render();
}

function abrirEditarOrcamento(orderId) {
  appState.ui.orcamentoEmEdicaoId = orderId;
  appState.ui.mostrarNovoOrcamento = true;
  render();
}

function fecharModalOrcamento() {
  appState.ui.mostrarNovoOrcamento = false;
  appState.ui.orcamentoEmEdicaoId = null;
  render();
}

async function aprovarOrcamento(orderId) {
  const response = await putJson(`/orcamentos/${orderId}`, { status: 'aprovado' });
  if (response.ok) {
    await bootstrap();
  }
}

function imprimirOrcamento(orderId) {
  const orcamento = appState.orcamentos.find((item) => item._id === orderId);
  if (!orcamento) return;

  const config = appState.configuracoes || {};
  const branding = config?.perfilEmpresa || {};
  const printPrefs = config?.impressaoPdf || {};
  const quotePrefs = config?.orcamentos || {};
  const logoSrc = branding.logoDataUrl || '/images/Logo.png';
  const accentColor = printPrefs.corCabecalhoPdf || '#e9eef5';
  const showLogo = printPrefs.mostrarLogoNoPdf !== false;
  const observacoes = orcamento?.observacoes || quotePrefs?.textoPadraoObservacoes || '-';
  const message = quotePrefs?.mensagemPadraoPdf || 'Documento para envio ao cliente. Use Imprimir para papel ou Salvar como PDF.';
  const itens = getPrintableItems(orcamento);

  const html = buildPrintableDocument({
    title: `Orcamento ${escapeHtml(getOrderCode(orcamento))}`,
    documentLabel: 'Orcamento',
    subtitle: escapeHtml(message),
    logoSrc: showLogo ? escapeHtml(logoSrc) : '',
    companyName: escapeHtml(branding.nomeFantasia || 'SyPrint3D'),
    accentColor: escapeHtml(accentColor),
    footerText: escapeHtml(printPrefs.rodapePadrao || 'SyPrint3D'),
    details: [
      ['Cliente', escapeHtml(orcamento?.cliente?.nome || '-')],
      ['Itens', number(itens.length || 1)],
      ['Quantidade total', number(orcamento?.quantidade || 1)],
      ['Peso estimado', `${number(orcamento?.pesoEstimado || 0)} g`],
      ['Tempo estimado', `${number(orcamento?.tempoImpressao || 0)} min`],
      ['Validade', safeDate(orcamento?.dataEntregaPrevista)],
      ['Status', escapeHtml(orcamento?.status || '-')],
      ['Codigo', escapeHtml(getOrderCode(orcamento))],
    ],
    totalLabel: 'Total',
    totalValue: money(orcamento?.valor || 0),
    extraSections: buildPrintableItemsSection({
      title: 'Itens do orcamento',
      headers: ['Produto', 'Qtd', 'Material', 'Peso', 'Tempo', 'Valor'],
      rows: itens.map((item) => [
        escapeHtml(item?.produto?.nome || '-'),
        number(item?.quantidade || 1),
        escapeHtml(item?.material || '-'),
        `${number(item?.pesoEstimado || 0)} g`,
        `${number(item?.tempoImpressao || 0)} min`,
        money(item?.valor || 0),
      ]),
    }),
    notesTitle: 'Observacoes',
    notes: escapeHtml(observacoes),
  });

  openPrintPreview(html);
}

function imprimirPedido(orderId) {
  const pedido = appState.pedidos.find((item) => item._id === orderId);
  if (!pedido) return;

  const config = appState.configuracoes || {};
  const branding = config?.perfilEmpresa || {};
  const printPrefs = config?.impressaoPdf || {};
  const logoSrc = branding.logoDataUrl || '/images/Logo.png';
  const accentColor = printPrefs.corCabecalhoPdf || '#e9eef5';
  const showLogo = printPrefs.mostrarLogoNoPdf !== false;
  const custoTotal = Number(pedido?.custos?.custoTotal || 0);
  const lucro = Number(pedido?.custos?.lucroReal || 0);
  const itens = getPrintableItems(pedido);

  const html = buildPrintableDocument({
    title: `Pedido ${escapeHtml(getOrderCode(pedido))}`,
    documentLabel: 'Pedido',
    subtitle: 'Documento operacional do pedido para impressao ou salvamento em PDF.',
    logoSrc: showLogo ? escapeHtml(logoSrc) : '',
    companyName: escapeHtml(branding.nomeFantasia || 'SyPrint3D'),
    accentColor: escapeHtml(accentColor),
    footerText: escapeHtml(printPrefs.rodapePadrao || 'SyPrint3D'),
    details: [
      ['Cliente', escapeHtml(pedido?.cliente?.nome || '-')],
      ['Itens', number(itens.length || 1)],
      ['Quantidade total', number(pedido?.quantidade || 1)],
      ['Material principal', escapeHtml(pedido?.material || '-')],
      ['Peso estimado', `${number(pedido?.pesoEstimado || 0)} g`],
      ['Tempo estimado', `${number(pedido?.tempoImpressao || 0)} min`],
      ['Equipamento principal', escapeHtml(pedido?.impressora?.nome || pedido?.impressora?.modelo || '-')],
      ['Status', escapeHtml(pedido?.status || '-')],
      ['Data do pedido', safeDate(pedido?.createdAt || pedido?.updatedAt)],
      ['Codigo', escapeHtml(getOrderCode(pedido))],
      ['Custo estimado', money(custoTotal)],
      ['Lucro estimado', money(lucro)],
    ],
    totalLabel: 'Valor do pedido',
    totalValue: money(pedido?.valor || 0),
    extraSections: buildPrintableItemsSection({
      title: 'Itens do pedido',
      headers: ['Produto', 'Qtd', 'Material', 'Peso', 'Tempo', 'Equipamento', 'Valor', 'Lucro'],
      rows: itens.map((item) => [
        escapeHtml(item?.produto?.nome || '-'),
        number(item?.quantidade || 1),
        escapeHtml(item?.material || '-'),
        `${number(item?.pesoEstimado || 0)} g`,
        `${number(item?.tempoImpressao || 0)} min`,
        escapeHtml(item?.impressora?.nome || item?.impressora?.modelo || '-'),
        money(item?.valor || 0),
        money(item?.custos?.lucroReal || 0),
      ]),
    }),
    notesTitle: 'Observacoes',
    notes: escapeHtml(pedido?.observacoes || 'Sem observacoes registradas.'),
  });

  openPrintPreview(html);
}

function buildPrintableDocument({
  title,
  documentLabel,
  subtitle,
  logoSrc,
  companyName,
  accentColor,
  footerText,
  details,
  totalLabel,
  totalValue,
  extraSections,
  notesTitle,
  notes,
}) {
  const detailItems = (Array.isArray(details) ? details : [])
    .map(
      ([label, value]) => `
        <div class="doc-metric">
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `
    )
    .join('');

  return `
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: A4; margin: 16mm; }
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; color: #17304f; background: #f4f7fb; }
          .doc-shell { max-width: 820px; margin: 0 auto; background: #ffffff; border: 1px solid #d9e1eb; border-radius: 18px; overflow: hidden; }
          .doc-topbar { height: 10px; background: ${accentColor}; }
          .doc-header { display: flex; justify-content: space-between; gap: 20px; padding: 24px 28px 18px; border-bottom: 1px solid #e4eaf2; }
          .doc-brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
          .doc-brand img { width: 72px; height: 72px; object-fit: contain; border-radius: 14px; background: #10233d; padding: 8px; border: 1px solid #d8e2f0; }
          .doc-brand-meta h1 { margin: 0; font-size: 28px; color: #163254; }
          .doc-brand-meta p { margin: 4px 0 0; color: #60738f; font-size: 13px; }
          .doc-chip { align-self: flex-start; padding: 8px 12px; border-radius: 999px; background: #f2f6fb; color: #30527d; border: 1px solid #d9e3ef; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
          .doc-content { padding: 22px 28px 28px; }
          .doc-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 16px; }
          .doc-metric { padding: 12px 14px; border: 1px solid #dde5ef; border-radius: 14px; background: #fbfdff; }
          .doc-metric span { display: block; color: #6c7f98; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; }
          .doc-metric strong { color: #17304f; font-size: 15px; }
          .doc-total { margin-top: 18px; padding: 18px 20px; border-radius: 16px; background: linear-gradient(180deg, #f6f9fd, #edf3fa); border: 1px solid #dbe4ef; }
          .doc-total span { display: block; color: #60738f; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
          .doc-total strong { display: block; margin-top: 6px; color: #1e5da8; font-size: 30px; }
          .doc-section { margin-top: 18px; border: 1px solid #dde5ef; border-radius: 16px; background: #ffffff; overflow: hidden; }
          .doc-section h2 { margin: 0; padding: 14px 18px; font-size: 14px; color: #30527d; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #e5ecf4; background: #f8fbff; }
          .doc-table-wrap { overflow: hidden; }
          .doc-table { width: 100%; border-collapse: collapse; }
          .doc-table th, .doc-table td { padding: 12px 14px; border-bottom: 1px solid #e8eef5; text-align: left; font-size: 13px; }
          .doc-table th { color: #60738f; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; background: #fbfdff; }
          .doc-table td { color: #26415f; }
          .doc-notes { margin-top: 18px; padding: 16px 18px; border: 1px solid #dde5ef; border-radius: 16px; background: #ffffff; }
          .doc-notes h2 { margin: 0 0 8px; font-size: 14px; color: #30527d; text-transform: uppercase; letter-spacing: 0.04em; }
          .doc-notes p { margin: 0; color: #495d79; line-height: 1.6; white-space: pre-wrap; }
          .doc-footer { padding: 14px 28px 24px; color: #71839b; font-size: 12px; }
          @media print {
            body { background: #ffffff; }
            .doc-shell { border: none; border-radius: 0; max-width: none; }
          }
        </style>
      </head>
      <body>
        <div class="doc-shell">
          <div class="doc-topbar"></div>
          <header class="doc-header">
            <div class="doc-brand">
              ${logoSrc ? `<img src="${logoSrc}" alt="Logo da empresa" />` : ''}
              <div class="doc-brand-meta">
                <h1>${companyName}</h1>
                <p>${subtitle}</p>
              </div>
            </div>
            <div class="doc-chip">${documentLabel}</div>
          </header>
          <main class="doc-content">
            <section class="doc-grid">
              ${detailItems}
            </section>
            <section class="doc-total">
              <span>${totalLabel}</span>
              <strong>${totalValue}</strong>
            </section>
            ${extraSections || ''}
            <section class="doc-notes">
              <h2>${notesTitle}</h2>
              <p>${notes}</p>
            </section>
          </main>
          <footer class="doc-footer">${footerText}</footer>
        </div>
      </body>
    </html>
  `;
}

function openPrintPreview(html) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function getPrintableItems(documento) {
  if (Array.isArray(documento?.itens) && documento.itens.length) {
    return documento.itens;
  }

  if (!documento) return [];

  return [
    {
      produto: documento?.produto || null,
      quantidade: documento?.quantidade || 1,
      material: documento?.material || '-',
      pesoEstimado: documento?.pesoEstimado || 0,
      tempoImpressao: documento?.tempoImpressao || 0,
      impressora: documento?.impressora || null,
      valor: documento?.valor || 0,
      custos: documento?.custos || {},
    },
  ];
}

function buildPrintableItemsSection({ title, headers, rows }) {
  if (!Array.isArray(rows) || !rows.length) return '';

  return `
    <section class="doc-section">
      <h2>${title}</h2>
      <div class="doc-table-wrap">
        <table class="doc-table">
          <thead>
            <tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
                  <tr>${row.map((value) => `<td>${value}</td>`).join('')}</tr>
                `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function summaryCards() {
  const cards = appState.dashboard?.cards || {};
  return `
    <div class="summary-grid">
      <article class="summary-card"><p>Faturamento Mensal</p><strong>${money(cards.faturamentoMensal)}</strong></article>
      <article class="summary-card"><p>Lucro Mensal</p><strong>${money(cards.lucroMensal)}</strong></article>
      <article class="summary-card"><p>Pedidos em Producao</p><strong>${number(cards.pedidosEmProducao)}</strong></article>
      <article class="summary-card"><p>Pedidos Entregues</p><strong>${number(cards.pedidosEntregues)}</strong></article>
      <article class="summary-card"><p>Consumo de Filamento</p><strong>${number(cards.consumoFilamento)} g</strong></article>
      <article class="summary-card"><p>Horas de Impressao</p><strong>${number(cards.horasImpressao)} h</strong></article>
      <article class="summary-card"><p>Notas Emitidas</p><strong>${number(cards.notasEmitidas)}</strong></article>
      <article class="summary-card"><p>Clientes Ativos</p><strong>${number(cards.clientesAtivos)}</strong></article>
    </div>
  `;
}

function baseTable(headers, rows) {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rows || '<tr><td colspan="8">Sem dados.</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

// Renderizacao das paginas foi modularizada em public/js/pages/*.page.js.

function renderPage() {
  const pageCtx = {
    appState,
    summaryCards,
    baseTable,
    escapeHtml,
    money,
    number,
    safeDate,
    laneConfig,
    statusToLane,
    getOrderCode,
  };

  switch (appState.ui.page) {
    case 'inicio':
      return renderInicioPage(pageCtx);
    case 'clientes':
      return renderClientesPage(pageCtx);
    case 'pedidos':
      return renderPedidosPage(pageCtx);
    case 'orcamentos':
      return renderOrcamentosPage(pageCtx);
    case 'produtos':
      return renderProdutosPage(pageCtx);
    case 'materiais':
      return renderMateriaisPage(pageCtx);
    case 'compras':
      return renderComprasPage(pageCtx);
    case 'calculadora':
      return renderCalculadoraPage(pageCtx);
    case 'ativos':
      return renderAtivosPage(pageCtx);
    case 'assinatura':
      return renderAssinaturaPage(pageCtx);
    case 'planos':
      return renderPlanosPage(pageCtx);
    case 'usuarios':
      return renderUsuariosPage(pageCtx);
    case 'gerenciamento-master':
      return renderGerenciamentoMasterPage(pageCtx);
    case 'configuracoes':
      return renderConfiguracoesPage(pageCtx);
    case 'outros-cadastros':
      return renderOutrosCadastrosPage(pageCtx);
    case 'relatorios':
      return '<section><header class="page-header"><div><h2>Relatorios</h2><p>Consolidado de vendas, lucro, estoque e produtividade.</p></div></header><div class="limit-box">Modulo preparado para evoluir tela a tela com regras do seu fluxo.</div></section>';
    case 'suporte':
      return '<section><header class="page-header"><div><h2>Suporte</h2><p>Canal de atendimento e base de conhecimento.</p></div></header><div class="limit-box">Modulo preparado para evoluir tela a tela com regras do seu fluxo.</div></section>';
    default:
      return renderInicioPage(pageCtx);
  }
}

function renderSidebar() {
  return MENU_SECTIONS.map((section) => {
    const items = section.items
      .filter((item) => item.id !== 'gerenciamento-master' || Boolean(appState?.conta?.user?.isAdmin))
      .map((item) => {
        const activeClass = appState.ui.page === item.id ? 'active' : '';
        return `<button class="menu-item ${activeClass}" data-page="${item.id}">${item.label}</button>`;
      })
      .join('');

    return `
      <div class="menu-group">
        <p class="menu-title">${section.title}</p>
        <div class="menu-list">${items}</div>
      </div>
    `;
  }).join('');
}

function getCurrentPageLabel() {
  const menuLabel = MENU_SECTIONS.flatMap((section) => section.items).find((item) => item.id === appState.ui.page)?.label;
  return menuLabel || HIDDEN_PAGE_LABELS[appState.ui.page] || 'Painel';
}

function render() {
  const app = document.querySelector('#app');
  if (appState.ui.page === 'ativos') {
    carregarImpressoras().then(() => {
      app.innerHTML = `
        <div class="erp-layout">
          <aside class="sidebar">
            <div class="brand">
              <img src="/images/Logo.png" alt="Infinity Maker Logo" class="brand-logo" />
            </div>
            ${renderSidebar()}
          </aside>
          <main class="workspace">
            <header class="workspace-top">
              <div>
                <h3>${getCurrentPageLabel()}</h3>
                <p>Sistema completo de gestao 3D</p>
              </div>
              <button id="themeToggle" class="ghost-btn">Alternar tema</button>
            </header>
            <div class="workspace-body page-${appState.ui.page}">${renderPage()}</div>
          </main>
        </div>
      `;
      document.querySelectorAll('[data-page]').forEach((button) => {
        button.addEventListener('click', () => {
          setPage(button.dataset.page);
        });
      });
      const themeButton = document.querySelector('#themeToggle');
      if (themeButton) {
        themeButton.addEventListener('click', toggleTheme);
      }
      bindPageEvents();
    });
    return;
  }
  app.innerHTML = `
    <div class="erp-layout">
      <aside class="sidebar">
        <div class="brand">
          <img src="/images/Logo.png" alt="Infinity Maker Logo" class="brand-logo" />
        </div>
        ${renderSidebar()}
      </aside>
      <main class="workspace">
        <header class="workspace-top">
          <div>
            <h3>${getCurrentPageLabel()}</h3>
            <p>Sistema completo de gestao 3D</p>
          </div>
          <button id="themeToggle" class="ghost-btn">Alternar tema</button>
        </header>
        <div class="workspace-body page-${appState.ui.page}">${renderPage()}</div>
      </main>
    </div>
  `;

  document.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => {
      setPage(button.dataset.page);
    });
  });

  const themeButton = document.querySelector('#themeToggle');
  if (themeButton) {
    themeButton.addEventListener('click', toggleTheme);
  }

  bindPageEvents();
}

function bindPageEvents() {
  const persistOtherCatalog = async (nextCatalog) => {
    const response = await putJson('/outros-cadastros', nextCatalog);
    if (!response.ok) return null;
    const saved = await response.json();
    appState.outrosCadastros = saved;
    return saved;
  };

  // Filtro de ativos (ativos/inativos/todos)
  document.querySelectorAll('[data-ativos-filtro]').forEach((btn) => {
    btn.addEventListener('click', () => {
      appState.ui.ativosFiltro = btn.dataset.ativosFiltro;
      render();
    });
  });

  // Excluir equipamento
  document.querySelectorAll('.delete-btn[data-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (confirm('Deseja realmente excluir este equipamento?')) {
        await excluirImpressora(btn.dataset.id);
        await carregarImpressoras();
        render();
      }
    });
  });

    // Ativos: busca e modal de equipamento
    const ativosBusca = document.querySelector('#ativosBusca');
    if (ativosBusca) {
      ativosBusca.addEventListener('input', (event) => {
        appState.ui.ativosBusca = event.target.value;
        render();
      });
    }

    const btnNovoEquipamento = document.querySelector('#btnNovoEquipamento');
    if (btnNovoEquipamento) {
      btnNovoEquipamento.addEventListener('click', () => {
        abrirModalImpressora();
      });
    }

    document.querySelectorAll('.edit-btn[data-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        abrirModalImpressora(btn.dataset.id);
      });
    });

  // Modal de cadastro/edicao de equipamento
  function abrirModalImpressora(id) {
    const modal = document.getElementById('modalImpressora');
    if (!modal) return;
    const impressora =
      (appState.impressoras || []).find((i) => String(i._id || i.id) === String(id)) || {};

    const fecharModal = () => {
      modal.style.display = 'none';
      modal.innerHTML = '';
      modal.onclick = null;
    };

    modal.innerHTML = `
      <aside class="modal-content" role="dialog" aria-modal="true">
        <header class="modal-head">
          <h3>${id ? 'Editar' : 'Novo'} Equipamento</h3>
          <button type="button" id="fecharModalImpressoraX">×</button>
        </header>
        <form id="impressoraForm" class="impressora-form">
          <label>Marca</label>
          <input name="marca" required value="${impressora.marca || ''}" />
          <label>Modelo</label>
          <input name="modelo" required value="${impressora.modelo || ''}" />
          <label>Número de Série</label>
          <input name="numeroSerie" value="${impressora.numeroSerie || ''}" />
          <label>Valor de Compra</label>
          <input name="valorCompra" type="number" step="0.01" value="${impressora.valorCompra || ''}" />
          <label>Data de Compra</label>
          <input name="dataCompra" type="date" value="${impressora.dataCompra || ''}" />
          <label>Consumo medio (W)</label>
          <input name="consumoW" type="number" min="0" step="1" value="${Number(impressora.consumoW || 0)}" />
          <label>Status</label>
          <select name="ativo">
            <option value="true" ${impressora.ativo !== false ? 'selected' : ''}>Ativo</option>
            <option value="false" ${impressora.ativo === false ? 'selected' : ''}>Inativo</option>
          </select>
          <label>Foto</label>
          <input name="foto" type="file" accept="image/*" />
          <div class="modal-actions">
            <button type="submit" class="primary-btn">Salvar</button>
            <button type="button" id="fecharModalImpressora" class="ghost-btn">Cancelar</button>
          </div>
        </form>
      </aside>
    `;
    modal.style.display = 'flex';

    const btnFechar = document.getElementById('fecharModalImpressora');
    if (btnFechar) btnFechar.onclick = fecharModal;

    const btnFecharX = document.getElementById('fecharModalImpressoraX');
    if (btnFecharX) btnFecharX.onclick = fecharModal;

    modal.onclick = (event) => {
      if (event.target === modal) fecharModal();
    };

    const form = document.getElementById('impressoraForm');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        let fotoUrl = impressora.foto || '';
        const fotoFile = formData.get('foto');
        if (fotoFile && fotoFile.size > 0) {
          fotoUrl = await fileToDataUrl(fotoFile);
        }
        const novaImpressora = {
          ...(impressora._id ? { _id: impressora._id } : {}),
          marca: formData.get('marca'),
          modelo: formData.get('modelo'),
          numeroSerie: formData.get('numeroSerie'),
          valorCompra: formData.get('valorCompra'),
          dataCompra: formData.get('dataCompra'),
          consumoW: Number(formData.get('consumoW') || 0),
          foto: fotoUrl,
          ativo: formData.get('ativo') === 'true',
        };
        await salvarImpressora(novaImpressora);
        await carregarImpressoras();
        fecharModal();
        render();
      };
    }
    // Preview da foto
    const fotoInput = form.querySelector('input[name="foto"]');
    if (fotoInput) {
      fotoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (ev) {
            const preview = document.createElement('img');
            preview.src = ev.target.result;
            preview.style.maxWidth = '120px';
            preview.style.marginTop = '8px';
            fotoInput.parentNode.appendChild(preview);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  const buttonNovaVendaPrimary = document.querySelector('#btnNovaVendaPrimary');
  if (buttonNovaVendaPrimary) {
    buttonNovaVendaPrimary.addEventListener('click', () => {
      appState.ui.mostrarNovaVenda = !appState.ui.mostrarNovaVenda;
      render();
    });
  }

  const buttonNovaVendaEmpty = document.querySelector('#btnNovaVendaEmpty');
  if (buttonNovaVendaEmpty) {
    buttonNovaVendaEmpty.addEventListener('click', () => {
      appState.ui.mostrarNovaVenda = true;
      render();
    });
  }

  const vendasBusca = document.querySelector('#vendasBusca');
  if (vendasBusca) {
    vendasBusca.addEventListener('input', (event) => {
      appState.ui.vendasBusca = event.target.value;
      render();
    });
  }

  document.querySelectorAll('[data-venda-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      appState.ui.vendasFiltro = button.dataset.vendaFilter;
      render();
    });
  });

  document.querySelectorAll('[data-venda-id]').forEach((row) => {
    row.addEventListener('click', () => {
      appState.ui.vendaSelecionadaId = row.dataset.vendaId;
      render();
    });
  });

  const vendaForm = document.querySelector('#vendaForm');
  if (vendaForm) {
    vendaForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(vendaForm));
      const response = await postJson('/financeiro', {
        ...payload,
        tipo: 'entrada',
      });

      if (response.ok) {
        appState.ui.mostrarNovaVenda = false;
        appState.ui.vendasFiltro = 'todos';
        await bootstrap();
      }
    });
  }

  const clientForm = document.querySelector('#clientForm');
  if (clientForm) {
    clientForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(clientForm));

      const cepDigits = String(payload.cep || '').replace(/\D/g, '').slice(0, 8);
      payload.cep = cepDigits;
      payload.estado = String(payload.estado || '').trim().toUpperCase();

      const enderecoFormatado = [
        [payload.logradouro, payload.numero].filter(Boolean).join(', '),
        payload.complemento,
        payload.bairro,
        [payload.cidade, payload.estado].filter(Boolean).join('/'),
      ]
        .filter(Boolean)
        .join(' - ');
      payload.endereco = enderecoFormatado;

      payload.ativo = String(payload.ativo) !== 'false';
      const response = appState.ui.clienteEmEdicaoId
        ? await putJson(`/clientes/${appState.ui.clienteEmEdicaoId}`, payload)
        : await postJson('/clientes', payload);
      if (response.ok) {
        appState.ui.mostrarNovoCliente = false;
        appState.ui.clienteEmEdicaoId = null;
        await bootstrap();
      }
    });

    const cepInput = document.querySelector('#clientCep');
    const logradouroInput = document.querySelector('#clientLogradouro');
    const bairroInput = document.querySelector('#clientBairro');
    const cidadeInput = document.querySelector('#clientCidade');
    const estadoInput = document.querySelector('#clientEstado');
    const buscarCepButton = document.querySelector('#btnBuscarCep');

    const fetchCepData = async (cepDigits) => {
      const responseViaCep = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      if (responseViaCep.ok) {
        const viaCep = await responseViaCep.json();
        if (!viaCep.erro) {
          return {
            logradouro: viaCep.logradouro || '',
            bairro: viaCep.bairro || '',
            cidade: viaCep.localidade || '',
            estado: viaCep.uf || '',
          };
        }
      }

      const responseBrasilApi = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepDigits}`);
      if (!responseBrasilApi.ok) return null;
      const brasilApi = await responseBrasilApi.json();
      return {
        logradouro: brasilApi.street || '',
        bairro: brasilApi.neighborhood || '',
        cidade: brasilApi.city || '',
        estado: brasilApi.state || '',
      };
    };

    const preencherEnderecoPorCep = async () => {
      if (!cepInput) return;
      const cepDigits = cepInput.value.replace(/\D/g, '').slice(0, 8);
      if (cepDigits.length !== 8) return;

      try {
        const data = await fetchCepData(cepDigits);
        if (!data) return;

        if (logradouroInput) logradouroInput.value = data.logradouro;
        if (bairroInput) bairroInput.value = data.bairro;
        if (cidadeInput) cidadeInput.value = data.cidade;
        if (estadoInput) estadoInput.value = data.estado;
      } catch {
        // Falha silenciosa para nao interromper o preenchimento manual.
      }
    };

    if (cepInput) {
      cepInput.addEventListener('input', () => {
        const digits = cepInput.value.replace(/\D/g, '').slice(0, 8);
        cepInput.value = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
        if (digits.length === 8) {
          preencherEnderecoPorCep();
        }
      });

      cepInput.addEventListener('blur', () => {
        preencherEnderecoPorCep();
      });
    }

    if (buscarCepButton) {
      buscarCepButton.addEventListener('click', () => {
        preencherEnderecoPorCep();
      });
    }
  }

  const buttonNovoCliente = document.querySelector('#btnNovoCliente');
  if (buttonNovoCliente) {
    buttonNovoCliente.addEventListener('click', () => {
      appState.ui.clienteEmEdicaoId = null;
      appState.ui.mostrarNovoCliente = true;
      render();
    });
  }

  const buttonNovoClienteEmpty = document.querySelector('#btnNovoClienteEmpty');
  if (buttonNovoClienteEmpty) {
    buttonNovoClienteEmpty.addEventListener('click', () => {
      appState.ui.clienteEmEdicaoId = null;
      appState.ui.mostrarNovoCliente = true;
      render();
    });
  }

  const buttonCloseClienteModal = document.querySelector('#btnCloseClienteModal');
  if (buttonCloseClienteModal) {
    buttonCloseClienteModal.addEventListener('click', () => {
      fecharModalCliente();
    });
  }

  const clienteModalBackdrop = document.querySelector('#clienteModalBackdrop');
  if (clienteModalBackdrop) {
    clienteModalBackdrop.addEventListener('click', (event) => {
      if (event.target.id === 'clienteModalBackdrop') {
        fecharModalCliente();
      }
    });
  }

  const cancelClientEdit = document.querySelector('#cancelClientEdit');
  if (cancelClientEdit) {
    cancelClientEdit.addEventListener('click', () => {
      fecharModalCliente();
    });
  }

  const clientesBusca = document.querySelector('#clientesBusca');
  if (clientesBusca) {
    clientesBusca.addEventListener('input', (event) => {
      appState.ui.clientesBusca = event.target.value;
      render();
    });
  }

  const buttonFiltroClientesAtivos = document.querySelector('#btnFiltroClientesAtivos');
  if (buttonFiltroClientesAtivos) {
    buttonFiltroClientesAtivos.addEventListener('click', () => {
      appState.ui.clientesSomenteAtivos = !appState.ui.clientesSomenteAtivos;
      render();
    });
  }

  document.querySelectorAll('[data-edit-client]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      abrirEditarCliente(button.dataset.editClient);
    });
  });

  document.querySelectorAll('[data-delete-client]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      excluirCliente(button.dataset.deleteClient);
    });
  });

  const renumberQuoteItems = (form) => {
    const blocks = Array.from(form.querySelectorAll('[data-quote-item]'));
    blocks.forEach((block, index) => {
      block.dataset.quoteItemIndex = String(index);
      const title = block.querySelector('.orcamento-item-head strong');
      if (title) title.textContent = `Item ${index + 1}`;
      block.querySelectorAll('[data-quote-item-field]').forEach((field) => {
        field.name = `quoteItem${field.dataset.quoteItemField}_${index}`;
      });
      const removeButton = block.querySelector('[data-remove-quote-item]');
      if (removeButton) removeButton.disabled = blocks.length === 1;
    });
  };

  const resetQuoteItemBlock = (block) => {
    block.querySelectorAll('[data-quote-item-field]').forEach((field) => {
      const key = field.dataset.quoteItemField;
      if (field.tagName === 'SELECT') {
        field.value = '';
        return;
      }
      if (key === 'quantidade') {
        field.value = '1';
        return;
      }
      if (key === 'material') {
        field.value = 'PLA';
        return;
      }
      field.value = key === 'valor' || key === 'pesoEstimado' || key === 'tempoImpressao' ? '0' : '';
    });
  };

  const collectQuoteItemsFromForm = (form) => {
    return Array.from(form.querySelectorAll('[data-quote-item]'))
      .map((block) => ({
        produto: block.querySelector('[data-quote-item-field="produto"]')?.value || '',
        quantidade: Number(block.querySelector('[data-quote-item-field="quantidade"]')?.value || 1),
        impressora: block.querySelector('[data-quote-item-field="impressora"]')?.value || '',
        material: block.querySelector('[data-quote-item-field="material"]')?.value || 'PLA',
        pesoEstimado: Number(block.querySelector('[data-quote-item-field="pesoEstimado"]')?.value || 0),
        tempoImpressao: Number(block.querySelector('[data-quote-item-field="tempoImpressao"]')?.value || 0),
        valor: Number(block.querySelector('[data-quote-item-field="valor"]')?.value || 0),
      }))
      .filter((item) => item.produto);
  };

  const bindQuoteItemsForm = (form) => {
    if (!form || form.dataset.quoteItemsBound === 'true') return;
    form.dataset.quoteItemsBound = 'true';

    renumberQuoteItems(form);

    form.addEventListener('click', (event) => {
      const addButton = event.target.closest('[data-add-quote-item]');
      if (addButton) {
        const list = form.querySelector('[data-quote-items-list]');
        const template = list?.querySelector('[data-quote-item]');
        if (!list || !template) return;
        const clone = template.cloneNode(true);
        resetQuoteItemBlock(clone);
        list.appendChild(clone);
        renumberQuoteItems(form);
        return;
      }

      const removeButton = event.target.closest('[data-remove-quote-item]');
      if (removeButton) {
        const blocks = form.querySelectorAll('[data-quote-item]');
        if (blocks.length <= 1) return;
        removeButton.closest('[data-quote-item]')?.remove();
        renumberQuoteItems(form);
      }
    });
  };

  const orcamentoForm = document.querySelector('#orcamentoForm');
  if (orcamentoForm) {
    bindQuoteItemsForm(orcamentoForm);
    orcamentoForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(orcamentoForm);
      const payload = {
        cliente: formData.get('cliente'),
        dataEntregaPrevista: formData.get('dataEntregaPrevista') || '',
        status: formData.get('status') || 'orcamento',
        observacoes: formData.get('observacoes') || '',
        itens: collectQuoteItemsFromForm(orcamentoForm),
      };
      const fotoPedidoArquivo = formData.get('fotoPedidoArquivo');

      if (fotoPedidoArquivo && fotoPedidoArquivo.size > 0) {
        payload.fotoPedidoNome = fotoPedidoArquivo.name;
        payload.fotoPedido = await fileToDataUrl(fotoPedidoArquivo);
      }
      if (!payload.dataEntregaPrevista) {
        delete payload.dataEntregaPrevista;
      }

      const response = appState.ui.orcamentoEmEdicaoId
        ? await putJson(`/orcamentos/${appState.ui.orcamentoEmEdicaoId}`, payload)
        : await postJson('/orcamentos', payload);

      if (response.ok) {
        fecharModalOrcamento();
        await bootstrap();
      }
    });
  }

  const buttonNovoOrcamento = document.querySelector('#btnNovoOrcamento');
  if (buttonNovoOrcamento) {
    buttonNovoOrcamento.addEventListener('click', () => {
      appState.ui.orcamentoEmEdicaoId = null;
      appState.ui.mostrarNovoOrcamento = true;
      render();
    });
  }

  const buttonNovoOrcamentoEmpty = document.querySelector('#btnNovoOrcamentoEmpty');
  if (buttonNovoOrcamentoEmpty) {
    buttonNovoOrcamentoEmpty.addEventListener('click', () => {
      appState.ui.orcamentoEmEdicaoId = null;
      appState.ui.mostrarNovoOrcamento = true;
      render();
    });
  }

  const buttonCloseOrcamentoModal = document.querySelector('#btnCloseOrcamentoModal');
  if (buttonCloseOrcamentoModal) {
    buttonCloseOrcamentoModal.addEventListener('click', () => {
      fecharModalOrcamento();
    });
  }

  const orcamentoModalBackdrop = document.querySelector('#orcamentoModalBackdrop');
  if (orcamentoModalBackdrop) {
    orcamentoModalBackdrop.addEventListener('click', (event) => {
      if (event.target.id === 'orcamentoModalBackdrop') {
        fecharModalOrcamento();
      }
    });
  }

  const cancelOrcamentoEdit = document.querySelector('#cancelOrcamentoEdit');
  if (cancelOrcamentoEdit) {
    cancelOrcamentoEdit.addEventListener('click', () => {
      fecharModalOrcamento();
    });
  }

  const orcamentosBusca = document.querySelector('#orcamentosBusca');
  if (orcamentosBusca) {
    orcamentosBusca.addEventListener('input', (event) => {
      appState.ui.orcamentosBusca = event.target.value;
      render();
    });
  }

  document.querySelectorAll('[data-filter-orcamento]').forEach((button) => {
    button.addEventListener('click', () => {
      appState.ui.orcamentosFiltro = button.dataset.filterOrcamento;
      render();
    });
  });

  document.querySelectorAll('[data-edit-orcamento]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      abrirEditarOrcamento(button.dataset.editOrcamento);
    });
  });

  document.querySelectorAll('[data-delete-orcamento]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      excluirOrcamento(button.dataset.deleteOrcamento);
    });
  });

  document.querySelectorAll('[data-approve-orcamento]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      aprovarOrcamento(button.dataset.approveOrcamento);
    });
  });

  document.querySelectorAll('[data-print-orcamento]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      imprimirOrcamento(button.dataset.printOrcamento);
    });
  });

  const productForm = document.querySelector('#productForm');
  if (productForm) {
    productForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(productForm);
      const payload = Object.fromEntries(formData);
      const imagemArquivo = formData.get('imagemProduto');
      const fotoAtual = payload.fotoAtual;

      delete payload.imagemProduto;
      delete payload.fotoAtual;

      if (imagemArquivo && imagemArquivo.size > 0) {
        const dataUrl = await fileToDataUrl(imagemArquivo);
        payload.fotos = [dataUrl];
      } else if (fotoAtual) {
        payload.fotos = [fotoAtual];
      }

      const response = appState.ui.produtoEmEdicaoId
        ? await putJson(`/produtos/${appState.ui.produtoEmEdicaoId}`, payload)
        : await postJson('/produtos', payload);

      if (response.ok) {
        appState.ui.mostrarNovoProduto = false;
        appState.ui.produtoEmEdicaoId = null;
        await bootstrap();
      }
    });
  }

  const buttonNovoProduto = document.querySelector('#btnNovoProduto');
  if (buttonNovoProduto) {
    buttonNovoProduto.addEventListener('click', () => {
      appState.ui.produtoEmEdicaoId = null;
      appState.ui.mostrarNovoProduto = true;
      render();
    });
  }

  const buttonNovoProdutoEmpty = document.querySelector('#btnNovoProdutoEmpty');
  if (buttonNovoProdutoEmpty) {
    buttonNovoProdutoEmpty.addEventListener('click', () => {
      appState.ui.produtoEmEdicaoId = null;
      appState.ui.mostrarNovoProduto = true;
      render();
    });
  }

  const buttonCloseProdutoModal = document.querySelector('#btnCloseProdutoModal');
  if (buttonCloseProdutoModal) {
    buttonCloseProdutoModal.addEventListener('click', () => {
      fecharModalProduto();
    });
  }

  const produtoModalBackdrop = document.querySelector('#produtoModalBackdrop');
  if (produtoModalBackdrop) {
    produtoModalBackdrop.addEventListener('click', (event) => {
      if (event.target.id === 'produtoModalBackdrop') {
        fecharModalProduto();
      }
    });
  }

  document.querySelectorAll('[data-edit-product]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      abrirEditarProduto(button.dataset.editProduct);
    });
  });

  document.querySelectorAll('[data-delete-product]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      excluirProduto(button.dataset.deleteProduct);
    });
  });

  document.querySelectorAll('[data-view-product-image]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const product = appState.produtos.find((item) => item._id === button.dataset.viewProductImage);
      if (product?.fotos?.[0]) {
        appState.ui.produtoImagemVisualizando = product.fotos[0];
        render();
      }
    });
  });

  const buttonOpenCurrentImage = document.querySelector('[data-open-current-image]');
  if (buttonOpenCurrentImage) {
    buttonOpenCurrentImage.addEventListener('click', () => {
      const product = appState.produtos.find((item) => item._id === appState.ui.produtoEmEdicaoId);
      if (product?.fotos?.[0]) {
        appState.ui.produtoImagemVisualizando = product.fotos[0];
        render();
      }
    });
  }

  const produtoViewBackdrop = document.querySelector('#produtoViewBackdrop');
  if (produtoViewBackdrop) {
    produtoViewBackdrop.addEventListener('click', (event) => {
      if (event.target.id === 'produtoViewBackdrop') {
        appState.ui.produtoImagemVisualizando = null;
        render();
      }
    });
  }

  const buttonCloseProdutoView = document.querySelector('#btnCloseProdutoView');
  if (buttonCloseProdutoView) {
    buttonCloseProdutoView.addEventListener('click', () => {
      appState.ui.produtoImagemVisualizando = null;
      render();
    });
  }

  const produtosBusca = document.querySelector('#produtosBusca');
  if (produtosBusca) {
    produtosBusca.addEventListener('input', (event) => {
      appState.ui.produtosBusca = event.target.value;
      render();
    });
  }

  const produtosCategoria = document.querySelector('#produtosCategoria');
  if (produtosCategoria) {
    produtosCategoria.addEventListener('change', (event) => {
      appState.ui.produtosCategoria = event.target.value;
      render();
    });
  }

  const buttonFiltroEstoque = document.querySelector('#btnFiltroEstoqueBaixo');
  if (buttonFiltroEstoque) {
    buttonFiltroEstoque.addEventListener('click', () => {
      appState.ui.produtosSomenteEstoqueBaixo = !appState.ui.produtosSomenteEstoqueBaixo;
      render();
    });
  }

  const filamentForm = document.querySelector('#filamentForm');
  if (filamentForm) {
    filamentForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(filamentForm));
      const response = appState.ui.filamentoEmEdicaoId
        ? await putJson(`/materiais/${appState.ui.filamentoEmEdicaoId}`, payload)
        : await postJson('/materiais', payload);
      if (response.ok) {
        appState.ui.mostrarNovoFilamento = false;
        appState.ui.filamentoEmEdicaoId = null;
        await bootstrap();
      }
    });
  }

  const buttonNovoFilamento = document.querySelector('#btnNovoFilamento');
  if (buttonNovoFilamento) {
    buttonNovoFilamento.addEventListener('click', () => {
      appState.ui.filamentoEmEdicaoId = null;
      appState.ui.mostrarNovoFilamento = true;
      render();
    });
  }

  const buttonNovoFilamentoEmpty = document.querySelector('#btnNovoFilamentoEmpty');
  if (buttonNovoFilamentoEmpty) {
    buttonNovoFilamentoEmpty.addEventListener('click', () => {
      appState.ui.filamentoEmEdicaoId = null;
      appState.ui.mostrarNovoFilamento = true;
      render();
    });
  }

  const buttonCloseFilamentoModal = document.querySelector('#btnCloseFilamentoModal');
  if (buttonCloseFilamentoModal) {
    buttonCloseFilamentoModal.addEventListener('click', () => {
      fecharModalFilamento();
    });
  }

  const filamentoModalBackdrop = document.querySelector('#filamentoModalBackdrop');
  if (filamentoModalBackdrop) {
    filamentoModalBackdrop.addEventListener('click', (event) => {
      if (event.target.id === 'filamentoModalBackdrop') {
        fecharModalFilamento();
      }
    });
  }

  const cancelFilamentEdit = document.querySelector('#cancelFilamentEdit');
  if (cancelFilamentEdit) {
    cancelFilamentEdit.addEventListener('click', () => {
      fecharModalFilamento();
    });
  }

  const materiaisBusca = document.querySelector('#materiaisBusca');
  if (materiaisBusca) {
    materiaisBusca.addEventListener('input', (event) => {
      appState.ui.materiaisBusca = event.target.value;
      render();
    });
  }

  const buttonFiltroEstoqueMateriais = document.querySelector('#btnFiltroEstoqueMateriais');
  if (buttonFiltroEstoqueMateriais) {
    buttonFiltroEstoqueMateriais.addEventListener('click', () => {
      appState.ui.materiaisSomenteEstoqueBaixo = !appState.ui.materiaisSomenteEstoqueBaixo;
      render();
    });
  }

    const compraForm = document.querySelector('#compraForm');
    if (compraForm) {
      compraForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(compraForm));

        const quantidade = Number(payload.quantidade || 0);
        const valorUnitario = Number(payload.valorUnitario || 0);
        payload.quantidade = quantidade;
        payload.valorUnitario = valorUnitario;
        payload.valor = Number(payload.valor || quantidade * valorUnitario || 0);
        payload.tipo = 'saida';

        const response = appState.ui.compraEmEdicaoId
          ? await putJson(`/financeiro/${appState.ui.compraEmEdicaoId}`, payload)
          : await postJson('/financeiro', payload);

        if (response.ok) {
          appState.ui.mostrarNovaCompra = false;
          appState.ui.compraEmEdicaoId = null;
          await bootstrap();
        }
      });
    }

    const buttonNovaCompra = document.querySelector('#btnNovaCompra');
    if (buttonNovaCompra) {
      buttonNovaCompra.addEventListener('click', () => {
        appState.ui.compraEmEdicaoId = null;
        appState.ui.mostrarNovaCompra = true;
        render();
      });
    }

    const buttonNovaCompraEmpty = document.querySelector('#btnNovaCompraEmpty');
    if (buttonNovaCompraEmpty) {
      buttonNovaCompraEmpty.addEventListener('click', () => {
        appState.ui.compraEmEdicaoId = null;
        appState.ui.mostrarNovaCompra = true;
        render();
      });
    }

    const buttonCloseCompraModal = document.querySelector('#btnCloseCompraModal');
    if (buttonCloseCompraModal) {
      buttonCloseCompraModal.addEventListener('click', () => {
        fecharModalCompra();
      });
    }

    const compraModalBackdrop = document.querySelector('#compraModalBackdrop');
    if (compraModalBackdrop) {
      compraModalBackdrop.addEventListener('click', (event) => {
        if (event.target.id === 'compraModalBackdrop') {
          fecharModalCompra();
        }
      });
    }

    const comprasBusca = document.querySelector('#comprasBusca');
    if (comprasBusca) {
      comprasBusca.addEventListener('input', (event) => {
        appState.ui.comprasBusca = event.target.value;
        render();
      });
    }

    const buttonFiltroComprasMesAtual = document.querySelector('#btnFiltroComprasMesAtual');
    if (buttonFiltroComprasMesAtual) {
      buttonFiltroComprasMesAtual.addEventListener('click', () => {
        appState.ui.comprasSomenteMesAtual = !appState.ui.comprasSomenteMesAtual;
        render();
      });
    }

    const cancelCompraEdit = document.querySelector('#cancelCompraEdit');
    if (cancelCompraEdit) {
      cancelCompraEdit.addEventListener('click', () => {
        fecharModalCompra();
      });
    }

    document.querySelectorAll('[data-edit-compra]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        abrirEditarCompra(button.dataset.editCompra);
      });
    });

    document.querySelectorAll('[data-delete-compra]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        excluirCompra(button.dataset.deleteCompra);
      });
    });

  document.querySelectorAll('[data-edit-filament]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      abrirEditarFilamento(button.dataset.editFilament);
    });
  });

  document.querySelectorAll('[data-delete-filament]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      excluirFilamento(button.dataset.deleteFilament);
    });
  });

  const printerForm = document.querySelector('#printerForm');
  if (printerForm) {
    printerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(printerForm));
      const response = await postJson('/equipamentos', payload);
      if (response.ok) await bootstrap();
    });
  }

  const buttonNovoPedido = document.querySelector('#btnNovoPedido');
  if (buttonNovoPedido) {
    buttonNovoPedido.addEventListener('click', () => {
      appState.ui.pedidoEmEdicaoId = null;
      appState.ui.mostrarEditarPedido = false;
      appState.ui.mostrarNovoPedido = true;
      render();
    });
  }

  const buttonClosePedidoModal = document.querySelector('#btnClosePedidoModal');
  if (buttonClosePedidoModal) {
    buttonClosePedidoModal.addEventListener('click', () => {
      appState.ui.mostrarNovoPedido = false;
      appState.ui.mostrarEditarPedido = false;
      appState.ui.pedidoEmEdicaoId = null;
      render();
    });
  }

  const pedidoModalBackdrop = document.querySelector('#pedidoModalBackdrop');
  if (pedidoModalBackdrop) {
    pedidoModalBackdrop.addEventListener('click', (event) => {
      if (event.target.id === 'pedidoModalBackdrop') {
        appState.ui.mostrarNovoPedido = false;
        appState.ui.mostrarEditarPedido = false;
        appState.ui.pedidoEmEdicaoId = null;
        render();
      }
    });
  }

  const searchPedidos = document.querySelector('#pedidosBusca');
  if (searchPedidos) {
    searchPedidos.addEventListener('input', (event) => {
      appState.ui.pedidosBusca = event.target.value;
      render();
    });
  }

  document.querySelectorAll('[data-pedidos-data-filtro]').forEach((button) => {
    button.addEventListener('click', () => {
      appState.ui.pedidosDataFiltro = button.dataset.pedidosDataFiltro;
      render();
    });
  });

  const pedidosDataInicio = document.querySelector('#pedidosDataInicio');
  if (pedidosDataInicio) {
    pedidosDataInicio.addEventListener('input', (event) => {
      appState.ui.pedidosDataInicio = event.target.value;
      render();
    });
  }

  const pedidosDataFim = document.querySelector('#pedidosDataFim');
  if (pedidosDataFim) {
    pedidosDataFim.addEventListener('input', (event) => {
      appState.ui.pedidosDataFim = event.target.value;
      render();
    });
  }

  document.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      appState.ui.pedidosFiltro = button.dataset.filter;
      render();
    });
  });

  const getMaterialCostPerKg = (materialName) => {
    const selectedName = String(materialName || '').trim().toLowerCase();
    if (!selectedName) return 120;

    const material = (appState.materiais || []).find((item) => {
      const nome = String(item.descricao || item.tipo || item.material || '').trim().toLowerCase();
      return nome === selectedName;
    });

    const preco = Number(material?.precoPorKg ?? material?.precoCusto ?? 120);
    return Number.isFinite(preco) && preco > 0 ? preco : 120;
  };

  const calculateOrderCostsFromForm = (form) => {
    const itemBlocks = Array.from(form.querySelectorAll('[data-order-item]'));
    const itemStates = itemBlocks.map((block) => {
      const getField = (field) => block.querySelector(`[data-order-item-field="${field}"]`);
      const pesoEstimado = Number(getField('pesoEstimado')?.value || 0);
      const tempoImpressao = Number(getField('tempoImpressao')?.value || 0);
      const valorField = getField('valor');
      const margemField = getField('margemLucro');
      const materialName = getField('material')?.value || '';
      const impressoraId = getField('impressora')?.value || '';
      const filamentoKg = getMaterialCostPerKg(materialName);
      const impressoraSelecionada = (appState.impressoras || []).find((item) => String(item._id || item.id || '') === String(impressoraId));
      const consumoW = Number(impressoraSelecionada?.consumoW || 0);
      const energiaKwh = consumoW > 0 ? consumoW / 1000 : 0.8;
      const custoKwh = 0.95;
      const custoDesgasteHora = 0.5;
      const custoFilamento = (pesoEstimado / 1000) * filamentoKg;
      const horas = tempoImpressao / 60;
      const custoEnergia = horas * energiaKwh * custoKwh;
      const custoDesgaste = horas * custoDesgasteHora;
      const custoTotal = custoFilamento + custoEnergia + custoDesgaste;
      const rawValor = String(valorField?.value || '').trim();
      const rawMargem = String(margemField?.value || '').trim();
      const sourceField = block.dataset.orderCalcSource === 'margem' ? 'margem' : 'valor';

      let valorFinal = Number(rawValor || 0);
      if (sourceField === 'margem' && rawMargem) {
        valorFinal = custoTotal * (1 + Number(rawMargem || 0) / 100);
        if (valorField) {
          valorField.value = valorFinal > 0 ? valorFinal.toFixed(2) : '';
        }
      }

      const lucroReal = valorFinal - custoTotal;
      const margemCalculada = custoTotal > 0 ? (lucroReal / custoTotal) * 100 : 0;

      if (margemField && sourceField !== 'margem') {
        margemField.value = rawValor ? margemCalculada.toFixed(2) : '';
      }

      const custos = {
        filamentoKg: Number(filamentoKg.toFixed(2)),
        custoFilamento: Number(custoFilamento.toFixed(2)),
        energiaKwh,
        custoKwh,
        custoEnergia: Number(custoEnergia.toFixed(2)),
        custoDesgasteHora,
        custoDesgaste: Number(custoDesgaste.toFixed(2)),
        custoTotal: Number(custoTotal.toFixed(2)),
        lucroReal: Number(lucroReal.toFixed(2)),
      };

      const lucroInput = block.querySelector('[data-order-item-lucro]');
      if (lucroInput) {
        const hasValues = pesoEstimado > 0 || tempoImpressao > 0 || valorFinal > 0;
        lucroInput.value = hasValues ? money(custos.lucroReal) : '-';
      }

      return {
        item: {
          produto: getField('produto')?.value || '',
          quantidade: Number(getField('quantidade')?.value || 1),
          impressora: impressoraId,
          material: materialName,
          pesoEstimado,
          tempoImpressao,
          valor: Number(valorField?.value || 0),
          custos,
        },
        consumoW,
        consumoPeriodoKwh: Number((horas * energiaKwh).toFixed(3)),
      };
    });

    const custos = itemStates.reduce(
      (acc, state) => {
        acc.filamentoKg += Number(state.item.custos.filamentoKg || 0);
        acc.custoFilamento += Number(state.item.custos.custoFilamento || 0);
        acc.custoEnergia += Number(state.item.custos.custoEnergia || 0);
        acc.custoDesgaste += Number(state.item.custos.custoDesgaste || 0);
        acc.custoTotal += Number(state.item.custos.custoTotal || 0);
        acc.lucroReal += Number(state.item.custos.lucroReal || 0);
        acc.energiaKwh += Number(state.item.custos.energiaKwh || 0);
        acc.custoKwh += Number(state.item.custos.custoKwh || 0);
        acc.custoDesgasteHora += Number(state.item.custos.custoDesgasteHora || 0);
        acc.consumoW += Number(state.consumoW || 0);
        acc.consumoPeriodoKwh += Number(state.consumoPeriodoKwh || 0);
        return acc;
      },
      {
        filamentoKg: 0,
        custoFilamento: 0,
        energiaKwh: 0,
        custoKwh: 0,
        custoEnergia: 0,
        custoDesgasteHora: 0,
        custoDesgaste: 0,
        custoTotal: 0,
        lucroReal: 0,
        consumoW: 0,
        consumoPeriodoKwh: 0,
      }
    );

    const itemsCount = itemStates.length || 1;
    const summaryValues = {
      filamentoKg: money(custos.filamentoKg),
      custoFilamento: money(custos.custoFilamento),
      consumoW: `${number(custos.consumoW || custos.energiaKwh * 1000)} W`,
      custoKwh: money(itemsCount ? custos.custoKwh / itemsCount : 0.95),
      consumoPeriodoKwh: `${number(Number(custos.consumoPeriodoKwh.toFixed(3)))} kWh`,
      custoEnergia: money(custos.custoEnergia),
      custoTotal: money(custos.custoTotal),
    };

    Object.entries(summaryValues).forEach(([key, value]) => {
      const target = form.querySelector(`[data-order-summary="${key}"]`);
      if (target) {
        target.textContent = value;
      }
    });

    return {
      items: itemStates.map((state) => state.item).filter((item) => item.produto),
      custos: {
        filamentoKg: Number(custos.filamentoKg.toFixed(2)),
        custoFilamento: Number(custos.custoFilamento.toFixed(2)),
        energiaKwh: Number(custos.energiaKwh.toFixed(3)),
        custoKwh: Number((itemsCount ? custos.custoKwh / itemsCount : 0.95).toFixed(2)),
        custoEnergia: Number(custos.custoEnergia.toFixed(2)),
        custoDesgasteHora: Number((itemsCount ? custos.custoDesgasteHora / itemsCount : 0.5).toFixed(2)),
        custoDesgaste: Number(custos.custoDesgaste.toFixed(2)),
        custoTotal: Number(custos.custoTotal.toFixed(2)),
        lucroReal: Number(custos.lucroReal.toFixed(2)),
      },
    };
  };

  const renumberOrderItems = (form) => {
    const blocks = Array.from(form.querySelectorAll('[data-order-item]'));
    blocks.forEach((block, index) => {
      block.dataset.orderItemIndex = String(index);
      const title = block.querySelector('.pedido-item-head strong');
      if (title) title.textContent = `Item ${index + 1}`;
      block.querySelectorAll('[data-order-item-field]').forEach((field) => {
        field.name = `orderItem${field.dataset.orderItemField}_${index}`;
      });
      const removeButton = block.querySelector('[data-remove-order-item]');
      if (removeButton) removeButton.disabled = blocks.length === 1;
    });
  };

  const resetOrderItemBlock = (block) => {
    block.dataset.orderCalcSource = 'valor';
    block.querySelectorAll('[data-order-item-field]').forEach((field) => {
      const key = field.dataset.orderItemField;
      if (field.tagName === 'SELECT') {
        field.value = '';
        return;
      }
      if (key === 'quantidade') {
        field.value = '1';
        return;
      }
      field.value = key === 'valor' || key === 'pesoEstimado' || key === 'tempoImpressao' ? '0' : '';
    });

    const lucroInput = block.querySelector('[data-order-item-lucro]');
    if (lucroInput) {
      lucroInput.value = '-';
    }
  };

  const bindSmartProfitCalculator = (form) => {
    if (!form || form.dataset.orderItemsBound === 'true') return;
    form.dataset.orderItemsBound = 'true';

    const recalculate = () => {
      calculateOrderCostsFromForm(form);
    };

    renumberOrderItems(form);

    form.addEventListener('input', (event) => {
      const field = event.target.closest('[data-order-item-field]');
      if (!field) return;
      const block = field.closest('[data-order-item]');
      if (!block) return;
      block.dataset.orderCalcSource = field.dataset.orderItemField === 'margemLucro' ? 'margem' : 'valor';
      recalculate();
    });

    form.addEventListener('change', (event) => {
      const field = event.target.closest('[data-order-item-field]');
      if (!field) return;
      const block = field.closest('[data-order-item]');
      if (!block) return;
      if (field.dataset.orderItemField === 'margemLucro') {
        block.dataset.orderCalcSource = 'margem';
      }
      recalculate();
    });

    form.addEventListener('click', (event) => {
      const addButton = event.target.closest('[data-add-order-item]');
      if (addButton) {
        const list = form.querySelector('[data-order-items-list]');
        const template = list?.querySelector('[data-order-item]');
        if (!list || !template) return;
        const clone = template.cloneNode(true);
        resetOrderItemBlock(clone);
        list.appendChild(clone);
        renumberOrderItems(form);
        recalculate();
        return;
      }

      const removeButton = event.target.closest('[data-remove-order-item]');
      if (removeButton) {
        const blocks = form.querySelectorAll('[data-order-item]');
        if (blocks.length <= 1) return;
        removeButton.closest('[data-order-item]')?.remove();
        renumberOrderItems(form);
        recalculate();
      }
    });

    recalculate();
  };

  const orderForm = document.querySelector('#orderForm');
  if (orderForm) {
    bindSmartProfitCalculator(orderForm);
    orderForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(orderForm);
      const orderState = calculateOrderCostsFromForm(orderForm);
      const payload = {
        cliente: formData.get('cliente'),
        itens: orderState.items,
        custos: orderState.custos,
      };
      const stlArquivo = formData.get('stlArquivo');
      const fotoPedidoArquivos = formData
        .getAll('fotoPedidoArquivos')
        .filter((file) => file instanceof File && file.size > 0)
        .slice(0, 5);

      if (stlArquivo && stlArquivo.size > 0) {
        payload.stlNome = stlArquivo.name;
        payload.stl = stlArquivo.name;
        payload.stlArquivo = await fileToDataUrl(stlArquivo);
      }

      if (fotoPedidoArquivos.length) {
        payload.fotosPedidoNomes = fotoPedidoArquivos.map((file) => file.name);
        payload.fotosPedido = await filesToDataUrls(fotoPedidoArquivos);
      }

      // Pedidos criados nesta tela devem entrar no kanban em "Recebido".
      payload.status = 'aprovado';
      payload.lane = 'recebido';

      const response = await postJson('/pedidos', payload);
      if (response.ok) {
        appState.ui.mostrarNovoPedido = false;
        await bootstrap();
      }
    });
  }

  const editOrderForm = document.querySelector('#editOrderForm');
  if (editOrderForm) {
    bindSmartProfitCalculator(editOrderForm);
    editOrderForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(editOrderForm);
      const orderState = calculateOrderCostsFromForm(editOrderForm);
      const payload = {
        cliente: formData.get('cliente'),
        itens: orderState.items,
        custos: orderState.custos,
      };
      const stlArquivo = formData.get('stlArquivo');
      const fotoPedidoArquivos = formData
        .getAll('fotoPedidoArquivos')
        .filter((file) => file instanceof File && file.size > 0)
        .slice(0, 5);

      if (stlArquivo && stlArquivo.size > 0) {
        payload.stlNome = stlArquivo.name;
        payload.stl = stlArquivo.name;
        payload.stlArquivo = await fileToDataUrl(stlArquivo);
      }

      if (fotoPedidoArquivos.length) {
        payload.fotosPedidoNomes = fotoPedidoArquivos.map((file) => file.name);
        payload.fotosPedido = await filesToDataUrls(fotoPedidoArquivos);
      }

      const response = await putJson(`/pedidos/${appState.ui.pedidoEmEdicaoId}`, payload);
      if (response.ok) {
        fecharEditarPedido();
        await bootstrap();
      }
    });
  }

  const cancelEditBtn = document.querySelector('#cancelEditBtn');
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      appState.ui.mostrarNovoPedido = false;
      fecharEditarPedido();
    });
  }

  document.querySelectorAll('[data-drag-order-id]').forEach((card) => {
    card.addEventListener('dragstart', (event) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', card.dataset.dragOrderId);
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.kanban-col.drag-over').forEach((lane) => lane.classList.remove('drag-over'));
    });
  });

  document.querySelectorAll('[data-drop-lane]').forEach((column) => {
    column.addEventListener('dragover', (event) => {
      event.preventDefault();
      column.classList.add('drag-over');
    });

    column.addEventListener('dragleave', () => {
      column.classList.remove('drag-over');
    });

    column.addEventListener('drop', async (event) => {
      event.preventDefault();
      column.classList.remove('drag-over');
      const orderId = event.dataTransfer.getData('text/plain');
      if (!orderId) return;
      await moverPedido(orderId, column.dataset.dropLane);
    });
  });

  document.querySelectorAll('[data-edit-order]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      abrirEditarPedido(button.dataset.editOrder);
    });
  });

  document.querySelectorAll('[data-print-order]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      imprimirPedido(button.dataset.printOrder);
    });
  });

  document.querySelectorAll('[data-delete-order]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      excluirPedido(button.dataset.deleteOrder);
    });
  });

  document.querySelectorAll('[data-open-other-catalog]').forEach((button) => {
    button.addEventListener('click', () => {
      appState.ui.outrosCadastrosSecao = button.dataset.openOtherCatalog || '';
      appState.ui.outrosCadastrosBusca = '';
      appState.ui.mostrarOutroCadastroModal = false;
      appState.ui.outroCadastroEditIndex = null;
      render();
    });
  });

  document.querySelectorAll('[data-back-other-catalog]').forEach((button) => {
    button.addEventListener('click', () => {
      appState.ui.outrosCadastrosSecao = '';
      appState.ui.outrosCadastrosBusca = '';
      appState.ui.mostrarOutroCadastroModal = false;
      appState.ui.outroCadastroEditIndex = null;
      render();
    });
  });

  const otherCatalogSearch = document.querySelector('#otherCatalogSearch');
  if (otherCatalogSearch) {
    otherCatalogSearch.addEventListener('input', (event) => {
      appState.ui.outrosCadastrosBusca = event.target.value;
      render();
    });
  }

  document.querySelectorAll('[data-new-other-catalog]').forEach((button) => {
    button.addEventListener('click', () => {
      appState.ui.mostrarOutroCadastroModal = true;
      appState.ui.outroCadastroEditIndex = null;
      render();
    });
  });

  document.querySelectorAll('[data-other-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      appState.ui.outroCadastroEditIndex = Number(button.dataset.otherEdit || -1);
      appState.ui.mostrarOutroCadastroModal = true;
      render();
    });
  });

  document.querySelectorAll('[data-other-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      const secao = appState.ui.outrosCadastrosSecao;
      if (!secao) return;
      const atual = Array.isArray(appState.outrosCadastros?.[secao]) ? appState.outrosCadastros[secao] : [];
      const index = Number(button.dataset.otherDelete || -1);
      if (index < 0 || index >= atual.length) return;

      const nextCatalog = {
        fornecedores: Array.isArray(appState.outrosCadastros?.fornecedores) ? [...appState.outrosCadastros.fornecedores] : [],
        categorias: Array.isArray(appState.outrosCadastros?.categorias) ? [...appState.outrosCadastros.categorias] : [],
        tiposMaterial: Array.isArray(appState.outrosCadastros?.tiposMaterial) ? [...appState.outrosCadastros.tiposMaterial] : [],
        marcasEquipamentos: Array.isArray(appState.outrosCadastros?.marcasEquipamentos) ? [...appState.outrosCadastros.marcasEquipamentos] : [],
        metodosPagamento: Array.isArray(appState.outrosCadastros?.metodosPagamento) ? [...appState.outrosCadastros.metodosPagamento] : [],
      };
      nextCatalog[secao] = atual.filter((_, itemIndex) => itemIndex !== index);

      const saved = await persistOtherCatalog(nextCatalog);
      if (saved) {
        appState.ui.mostrarOutroCadastroModal = false;
        appState.ui.outroCadastroEditIndex = null;
        render();
      }
    });
  });

  document.querySelectorAll('[data-other-close-modal]').forEach((button) => {
    button.addEventListener('click', () => {
      appState.ui.mostrarOutroCadastroModal = false;
      appState.ui.outroCadastroEditIndex = null;
      render();
    });
  });

  const otherCatalogModalBackdrop = document.querySelector('#otherCatalogModalBackdrop');
  if (otherCatalogModalBackdrop) {
    otherCatalogModalBackdrop.addEventListener('click', (event) => {
      if (event.target.id === 'otherCatalogModalBackdrop') {
        appState.ui.mostrarOutroCadastroModal = false;
        appState.ui.outroCadastroEditIndex = null;
        render();
      }
    });
  }

  const otherCatalogForm = document.querySelector('#otherCatalogForm');
  if (otherCatalogForm) {
    otherCatalogForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const secao = appState.ui.outrosCadastrosSecao;
      if (!secao) return;

      const payload = Object.fromEntries(new FormData(otherCatalogForm));
      const atual = Array.isArray(appState.outrosCadastros?.[secao]) ? [...appState.outrosCadastros[secao]] : [];
      const editIndex = typeof appState.ui.outroCadastroEditIndex === 'number' ? appState.ui.outroCadastroEditIndex : null;

      if (editIndex !== null && editIndex >= 0 && editIndex < atual.length) {
        atual[editIndex] = payload;
      } else {
        atual.push(payload);
      }

      const nextCatalog = {
        fornecedores: Array.isArray(appState.outrosCadastros?.fornecedores) ? [...appState.outrosCadastros.fornecedores] : [],
        categorias: Array.isArray(appState.outrosCadastros?.categorias) ? [...appState.outrosCadastros.categorias] : [],
        tiposMaterial: Array.isArray(appState.outrosCadastros?.tiposMaterial) ? [...appState.outrosCadastros.tiposMaterial] : [],
        marcasEquipamentos: Array.isArray(appState.outrosCadastros?.marcasEquipamentos) ? [...appState.outrosCadastros.marcasEquipamentos] : [],
        metodosPagamento: Array.isArray(appState.outrosCadastros?.metodosPagamento) ? [...appState.outrosCadastros.metodosPagamento] : [],
      };
      nextCatalog[secao] = atual;

      const saved = await persistOtherCatalog(nextCatalog);
      if (saved) {
        appState.ui.mostrarOutroCadastroModal = false;
        appState.ui.outroCadastroEditIndex = null;
        render();
      }
    });
  }

  const calcForm = document.querySelector('#calcForm');
  if (calcForm) {
    calcForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(calcForm));

      const filamentoKg = Number(payload.filamentoKg || 0);
      const pesoG = Number(payload.pesoG || 0);
      const duracaoHoras = Number(payload.duracaoHoras || 0);
      const taxaEnergia = Number(payload.taxaEnergia || 0);
      const consumoW = Number(payload.consumoW || 0);
      const margemLucro = Number(payload.margemLucro || 0);

      const custoFilamento = (pesoG / 1000) * filamentoKg;
      const consumoKwh = (consumoW / 1000) * duracaoHoras;
      const custoEnergia = consumoKwh * taxaEnergia;
      const custoBase = custoFilamento + custoEnergia;
      const precoSugerido = custoBase * (1 + margemLucro / 100);
      const lucroReais = precoSugerido - custoBase;
      const custoPorGrama = pesoG > 0 ? custoFilamento / pesoG : 0;

      const result = document.querySelector('#calcResult');
      if (result) {
        result.innerHTML = `
          <div class="calc-result-grid">
            <div class="calc-metric result-1"><p>Custo do filamento</p><strong>${money(custoFilamento)}</strong></div>
            <div class="calc-metric result-2"><p>Custo por grama</p><strong>${money(custoPorGrama)}</strong></div>
            <div class="calc-metric result-3"><p>Custo de energia</p><strong>${money(custoEnergia)}</strong></div>
            <div class="calc-metric result-4"><p>Custo base total</p><strong>${money(custoBase)}</strong></div>
            <div class="calc-metric result-5"><p>Preco sugerido</p><strong>${money(precoSugerido)}</strong></div>
            <div class="calc-metric result-6"><p>Lucro estimado</p><strong>${money(lucroReais)}</strong></div>
          </div>
        `;
      }
    });
  }

  document.querySelectorAll('[data-refresh-account]').forEach((button) => {
    button.addEventListener('click', async () => {
      await bootstrap();
    });
  });

  document.querySelectorAll('[data-open-planos]').forEach((button) => {
    button.addEventListener('click', () => {
      appState.ui.mostrarTrocaPlanoModal = true;
      render();
    });
  });

  const assinaturaPlanModalBackdrop = document.querySelector('#assinaturaPlanModalBackdrop');
  if (assinaturaPlanModalBackdrop) {
    assinaturaPlanModalBackdrop.addEventListener('click', (event) => {
      if (event.target.id === 'assinaturaPlanModalBackdrop') {
        appState.ui.mostrarTrocaPlanoModal = false;
        render();
      }
    });
  }

  const btnCloseAssinaturaPlanModal = document.querySelector('#btnCloseAssinaturaPlanModal');
  if (btnCloseAssinaturaPlanModal) {
    btnCloseAssinaturaPlanModal.addEventListener('click', () => {
      appState.ui.mostrarTrocaPlanoModal = false;
      render();
    });
  }

  document.querySelectorAll('[data-change-plan]').forEach((button) => {
    button.addEventListener('click', async () => {
      const planCode = String(button.dataset.changePlan || '').trim();
      if (!planCode) return;
      const response = await putJson('/account/plan', { planCode });
      if (response.ok) {
        appState.ui.mostrarTrocaPlanoModal = false;
        await bootstrap();
      }
    });
  });

  document.querySelectorAll('[data-open-config-section]').forEach((button) => {
    button.addEventListener('click', () => {
      appState.ui.configuracoesSecao = button.dataset.openConfigSection || '';
      render();
    });
  });

  const backConfigSection = document.querySelector('[data-back-config-section]');
  if (backConfigSection) {
    backConfigSection.addEventListener('click', () => {
      appState.ui.configuracoesSecao = '';
      render();
    });
  }

  const configuracoesForm = document.querySelector('#configuracoesForm');
  if (configuracoesForm) {
    const removeLogoButton = configuracoesForm.querySelector('[data-remove-company-logo]');
    const logoPreview = configuracoesForm.querySelector('[data-logo-preview]');
    const logoStatus = configuracoesForm.querySelector('[data-logo-status]');
    const removerLogoInput = configuracoesForm.querySelector('[name="removerLogo"]');
    const logoFileInput = configuracoesForm.querySelector('[name="logoArquivo"]');

    if (removeLogoButton) {
      removeLogoButton.addEventListener('click', () => {
        if (logoPreview) logoPreview.src = '/images/Logo.png';
        if (logoStatus) logoStatus.textContent = 'Logo padrao do sistema em uso.';
        if (removerLogoInput) removerLogoInput.value = 'true';
        if (logoFileInput) logoFileInput.value = '';
        removeLogoButton.classList.add('is-hidden');
      });
    }

    if (logoFileInput) {
      logoFileInput.addEventListener('change', async () => {
        const file = logoFileInput.files?.[0];
        if (!file) return;
        const dataUrl = await fileToDataUrl(file);
        if (logoPreview) logoPreview.src = dataUrl;
        if (logoStatus) logoStatus.textContent = `Logo atual: ${file.name}`;
        if (removerLogoInput) removerLogoInput.value = 'false';
        if (removeLogoButton) removeLogoButton.classList.remove('is-hidden');
      });
    }

    configuracoesForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(configuracoesForm);
      const section = String(configuracoesForm.dataset.configForm || '').trim();
      const currentConfig = appState.configuracoes || {};
      const payload = {
        perfilEmpresa: { ...(currentConfig.perfilEmpresa || {}) },
        preferenciasTela: { ...(currentConfig.preferenciasTela || {}) },
        orcamentos: { ...(currentConfig.orcamentos || {}) },
        impressaoPdf: { ...(currentConfig.impressaoPdf || {}) },
      };

      if (section === 'perfil') {
        const logoArquivo = formData.get('logoArquivo');
        const removeLogo = String(formData.get('removerLogo') || 'false') === 'true';
        payload.perfilEmpresa.nomeFantasia = String(formData.get('nomeFantasia') || '').trim();
        payload.perfilEmpresa.telefoneWhatsApp = String(formData.get('telefoneWhatsApp') || '').trim();
        payload.perfilEmpresa.email = String(formData.get('email') || '').trim();
        payload.perfilEmpresa.endereco = String(formData.get('endereco') || '').trim();

        if (removeLogo) {
          payload.perfilEmpresa.logoDataUrl = '';
          payload.perfilEmpresa.logoNome = '';
        } else if (logoArquivo instanceof File && logoArquivo.size > 0) {
          payload.perfilEmpresa.logoDataUrl = await fileToDataUrl(logoArquivo);
          payload.perfilEmpresa.logoNome = logoArquivo.name;
        }
      }

      if (section === 'tela') {
        payload.preferenciasTela.temaPadrao = String(formData.get('temaPadrao') || 'claro');
        payload.preferenciasTela.formatoData = String(formData.get('formatoData') || 'pt-BR');
        payload.preferenciasTela.mostrarCentavos = String(formData.get('mostrarCentavos') || 'true') !== 'false';
      }

      if (section === 'orcamentos') {
        payload.orcamentos.validadePadraoDias = Number(formData.get('validadePadraoDias') || 7);
        payload.orcamentos.textoPadraoObservacoes = String(formData.get('textoPadraoObservacoes') || '').trim();
        payload.orcamentos.mensagemPadraoPdf = String(formData.get('mensagemPadraoPdf') || '').trim();
      }

      if (section === 'pdf') {
        payload.impressaoPdf.mostrarLogoNoPdf = String(formData.get('mostrarLogoNoPdf') || 'true') !== 'false';
        payload.impressaoPdf.corCabecalhoPdf = String(formData.get('corCabecalhoPdf') || '#e9eef5').trim();
        payload.impressaoPdf.rodapePadrao = String(formData.get('rodapePadrao') || '').trim();
      }

      const response = await putJson('/configuracoes', payload);
      if (response.ok) {
        appState.configuracoes = await response.json();
        render();
      }
    });
  }
}

async function bootstrap() {
  const [dashboard, conta, configuracoes, clientes, produtos, pedidos, orcamentos, financeiro, materiais, impressoras, outrosCadastros] = await Promise.all([
    getOrFallback('/dashboard', null),
    getOrFallback('/account/plan', null),
    getOrFallback('/configuracoes', null),
    getOrFallback('/clientes', []),
    getOrFallback('/produtos', []),
    getOrFallback('/pedidos', []),
    getOrFallback('/orcamentos', []),
    getOrFallback('/financeiro', []),
    getOrFallback('/materiais', []),
    getOrFallback('/equipamentos', []),
    getOrFallback('/outros-cadastros', null),
  ]);

  const isAdmin = Boolean(conta?.user?.isAdmin);
  const [adminUsers, adminCatalog] = await Promise.all([
    isAdmin ? getOrFallback('/admin/users', []) : Promise.resolve([]),
    isAdmin ? getOrFallback('/admin/plans', null) : Promise.resolve(null),
  ]);

  appState.dashboard = dashboard;
  appState.conta = conta;
  appState.configuracoes = configuracoes;
  appState.clientes = clientes;
  appState.produtos = produtos;
  appState.pedidos = pedidos;
  appState.orcamentos = orcamentos;
  appState.financeiro = financeiro;
  appState.materiais = materiais;
  appState.filamentos = materiais;
  appState.impressoras = impressoras;
  appState.outrosCadastros = outrosCadastros;
  appState.adminUsers = Array.isArray(adminUsers) ? adminUsers : [];
  appState.masterPlans = Array.isArray(adminCatalog?.plans) ? adminCatalog.plans : [];
  appState.masterPlanMeta = adminCatalog
    ? {
        limits: Array.isArray(adminCatalog.limits) ? adminCatalog.limits : [],
        permissions: Array.isArray(adminCatalog.permissions) ? adminCatalog.permissions : [],
      }
    : null;

  render();
}

bootstrap();
