function clampList(items, size = 8) {
  return (Array.isArray(items) ? items : []).slice(0, size);
}

function safePercent(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '0,0%';
  return `${number.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function renderTable(headers, rowsHtml, emptyLabel, colSpan) {
  return `
    <div class="relatorio-table-wrap">
      <table class="relatorio-table">
        <thead><tr>${headers.map((item) => `<th>${item}</th>`).join('')}</tr></thead>
        <tbody>${rowsHtml || `<tr><td colspan="${colSpan}">${emptyLabel}</td></tr>`}</tbody>
      </table>
    </div>
  `;
}

function renderPeriodToolbar(ui, relatorio) {
  const preset = String(ui.relatoriosPeriodo || 'mes_atual');
  const inicio = String(ui.relatoriosInicio || '');
  const fim = String(ui.relatoriosFim || '');
  const periodoDescricao = relatorio?.periodo?.descricao || 'Periodo atual';

  const options = [
    { value: 'mes_atual', label: 'Mes atual' },
    { value: 'ultimos_30', label: 'Ultimos 30 dias' },
    { value: 'ultimos_90', label: 'Ultimos 90 dias' },
    { value: 'ano_atual', label: 'Ano atual' },
    { value: 'personalizado', label: 'Personalizado' },
  ];

  return `
    <div class="relatorios-toolbar">
      <div class="relatorios-periodo-main">
        <label>Periodo</label>
        <select id="relatoriosPeriodoPreset">
          ${options.map((item) => `<option value="${item.value}" ${item.value === preset ? 'selected' : ''}>${item.label}</option>`).join('')}
        </select>
      </div>
      <div class="relatorios-periodo-range ${preset === 'personalizado' ? '' : 'hidden'}" id="relatoriosPeriodoRange">
        <div>
          <label>Inicio</label>
          <input id="relatoriosPeriodoInicio" type="date" value="${inicio}" />
        </div>
        <div>
          <label>Fim</label>
          <input id="relatoriosPeriodoFim" type="date" value="${fim}" />
        </div>
      </div>
      <button id="btnAplicarPeriodoRelatorios" class="primary-btn relatorios-apply-btn" type="button">Aplicar</button>
      <div class="relatorios-periodo-status">${periodoDescricao}</div>
    </div>
  `;
}

function renderLandingCards(relatorio, money, number) {
  const resumo = relatorio?.resumo || {};
  const cards = [
    {
      key: 'geral',
      title: 'Visao Geral',
      subtitle: 'Faturamento, lucro, margem e conversao.',
      kpi: money(resumo.totalVendido || 0),
      kpiLabel: 'Vendido no periodo',
    },
    {
      key: 'clientes',
      title: 'Clientes e Vendas',
      subtitle: 'Top clientes e produtos com maior receita.',
      kpi: number(resumo.pedidosConfirmados || 0),
      kpiLabel: 'Pedidos confirmados',
    },
    {
      key: 'compras',
      title: 'Compras e Custos',
      subtitle: 'Categorias e fornecedores com maior impacto.',
      kpi: money(resumo.totalCompras || 0),
      kpiLabel: 'Compras no periodo',
    },
    {
      key: 'pedidos',
      title: 'Pedidos e Performance',
      subtitle: 'Status operacionais e produtividade.',
      kpi: safePercent(resumo.margemLucro || 0),
      kpiLabel: 'Margem de lucro',
    },
  ];

  return cards
    .map((item) => `
      <article class="relatorio-card-nav">
        <strong>${item.title}</strong>
        <span>${item.subtitle}</span>
        <em>${item.kpiLabel}</em>
        <b>${item.kpi}</b>
        <div class="relatorio-card-actions">
          <button type="button" class="ghost-btn relatorio-card-btn" data-open-relatorio-section="${item.key}">Abrir</button>
          <button type="button" class="ghost-btn relatorio-card-btn" data-print-relatorio="${item.key}">Imprimir</button>
          <button type="button" class="ghost-btn relatorio-card-btn" data-download-relatorio="${item.key}">Baixar PDF</button>
        </div>
      </article>
    `)
    .join('');
}

function renderSectionOverview(relatorio, money, number) {
  const resumo = relatorio?.resumo || {};
  const serie = clampList(relatorio?.listas?.seriePeriodo, 18);

  const rows = serie
    .map(
      (item) => `
        <tr>
          <td>${item.periodo}</td>
          <td>${number(item.pedidos || 0)}</td>
          <td>${money(item.vendas || 0)}</td>
          <td>${money(item.lucro || 0)}</td>
          <td>${money(item.compras || 0)}</td>
        </tr>
      `
    )
    .join('');

  return `
    <div class="relatorio-kpi-grid">
      <article><span>Vendido</span><strong>${money(resumo.totalVendido || 0)}</strong></article>
      <article><span>Lucro</span><strong>${money(resumo.lucroTotal || 0)}</strong></article>
      <article><span>Compras</span><strong>${money(resumo.totalCompras || 0)}</strong></article>
      <article><span>Ticket medio</span><strong>${money(resumo.ticketMedio || 0)}</strong></article>
      <article><span>Margem de lucro no periodo</span><strong>${safePercent(resumo.margemLucro || 0)}</strong></article>
      <article><span>Conversao de orcamentos aprovados</span><strong>${safePercent(resumo.taxaConversao || 0)}</strong></article>
    </div>
    <section class="relatorio-section-box">
      <h4>Evolucao por periodo</h4>
      ${renderTable(['Periodo', 'Pedidos', 'Vendas', 'Lucro', 'Compras'], rows, 'Sem dados no periodo.', 5)}
    </section>
  `;
}

function renderSectionClientes(relatorio, money, number) {
  const topClientesRows = clampList(relatorio?.listas?.topClientes)
    .map(
      (item) => `
        <tr>
          <td>${item.nome}</td>
          <td>${number(item.pedidos || 0)}</td>
          <td>${money(item.totalVendido || 0)}</td>
          <td>${money(item.lucro || 0)}</td>
        </tr>
      `
    )
    .join('');

  const topProdutosRows = clampList(relatorio?.listas?.topProdutos)
    .map(
      (item) => `
        <tr>
          <td>${item.nome}</td>
          <td>${number(item.pedidos || 0)}</td>
          <td>${money(item.totalVendido || 0)}</td>
          <td>${money(item.lucro || 0)}</td>
        </tr>
      `
    )
    .join('');

  return `
    <div class="relatorio-split-grid">
      <section class="relatorio-section-box">
        <h4>Top clientes por faturamento</h4>
        ${renderTable(['Cliente', 'Pedidos', 'Vendido', 'Lucro'], topClientesRows, 'Sem vendas no periodo.', 4)}
      </section>
      <section class="relatorio-section-box">
        <h4>Top produtos por faturamento</h4>
        ${renderTable(['Produto', 'Pedidos', 'Vendido', 'Lucro'], topProdutosRows, 'Sem produtos vendidos no periodo.', 4)}
      </section>
    </div>
  `;
}

function renderSectionCompras(relatorio, money, number) {
  const categoriaRows = clampList(relatorio?.listas?.comprasPorCategoria)
    .map(
      (item) => `
        <tr>
          <td>${item.nome}</td>
          <td>${number(item.lancamentos || 0)}</td>
          <td>${money(item.total || 0)}</td>
        </tr>
      `
    )
    .join('');

  const fornecedorRows = clampList(relatorio?.listas?.comprasPorFornecedor)
    .map(
      (item) => `
        <tr>
          <td>${item.nome}</td>
          <td>${number(item.lancamentos || 0)}</td>
          <td>${money(item.total || 0)}</td>
        </tr>
      `
    )
    .join('');

  return `
    <div class="relatorio-split-grid">
      <section class="relatorio-section-box">
        <h4>Compras por categoria</h4>
        ${renderTable(['Categoria', 'Lancamentos', 'Total'], categoriaRows, 'Sem compras no periodo.', 3)}
      </section>
      <section class="relatorio-section-box">
        <h4>Compras por fornecedor</h4>
        ${renderTable(['Fornecedor', 'Lancamentos', 'Total'], fornecedorRows, 'Sem compras no periodo.', 3)}
      </section>
    </div>
  `;
}

function renderSectionPedidos(relatorio, money, number) {
  const statusRows = clampList(relatorio?.listas?.statusPedidos)
    .map(
      (item) => `
        <tr>
          <td>${String(item.status || '-').replaceAll('_', ' ')}</td>
          <td>${number(item.total || 0)}</td>
          <td>${money(item.valor || 0)}</td>
        </tr>
      `
    )
    .join('');

  const resumo = relatorio?.resumo || {};

  return `
    <div class="relatorio-kpi-grid compact">
      <article><span>Horas de impressao</span><strong>${number(resumo.horasImpressao || 0)} h</strong></article>
      <article><span>Peso produzido</span><strong>${number(resumo.pesoTotal || 0)} g</strong></article>
      <article><span>Itens comprados</span><strong>${number(resumo.totalItensComprados || 0)}</strong></article>
      <article><span>Clientes ativos</span><strong>${number(resumo.clientesAtivos || 0)}</strong></article>
    </div>
    <section class="relatorio-section-box">
      <h4>Distribuicao de pedidos por status</h4>
      ${renderTable(['Status', 'Quantidade', 'Valor'], statusRows, 'Sem pedidos no periodo.', 3)}
    </section>
  `;
}

function renderSectionContent(section, relatorio, money, number) {
  if (section === 'clientes') return renderSectionClientes(relatorio, money, number);
  if (section === 'compras') return renderSectionCompras(relatorio, money, number);
  if (section === 'pedidos') return renderSectionPedidos(relatorio, money, number);
  return renderSectionOverview(relatorio, money, number);
}

function renderSectionTitle(section) {
  if (section === 'clientes') return 'Clientes e Vendas';
  if (section === 'compras') return 'Compras e Custos';
  if (section === 'pedidos') return 'Pedidos e Performance';
  return 'Visao Geral';
}

export function renderRelatoriosPage(ctx) {
  const { appState, money, number } = ctx;
  const relatorio = appState.relatorios || null;
  const section = String(appState.ui.relatoriosSecao || '');
  const insights = clampList(relatorio?.insights, 4);

  return `
    <section>
      <header class="relatorios-head">
        <div>
          <h2>Relatorios Inteligentes</h2>
          <p>Analise vendas, clientes, custos e produtividade com filtros por periodo.</p>
        </div>
        ${
          section
            ? `<div class="relatorios-actions"><button class="ghost-btn" type="button" data-back-relatorio-section>← Voltar</button></div>`
            : ''
        }
      </header>

      ${renderPeriodToolbar(appState.ui, relatorio)}

      <section class="relatorios-insights">
        ${
          insights.length
            ? insights.map((item) => `<article class="insight-card">${item}</article>`).join('')
            : '<article class="insight-card">Sem insights suficientes para o periodo selecionado.</article>'
        }
      </section>

      ${
        section
          ? `<section class="relatorios-detail">
              <div class="relatorios-detail-head">
                <h3>${renderSectionTitle(section)}</h3>
                <div class="relatorios-detail-actions">
                  <button type="button" class="ghost-btn" data-print-relatorio="${section}">Imprimir</button>
                  <button type="button" class="ghost-btn" data-download-relatorio="${section}">Baixar PDF</button>
                </div>
              </div>
              ${renderSectionContent(section, relatorio, money, number)}
            </section>`
          : `<div class="relatorios-nav-grid">${renderLandingCards(relatorio, money, number)}</div>`
      }
    </section>
  `;
}
