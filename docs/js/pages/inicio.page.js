function pct(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function polarToCartesian(cx, cy, radius, angleDeg) {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function describeArc(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function renderGaugeCard(title, value, subtitle, stroke) {
  const percent = Math.max(0, Math.min(100, Number(value || 0)));
  const endAngle = 360 * (percent / 100);
  const arcPath = describeArc(38, 38, 30, 0, endAngle || 0.1);

  return `
    <article class="inicio-gauge-card">
      <div class="inicio-gauge-icon">
        <svg viewBox="0 0 76 76" aria-hidden="true">
          <circle cx="38" cy="38" r="30" class="track"></circle>
          <path d="${arcPath}" class="value" style="--stroke:${stroke}"></path>
        </svg>
        <strong>${Math.round(percent)}%</strong>
      </div>
      <div class="inicio-gauge-content">
        <p class="label">${title}</p>
        <h4>${subtitle}</h4>
        <span>${pct(percent)}</span>
      </div>
    </article>
  `;
}

function renderCountCard(title, value, subtitle, accent, helper = '') {
  return `
    <article class="inicio-count-card accent-${accent}">
      <div class="count-head">
        <span>${title}</span>
        <i></i>
      </div>
      <strong>${value}</strong>
      <h4>${subtitle}</h4>
      ${helper ? `<small>${helper}</small>` : ''}
    </article>
  `;
}

function normalizeSeriesRows(rows) {
  const source = asArray(rows);
  return source.length
    ? source
    : [
        { label: 'mes 1', entrada: 0, custo: 0, lucro: 0 },
        { label: 'mes 2', entrada: 0, custo: 0, lucro: 0 },
        { label: 'mes 3', entrada: 0, custo: 0, lucro: 0 },
      ];
}

function buildLinePoints(rows, key, width, height, padding, maxValue) {
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  return rows.map((item, index) => {
    const x = rows.length <= 1 ? padding : padding + (index / (rows.length - 1)) * innerWidth;
    const value = Math.max(0, Number(item?.[key] || 0));
    const y = padding + innerHeight - (value / Math.max(1, maxValue)) * innerHeight;
    return { x, y, value };
  });
}

function renderSeriesChart(rows, money, renderKicker) {
  const data = normalizeSeriesRows(rows);
  const maxValue = data.reduce((acc, item) => {
    const maxRow = Math.max(Number(item.entrada || 0), Number(item.custo || 0), Number(item.lucro || 0));
    return Math.max(acc, maxRow);
  }, 1);
  const width = 760;
  const height = 280;
  const padding = 28;

  const entradaPoints = buildLinePoints(data, 'entrada', width, height, padding, maxValue);
  const custoPoints = buildLinePoints(data, 'custo', width, height, padding, maxValue);
  const lucroPoints = buildLinePoints(data, 'lucro', width, height, padding, maxValue);

  const pointsToString = (points) => points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  const renderDots = (points, className) =>
    points
      .map(
        (point) => `
          <circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4" class="chart-dot ${className}"></circle>
        `
      )
      .join('');
  const formatChartMoney = (value) =>
    Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const renderValueLabels = (points, className, yOffset, xOffset = 0) =>
    points
      .map((point) => {
        const x = Number((point.x + xOffset).toFixed(1));
        const yRaw = point.y + yOffset;
        const y = Number(Math.max(12, Math.min(height - padding - 8, yRaw)).toFixed(1));
        return `<text x="${x}" y="${y}" text-anchor="middle" class="chart-value-label ${className}">${formatChartMoney(point.value)}</text>`;
      })
      .join('');
  const renderMonthLabels = () =>
    data
      .map((item, index) => {
        const x = Number(entradaPoints[index].x.toFixed(1));
        const y = height - 6;
        const anchor = index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle';
        const cls = index === data.length - 1 ? 'chart-month-label current' : 'chart-month-label';
        return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}">${item.label}</text>`;
      })
      .join('');

  const current = data[data.length - 1] || { entrada: 0, custo: 0, lucro: 0, label: '-' };

  return `
    <article class="inicio-chart-card inicio-chart-series">
      <header>
        ${renderKicker('Lancamentos e Lucro - Ultimos 6 meses', 'series')}
        <p>3 linhas com a evolucao mensal de entrada, custo e lucro.</p>
      </header>
      <div class="legend">
        <span><i class="dot dot-entrada"></i>Entrada</span>
        <span><i class="dot dot-custo"></i>Custo</span>
        <span><i class="dot dot-lucro"></i>Lucro</span>
      </div>
      <div class="series-chart">
        <svg viewBox="0 0 ${width} ${height}" class="line-chart" aria-hidden="true">
          <g class="chart-grid">
            <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}"></line>
            <line x1="${padding}" y1="${padding + (height - padding * 2) / 3}" x2="${width - padding}" y2="${padding + (height - padding * 2) / 3}"></line>
            <line x1="${padding}" y1="${padding + ((height - padding * 2) / 3) * 2}" x2="${width - padding}" y2="${padding + ((height - padding * 2) / 3) * 2}"></line>
            <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}"></line>
          </g>
          <polyline points="${pointsToString(entradaPoints)}" class="line-entrada"></polyline>
          <polyline points="${pointsToString(custoPoints)}" class="line-custo"></polyline>
          <polyline points="${pointsToString(lucroPoints)}" class="line-lucro"></polyline>
          ${renderValueLabels(entradaPoints, 'value-entrada', -12)}
          ${renderValueLabels(custoPoints, 'value-custo', -24)}
          ${renderValueLabels(lucroPoints, 'value-lucro', 14)}
          ${renderDots(entradaPoints, 'dot-entrada')}
          ${renderDots(custoPoints, 'dot-custo')}
          ${renderDots(lucroPoints, 'dot-lucro')}
          ${renderMonthLabels()}
        </svg>
      </div>
      <div class="series-summary-strip">
        <div><small>Mes mais recente</small><strong>${current.label}</strong></div>
        <div><small>Entrada</small><strong>${money(current.entrada)}</strong></div>
        <div><small>Custo</small><strong>${money(current.custo)}</strong></div>
        <div><small>Lucro</small><strong>${money(current.lucro)}</strong></div>
      </div>
    </article>
  `;
}

function renderStatusChart(rows, number) {
  const data = asArray(rows);
  if (!data.length) {
    return '<div class="empty-box">Sem dados de status.</div>';
  }

  return `
    <div class="status-bars">
      ${data
        .map(
          (item) => {
            const statusLabelRaw = String(item.status || '-').replaceAll('_', ' ');
            const statusLabel = statusLabelRaw.toLowerCase() === 'aprovado' ? 'recebido' : statusLabelRaw;
            return `
            <div class="status-bar-row">
              <div class="status-bar-head">
                <span>${statusLabel}</span>
                <strong>${number(item.quantidade)} (${pct(item.percentual)})</strong>
              </div>
              <div class="status-bar-track">
                <div class="status-bar-fill" style="width:${Math.max(4, Math.min(100, Number(item.percentual || 0)))}%"></div>
              </div>
            </div>
          `;
          }
        )
        .join('')}
    </div>
  `;
}

function safePercent(value) {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, parsed));
}

function computeDeltaPercent(current, previous) {
  const curr = Number(current || 0);
  const prev = Number(previous || 0);
  if (!Number.isFinite(curr) || !Number.isFinite(prev)) return 0;
  if (prev <= 0) {
    if (curr > 0) return 100;
    return 0;
  }
  return ((curr - prev) / prev) * 100;
}

function formatDeltaLabel(delta) {
  const value = Number(delta || 0);
  const absValue = Math.abs(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  if (value > 0) return `+${absValue}%`;
  if (value < 0) return `-${absValue}%`;
  return '0,0%';
}

function renderDeltaBadge(delta, reverse = false) {
  const isPositive = Number(delta || 0) > 0;
  const isNegative = Number(delta || 0) < 0;
  const tone = isNegative ? (reverse ? 'positive' : 'negative') : isPositive ? (reverse ? 'negative' : 'positive') : 'neutral';
  return `<span class="inicio-delta-badge ${tone}">${formatDeltaLabel(delta)}</span>`;
}

export function renderInicioPage(ctx) {
  const { appState, money, number } = ctx;
  const dashboard = appState.dashboard || {};
  const overview = dashboard.overview || {};
  const modulos = dashboard.modulos || {};
  const graficos = dashboard.graficos || {};

  const pedidos = modulos.pedidos || {};
  const clientes = modulos.clientes || {};
  const orcamentos = modulos.orcamentos || {};
  const estoque = modulos.estoque || {};
  const compras = modulos.compras || {};
  const equipamentos = modulos.equipamentos || {};
  const indicadoresMateriais = estoque.indicadoresMateriais || {};

  const produtosMaisVendidos = asArray(graficos.produtosMaisVendidos);
  const equipamentosMensais = asArray(graficos.equipamentosMensais);
  const seriesRows = normalizeSeriesRows(graficos.series);
  const currentSeries = seriesRows[seriesRows.length - 1] || { entrada: 0, custo: 0, lucro: 0, label: '-' };
  const previousSeries = seriesRows[Math.max(0, seriesRows.length - 2)] || { entrada: 0, custo: 0, lucro: 0, label: '-' };
  const comprasMesItens = asArray(compras.itensMes);
  const compraMaisComprada = comprasMesItens[0] || {};
  const compraMaisCompradaLabel = compraMaisComprada.material || compraMaisComprada.descricao || 'Sem item principal';
  const compraMaisCompradaDetalhe = compraMaisComprada.fornecedor
    ? `${compraMaisComprada.fornecedor} · ${number(compraMaisComprada.quantidade)} un`
    : `${number(compraMaisComprada.quantidade)} un`;

  const faturamentoAtual = Number(currentSeries.entrada || overview.pedidosEntradaMensal || pedidos.entradaMes || 0);
  const faturamentoAnterior = Number(previousSeries.entrada || 0);
  const lucroAtual = Number(currentSeries.lucro || overview.pedidosLucroMensal || pedidos.lucroMes || 0);
  const lucroAnterior = Number(previousSeries.lucro || 0);
  const custoAtual = Number(currentSeries.custo || overview.pedidosCustoMensal || pedidos.custoMes || 0);
  const custoAnterior = Number(previousSeries.custo || 0);
  const pedidosMesAtual = Number(pedidos.mes || 0);
  const pedidosMesAnterior = Number(previousSeries.entrada > 0 ? Math.max(1, Math.round((faturamentoAnterior / Math.max(1, faturamentoAtual)) * pedidosMesAtual)) : 0);

  const deltaFaturamento = computeDeltaPercent(faturamentoAtual, faturamentoAnterior);
  const deltaLucro = computeDeltaPercent(lucroAtual, lucroAnterior);
  const deltaCusto = computeDeltaPercent(custoAtual, custoAnterior);
  const deltaPedidos = computeDeltaPercent(pedidosMesAtual, pedidosMesAnterior);

  const taxaConversaoPercent = safePercent(
    Number(orcamentos.quantidadeMes || 0) > 0
      ? (Number(orcamentos.aprovadosMes || 0) / Number(orcamentos.quantidadeMes || 1)) * 100
      : 0
  );
  const taxaEntregaNoPrazo = safePercent(
    Number(pedidos.mes || 0) > 0
      ? ((Number(pedidos.mes || 0) - Number(pedidos.atrasados || 0)) / Number(pedidos.mes || 1)) * 100
      : 0
  );
  const margemPedidosMes = safePercent(overview.margemPedidosMesPercent || 0);
  const riscosDoDia = [
    {
      label: 'Pedidos atrasados',
      value: number(pedidos.atrasados),
      severity: Number(pedidos.atrasados || 0) > 0 ? 'high' : 'ok',
      hint: Number(pedidos.atrasados || 0) > 0 ? 'Priorizar finalizacao e entrega' : 'Fluxo em dia',
    },
    {
      label: 'Produtos com estoque baixo',
      value: number(estoque.produtosBaixo),
      severity: Number(estoque.produtosBaixo || 0) > 0 ? 'medium' : 'ok',
      hint: Number(estoque.produtosBaixo || 0) > 0 ? 'Programar reposicao' : 'Sem ruptura prevista',
    },
    {
      label: 'Materiais com estoque baixo',
      value: number(estoque.materiaisBaixo),
      severity: Number(estoque.materiaisBaixo || 0) > 0 ? 'medium' : 'ok',
      hint: Number(estoque.materiaisBaixo || 0) > 0 ? 'Revisar compras da semana' : 'Nivel saudavel',
    },
    {
      label: 'Orcamentos vencidos',
      value: number(orcamentos.vencidos),
      severity: Number(orcamentos.vencidos || 0) > 0 ? 'high' : 'ok',
      hint: Number(orcamentos.vencidos || 0) > 0 ? 'Retomar contato com cliente' : 'Sem pendencia critica',
    },
  ];


  const renderMiniMetric = (label, value, tone = '') => `
    <article class="mini-metric ${tone}">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `;

  const formatHours = (value) =>
    `${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h`;

  const renderProgressRow = (label, value, total, suffix = '') => {
    const percent = Math.max(0, Math.min(100, Number(total ? (value / total) * 100 : 0)));
    return `
      <div class="progress-row">
        <div class="progress-head">
          <span>${label}</span>
          <b>${money(value)}${suffix}</b>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${Math.max(4, percent)}%"></div></div>
      </div>
    `;
  };

  const renderEquipmentRow = (item, index) => `
    <div class="equipment-row">
      <div class="equipment-rank">${index + 1}</div>
      <div class="equipment-main">
        <strong>${item.nome}</strong>
        <span>${number(item.pedidos)} pedidos no mes</span>
      </div>
      <div class="equipment-stats time metric-time">
        <small>Tempo imp.</small>
        <b>${formatHours(item.tempoImpressaoHoras)}</b>
      </div>
      <div class="equipment-stats metric-energy">
        <small>Energia</small>
        <b>${money(item.custoEnergia)}</b>
      </div>
      <div class="equipment-stats metric-depreciacao">
        <small>Depreciação</small>
        <b>${money(item.custoDepreciacao)}</b>
      </div>
      <div class="equipment-stats total metric-total">
        <small>Total</small>
        <b>${money(item.custoTotal)}</b>
      </div>
    </div>
  `;

  const isDarkMode =
    typeof document !== 'undefined' && document?.body && !document.body.classList.contains('theme-light');

  const kickerPalette = {
    pedidos: {
      light: { background: 'linear-gradient(180deg, #d8f1ff, #c7e9ff)', border: '#3ea4e5', color: '#125784' },
      dark: { background: '#1f4d7b', border: '#5aa6e8', color: '#d6ebff' },
    },
    compras: {
      light: { background: 'linear-gradient(180deg, #d6f5fb, #c4edf5)', border: '#37b7c8', color: '#0f5f72' },
      dark: { background: '#1b5d70', border: '#59c1d1', color: '#d3f8ff' },
    },
    financeiro: {
      light: { background: 'linear-gradient(180deg, #e2ebff, #d4e2ff)', border: '#5f8edd', color: '#2d4d8b' },
      dark: { background: '#2e4f90', border: '#7da4e5', color: '#e2ecff' },
    },
    equipamentos: {
      light: { background: 'linear-gradient(180deg, #deefff, #cfe6ff)', border: '#5ea6e8', color: '#21588e' },
      dark: { background: '#285782', border: '#74b2e8', color: '#dff0ff' },
    },
    radar: {
      light: { background: 'linear-gradient(180deg, #deeeff, #cfe4ff)', border: '#5d9fd8', color: '#1e527f' },
      dark: { background: '#2f507a', border: '#77abd7', color: '#dbe9ff' },
    },
    orcamentos: {
      light: { background: 'linear-gradient(180deg, #e9eafe, #dde0ff)', border: '#828fdd', color: '#434c97' },
      dark: { background: '#4b4c8f', border: '#9ea3e8', color: '#e8e8ff' },
    },
    materiais: {
      light: { background: 'linear-gradient(180deg, #d8f6ef, #c6ecdf)', border: '#56bca8', color: '#126658' },
      dark: { background: '#23675d', border: '#76ccb9', color: '#d5fff6' },
    },
    'top-produtos': {
      light: { background: 'linear-gradient(180deg, #fdebd7, #f8dec0)', border: '#de9955', color: '#8a4f17' },
      dark: { background: '#6d4c28', border: '#d7a46c', color: '#ffe9cf' },
    },
    series: {
      light: { background: 'linear-gradient(180deg, #d7f8eb, #c6efde)', border: '#58c7a0', color: '#1c6f57' },
      dark: { background: '#1f6755', border: '#69caae', color: '#d5fff0' },
    },
  };

  const renderKicker = (label, key) => {
    const palette = kickerPalette[key] || kickerPalette.pedidos;
    const tone = isDarkMode ? palette.dark : palette.light;
    const style = `background:${tone.background};border-color:${tone.border};color:${tone.color};`;
    return `<p class="summary-kicker kicker-${key}" style="${style}">${label}</p>`;
  };

  return `
    <section class="inicio-dashboard">
      <header class="page-header">
        <div>
          <h2>Painel Geral</h2>
          <p>Visao executiva consolidada com indicadores operacionais, financeiros e de equipamentos.</p>
        </div>
      </header>

      <section class="inicio-top-card">
        <article class="summary-hero summary-top-card summary-orders-card">
          ${renderKicker('Pedidos do mês', 'pedidos')}
          <h3>${money(faturamentoAtual)}</h3>
          <span>Indicadores consolidados deste mês</span>
          <div class="summary-inline-stats" style="grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;">
            <div>
              <small class="stats-head">Faturamento ${renderDeltaBadge(deltaFaturamento)}</small>
              <strong>${money(faturamentoAtual)}</strong>
            </div>
            <div>
              <small class="stats-head">Lucro ${renderDeltaBadge(deltaLucro)}</small>
              <strong>${money(lucroAtual)}</strong>
            </div>
            <div>
              <small class="stats-head">Custo ${renderDeltaBadge(deltaCusto, true)}</small>
              <strong>${money(custoAtual)}</strong>
            </div>
            <div>
              <small class="stats-head">Pedidos ${renderDeltaBadge(deltaPedidos)}</small>
              <strong>${number(pedidosMesAtual)}</strong>
            </div>
          </div>
          <div class="summary-inline-stats orders-finance-grid">
            <div><small>Conversao orcamento</small><strong>${pct(taxaConversaoPercent)}</strong></div>
            <div><small>Margem media</small><strong>${pct(margemPedidosMes)}</strong></div>
            <div><small>Entrega no prazo</small><strong>${pct(taxaEntregaNoPrazo)}</strong></div>
            <div><small>Ticket medio</small><strong>${money(pedidos.ticketMedio)}</strong></div>
          </div>
        </article>

        <div class="inicio-top-right-stack">
          <article class="summary-hero summary-top-card summary-purchases-card">
            ${renderKicker('Compras e despesas', 'compras')}
            <h3>${money(compras.custoMes || 0)}</h3>
            <span>Total de compras no mês</span>
            <div class="summary-inline-stats">
              <div><small>Total de compras</small><strong>${number(compras.totalMes)}</strong></div>
              <div><small>Total gasto</small><strong>${money(compras.custoMes || 0)}</strong></div>
              <div><small>Item mais comprado</small><strong>${compraMaisCompradaLabel}</strong></div>
              <div><small>Qtd item top</small><strong>${number(compraMaisComprada.quantidade || 0)}</strong></div>
            </div>
            <div class="summary-inline-note">${compraMaisCompradaDetalhe}</div>
          </article>

          <article class="inicio-risk-panel">
            <header>
              ${renderKicker('Riscos do dia', 'radar')}
              <p>Prioridades para agir agora</p>
            </header>
            <ul>
              ${riscosDoDia
                .map(
                  (item) => `
                    <li class="severity-${item.severity}">
                      <div>
                        <strong>${item.label}</strong>
                        <small>${item.hint}</small>
                      </div>
                      <b>${item.value}</b>
                    </li>
                  `
                )
                .join('')}
            </ul>
          </article>
        </div>
      </section>

      <section class="inicio-dual-grid">
        <article class="inicio-chart-card inicio-financeiro-card">
          <header>
            ${renderKicker('Financeiro', 'financeiro')}
            <p>Receita, custo e lucro separados por mês.</p>
          </header>
          ${renderSeriesChart(graficos.series, money, renderKicker)}
        </article>

        <article class="inicio-panel-card equipments-card">
          <header>
            ${renderKicker('Equipamentos', 'equipamentos')}
            <p>Gasto mensal por equipamento.</p>
          </header>
          <div class="equipment-summary">
            <div><small>Ativos</small><strong>${number(equipamentos.ativos)}</strong></div>
            <div><small>Uptime medio</small><strong>${pct(equipamentos.uptimeMedioPercent)}</strong></div>
            <div><small>Índice tempo impressão</small><strong>${formatHours(overview.horasImpressao || 0)}</strong></div>
            <div><small>Gasto mes</small><strong>${money(overview.equipamentosGastoMensal || 0)}</strong></div>
          </div>
          <div class="equipment-list">
            ${
              equipamentosMensais.length
                ? equipamentosMensais.slice(0, 4).map(renderEquipmentRow).join('')
                : '<div class="empty-box">Sem pedidos ligados a equipamentos neste mes.</div>'
            }
          </div>
        </article>
      </section>

      <section class="inicio-side-grid">
        <article class="inicio-panel-card">
          <header>
            ${renderKicker('Radar rapido', 'radar')}
            <p>Sinais mais importantes para decisao.</p>
          </header>
          <ul class="radar-list clean">
            <li><span>Clientes novos</span><b>${number(clientes.novosMes)}</b></li>
            <li><span>Ticket medio</span><b>${money(pedidos.ticketMedio || 0)}</b></li>
            <li><span>Margem de lucro</span><b>${pct(margemPedidosMes)}</b></li>
            <li><span>Compras no mes</span><b>${number(compras.totalMes || 0)}</b></li>
            <li><span>Uptime medio</span><b>${pct(equipamentos.uptimeMedioPercent || 0)}</b></li>
          </ul>
        </article>

        <article class="inicio-panel-card">
          <header>
            ${renderKicker('Orçamentos', 'orcamentos')}
            <p>Índices do mês com quantidade e valores.</p>
          </header>
          <div class="two-col-stats orcamentos-indices-grid">
            <div><small>Qtd no mês</small><strong>${number(orcamentos.quantidadeMes || 0)}</strong></div>
            <div><small>Valor no mês</small><strong>${money(orcamentos.valorMes || 0)}</strong></div>
            <div><small>Qtd aprovados</small><strong>${number(orcamentos.aprovadosMes || 0)}</strong></div>
            <div><small>Valor aprovados</small><strong>${money(orcamentos.valorAprovadosMes || 0)}</strong></div>
            <div><small>Qtd vencidos</small><strong>${number(orcamentos.vencidosMes || 0)}</strong></div>
            <div><small>Valor vencidos</small><strong>${money(orcamentos.valorVencidosMes || 0)}</strong></div>
          </div>
        </article>

        <article class="inicio-panel-card">
          <header>
            ${renderKicker('Materiais em estoque', 'materiais')}
            <p>Indicadores de atencao para reposicao e consumo.</p>
          </header>
          <div class="two-col-stats materiais-indices-grid">
            <div><small>Baixo estoque</small><strong>${number(indicadoresMateriais.baixaEstoqueQtd || 0)}</strong></div>
            <div><small>Material mais utilizado</small><strong>${indicadoresMateriais.materialMaisUtilizado || '-'}</strong></div>
            <div><small>Volume mais usado</small><strong>${number(indicadoresMateriais.volumeMaisUsado || 0)} ${indicadoresMateriais.volumeMaisUsadoUnidade || 'un'}</strong></div>
            <div><small>Fornecedor mais usado</small><strong>${indicadoresMateriais.fornecedorMaisUsado || '-'}</strong></div>
          </div>
        </article>

        <article class="inicio-list-card">
          <header>
            ${renderKicker('Top produtos', 'top-produtos')}
            <p>Maior volume de saida.</p>
          </header>
          <div class="list-rows">
            ${
              produtosMaisVendidos.length
                ? produtosMaisVendidos
                    .map(
                      (item, index) => `
                        <div class="list-row compact">
                          <span class="rank">${index + 1}</span>
                          <div>
                            <strong>${item.nome}</strong>
                            <small>${number(item.quantidade)} unidades</small>
                          </div>
                          <b>${money(item.valor)}</b>
                        </div>
                      `
                    )
                    .join('')
                : '<div class="empty-box">Sem vendas registradas.</div>'
            }
          </div>
        </article>
      </section>
    </section>
  `;
}
