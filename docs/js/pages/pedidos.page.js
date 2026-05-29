function deriveOrderMargin(order) {
  const custoTotal = Number(order?.custos?.custoTotal || 0);
  const valorFinal = Number(order?.valor || 0);
  if (custoTotal <= 0 || valorFinal <= 0) return '';
  return (((valorFinal - custoTotal) / custoTotal) * 100).toFixed(2);
}

function getOrderPhotos(order) {
  const photos = Array.isArray(order?.fotosPedido) ? order.fotosPedido.filter(Boolean) : [];
  if (photos.length) return photos;
  return order?.fotoPedido ? [order.fotoPedido] : [];
}

function getOrderItems(order) {
  if (Array.isArray(order?.itens) && order.itens.length) {
    return order.itens;
  }

  if (!order) {
    return [
      {
        produto: null,
        quantidade: 1,
        impressora: null,
        material: 'PLA',
        cor: '',
        pesoEstimado: 0,
        tempoImpressao: 0,
        valor: 0,
        filamento: null,
        custos: {},
        observacoes: '',
      },
    ];
  }

  return [
    {
      produto: order?.produto || null,
      quantidade: order?.quantidade || 1,
      impressora: order?.impressora || null,
      material: order?.material || 'PLA',
      cor: order?.cor || '',
      pesoEstimado: order?.pesoEstimado || 0,
      tempoImpressao: order?.tempoImpressao || 0,
      valor: order?.valor || 0,
      filamento: order?.filamento || null,
      custos: order?.custos || {},
      observacoes: order?.observacoes || '',
    },
  ];
}

function getOrderTitle(order, escapeHtml) {
  const items = getOrderItems(order);
  const firstLabel = escapeHtml(items[0]?.produto?.nome || order?.produto?.nome || 'Sem produto');
  if (items.length <= 1) return firstLabel;
  return `${firstLabel} +${items.length - 1} item${items.length - 1 > 1 ? 's' : ''}`;
}

function renderCostSummary({ money, number, consumoW, custoKwh, filamentoKg, custoFilamento, consumoPeriodoKwh, custoEnergia, custoTotal }) {
  return `
    <section class="pedido-cost-card">
      <h4>Calculadora de Custos:</h4>
      <ul>
        <li><span>Custo material por kg:</span><strong data-order-summary="filamentoKg">${money(filamentoKg)}</strong></li>
        <li><span>Custo material consumido (g):</span><strong data-order-summary="custoFilamento">${money(custoFilamento)}</strong></li>
        <li><span>Consumo do equipamento:</span><strong data-order-summary="consumoW">${number(consumoW)} W</strong></li>
        <li><span>Valor do kWh:</span><strong data-order-summary="custoKwh">${money(custoKwh)}</strong></li>
        <li><span>Consumo no periodo:</span><strong data-order-summary="consumoPeriodoKwh">${number(consumoPeriodoKwh)} kWh</strong></li>
        <li><span>Custo de energia:</span><strong data-order-summary="custoEnergia">${money(custoEnergia)}</strong></li>
        <li class="total"><span>Custo total estimado:</span><strong data-order-summary="custoTotal">${money(custoTotal)}</strong></li>
      </ul>
    </section>
  `;
}

function renderPhotoGallery(order, escapeHtml) {
  const photos = getOrderPhotos(order);
  if (!photos.length) {
    return '<p class="form-hint">Sem imagens salvas para este pedido.</p>';
  }

  return `
    <div class="pedido-photo-gallery">
      ${photos
        .map(
          (photo, index) => `
            <figure class="pedido-photo-item">
              <img src="${escapeHtml(photo)}" alt="Foto ${index + 1} do projeto" />
            </figure>
          `
        )
        .join('')}
    </div>
  `;
}

function renderPedidoItemForm({ item, index, appState, escapeHtml, money, equipamentos, materiaisDisponiveis }) {
  const quantidade = Number(item?.quantidade || 1);
  const pesoEstimado = Number(item?.pesoEstimado || 0);
  const tempoImpressao = Number(item?.tempoImpressao || 0);
  const valorFinal = Number(item?.valor || 0);
  const margemLucro = deriveOrderMargin(item);
  const lucroReal = Number(item?.custos?.lucroReal || valorFinal - Number(item?.custos?.custoTotal || 0) || 0);

  return `
    <section class="pedido-item-card" data-order-item data-order-item-index="${index}">
      <div class="pedido-item-head">
        <div>
          <strong>Item ${index + 1}</strong>
          <span>Produto, quantidade e dados de producao.</span>
        </div>
        <button type="button" class="ghost-btn tiny-btn" data-remove-order-item ${index === 0 ? 'disabled' : ''}>Remover</button>
      </div>

      <div class="pedido-form-grid two">
        <div>
          <label>Produto *</label>
          <select name="itemProduto_${index}" data-order-item-field="produto" required>
            <option value="">Selecione</option>
            ${appState.produtos
              .map(
                (produto) =>
                  `<option value="${produto._id}" ${String(item?.produto?._id || item?.produto || '') === String(produto._id) ? 'selected' : ''}>${escapeHtml(produto.nome)}</option>`
              )
              .join('')}
          </select>
        </div>
        <div>
          <label>Quantidade *</label>
          <input name="itemQuantidade_${index}" data-order-item-field="quantidade" type="number" min="1" step="1" value="${quantidade}" required />
        </div>
      </div>

      <div class="pedido-form-grid two">
        <div>
          <label>Equipamento</label>
          <select name="itemImpressora_${index}" data-order-item-field="impressora">
            <option value="">Selecione</option>
            ${equipamentos
              .map(
                (equipamento) =>
                  `<option value="${equipamento._id}" ${String(item?.impressora?._id || item?.impressora || '') === String(equipamento._id) ? 'selected' : ''}>${escapeHtml(equipamento.nome || equipamento.modelo || equipamento.marca || 'Equipamento')}</option>`
              )
              .join('')}
          </select>
        </div>
        <div>
          <label>Material *</label>
          <select name="itemMaterial_${index}" data-order-item-field="material" required>
            <option value="">Selecione</option>
            ${materiaisDisponiveis
              .map(
                (material) =>
                  `<option value="${escapeHtml(material)}" ${String(item?.material || '') === material ? 'selected' : ''}>${escapeHtml(material)}</option>`
              )
              .join('')}
          </select>
        </div>
      </div>

      <div class="pedido-form-grid two">
        <div>
          <label>Peso estimado (g) *</label>
          <input name="itemPesoEstimado_${index}" data-order-item-field="pesoEstimado" type="number" min="0" value="${pesoEstimado || ''}" required />
        </div>
        <div>
          <label>Tempo de impressao (min) *</label>
          <input name="itemTempoImpressao_${index}" data-order-item-field="tempoImpressao" type="number" min="0" value="${tempoImpressao || ''}" required />
        </div>
      </div>

      <div class="pedido-form-grid three balanced">
        <div>
          <label>Margem de Lucro (%)</label>
          <input name="itemMargemLucro_${index}" data-order-item-field="margemLucro" type="number" min="0" step="0.01" value="${escapeHtml(margemLucro)}" />
        </div>
        <div>
          <label>Valor a Cobrar *</label>
          <input name="itemValor_${index}" data-order-item-field="valor" type="number" min="0" step="0.01" value="${valorFinal || ''}" required />
        </div>
        <div>
          <label>Lucro</label>
          <input data-order-item-lucro value="${money(lucroReal)}" readonly />
        </div>
      </div>
    </section>
  `;
}

function renderPedidoForm({
  formId,
  submitLabel,
  order,
  appState,
  escapeHtml,
  money,
  number,
  equipamentos,
  materiaisDisponiveis,
  showCancelButton = false,
}) {
  const itens = getOrderItems(order);
  const custoKwh = Number(order?.custos?.custoKwh || itens[0]?.custos?.custoKwh || 0.95);
  const energiaKwh = Number(order?.custos?.energiaKwh || itens.reduce((sum, item) => sum + Number(item?.custos?.energiaKwh || 0), 0) || 0.8);
  const consumoW = Number((energiaKwh * 1000).toFixed(0));
  const filamentoKg = Number(order?.custos?.filamentoKg || itens.reduce((sum, item) => sum + Number(item?.custos?.filamentoKg || 0), 0) || 0);
  const custoFilamento = Number(order?.custos?.custoFilamento || itens.reduce((sum, item) => sum + Number(item?.custos?.custoFilamento || 0), 0) || 0);
  const consumoPeriodoKwh = Number(itens.reduce((sum, item) => sum + ((Number(item?.tempoImpressao || 0) / 60) * Number(item?.custos?.energiaKwh || 0)), 0).toFixed(3));
  const custoEnergia = Number(order?.custos?.custoEnergia || itens.reduce((sum, item) => sum + Number(item?.custos?.custoEnergia || 0), 0) || 0);
  const custoTotal = Number(order?.custos?.custoTotal || itens.reduce((sum, item) => sum + Number(item?.custos?.custoTotal || 0), 0) || 0);

  return `
    <form id="${formId}" class="pedido-form">
      <div class="pedido-form-grid one">
        <div>
          <label>Cliente *</label>
          <select name="cliente" required>
            <option value="">Selecione</option>
            ${appState.clientes
              .map(
                (item) =>
                  `<option value="${item._id}" ${order?.cliente?._id === item._id ? 'selected' : ''}>${escapeHtml(item.nome)}</option>`
              )
              .join('')}
          </select>
        </div>
      </div>

      <div class="pedido-items-stack" data-order-items-list>
        ${itens
          .map((item, index) => renderPedidoItemForm({ item, index, appState, escapeHtml, money, equipamentos, materiaisDisponiveis }))
          .join('')}
      </div>

      <div class="pedido-form-grid one">
        <div class="pedido-items-actions">
          <button type="button" class="ghost-btn" data-add-order-item>+ Adicionar produto</button>
          <small>Cada item tera produto, quantidade, material, tempo, valor e lucro proprios.</small>
        </div>
      </div>

      <div class="pedido-form-grid one">
        <div>
          <label>Fotos do projeto (maximo 5)</label>
          <input name="fotoPedidoArquivos" type="file" accept="image/*" multiple />
          <small>Selecione ate 5 imagens.</small>
        </div>
      </div>

      ${order ? `<div class="pedido-form-grid one"><div><label>Imagens atuais</label>${renderPhotoGallery(order, escapeHtml)}</div></div>` : ''}

      ${renderCostSummary({
        money,
        number,
        consumoW,
        custoKwh,
        filamentoKg,
        custoFilamento,
        consumoPeriodoKwh,
        custoEnergia,
        custoTotal,
      })}

      <div class="pedido-form-actions ${showCancelButton ? 'with-cancel' : ''}">
        <button type="submit" class="primary-btn">${submitLabel}</button>
        ${showCancelButton ? '<button type="button" id="cancelEditBtn" class="ghost-btn">Cancelar edicao</button>' : ''}
      </div>
    </form>
  `;
}

export function renderPedidosPage(ctx) {
  const {
    appState,
    laneConfig,
    statusToLane,
    escapeHtml,
    money,
    number,
    safeDate,
    getOrderCode,
  } = ctx;

  const lanes = laneConfig();
  const busca = appState.ui.pedidosBusca.toLowerCase();
  const pedidosValidos = appState.pedidos.filter((pedido) => pedido.status !== 'orcamento');

  const dataFiltro = appState.ui.pedidosDataFiltro || 'mes_atual';
  const toDateStart = (value) => (value ? new Date(`${value}T00:00:00`) : null);
  const toDateEnd = (value) => (value ? new Date(`${value}T23:59:59.999`) : null);

  const now = new Date();
  const inicioMesAtual = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const fimMesAtual = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const inicioMesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
  const fimMesAnterior = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const pedidosNoPeriodo = pedidosValidos.filter((pedido) => {
    const dataPedido = new Date(pedido.createdAt || pedido.updatedAt || pedido.dataEntregaPrevista || Date.now());
    if (Number.isNaN(dataPedido.getTime())) return true;

    if (dataFiltro === 'mes_atual') {
      return dataPedido >= inicioMesAtual && dataPedido <= fimMesAtual;
    }

    if (dataFiltro === 'mes_anterior') {
      return dataPedido >= inicioMesAnterior && dataPedido <= fimMesAnterior;
    }

    if (dataFiltro === 'personalizado') {
      const inicioPersonalizado = toDateStart(appState.ui.pedidosDataInicio);
      const fimPersonalizado = toDateEnd(appState.ui.pedidosDataFim);
      const afterStart = !inicioPersonalizado || dataPedido >= inicioPersonalizado;
      const beforeEnd = !fimPersonalizado || dataPedido <= fimPersonalizado;
      return afterStart && beforeEnd;
    }

    return true;
  });

  const pedidosFiltrados = pedidosNoPeriodo.filter((pedido) => {
    const items = getOrderItems(pedido);
    const texto = `${pedido?.cliente?.nome || ''} ${items.map((item) => item?.produto?.nome || '').join(' ')} ${items
      .map((item) => item?.material || '')
      .join(' ')} ${pedido?.status || ''}`.toLowerCase();
    return texto.includes(busca);
  });

  const pedidosAtivos = pedidosFiltrados.filter((item) => item.status !== 'entregue');
  const pedidosFinalizados = pedidosFiltrados.filter((item) => item.status === 'entregue');
  const pedidoEmEdicao = appState.pedidos.find((item) => item._id === appState.ui.pedidoEmEdicaoId) || null;
  const equipamentos = appState.impressoras || [];
  const materiais = appState.materiais || [];
  const materiaisDisponiveis = Array.from(
    new Map(
      materiais
        .map((item) => (item.descricao || item.tipo || item.material || '').trim())
        .filter(Boolean)
        .map((nome) => [nome.toLowerCase(), nome])
    ).values()
  );

  const totalPedidos = pedidosNoPeriodo.length;
  const faturamentoPedidos = pedidosNoPeriodo.reduce((acc, item) => acc + Number(item.valor || 0), 0);
  const lucroPedidos = pedidosNoPeriodo.reduce((acc, item) => acc + Number(item?.custos?.lucroReal || 0), 0);
  const pedidosEntregues = pedidosNoPeriodo.filter((item) => item.status === 'entregue').length;

  const source =
    appState.ui.pedidosFiltro === 'finalizados'
      ? pedidosFinalizados
      : appState.ui.pedidosFiltro === 'ativos'
        ? pedidosAtivos
        : pedidosFiltrados;

  return `
    <section>
      <header class="page-header">
        <div>
          <h2>Pedidos de Clientes</h2>
          <p>Gerencie pedidos e acompanhe o status de producao.</p>
        </div>
        <button id="btnNovoPedido" class="primary-btn">+ Novo Pedido</button>
      </header>

      <div class="sales-kpi-grid">
        <article class="sales-kpi"><h4>${number(totalPedidos)}</h4><p>Pedidos</p></article>
        <article class="sales-kpi"><h4>${money(faturamentoPedidos)}</h4><p>Faturamento</p></article>
        <article class="sales-kpi"><h4>${money(lucroPedidos)}</h4><p>Lucro</p></article>
        <article class="sales-kpi"><h4>${number(pedidosEntregues)}</h4><p>Pedidos Entregues</p></article>
      </div>

      <div class="orders-toolbar">
        <input id="pedidosBusca" class="search-input" placeholder="Buscar pedidos..." value="${escapeHtml(
          appState.ui.pedidosBusca
        )}" />
        <button class="chip ${appState.ui.pedidosFiltro === 'todos' ? 'active' : ''}" data-filter="todos">Todos (${pedidosFiltrados.length})</button>
        <button class="chip ${appState.ui.pedidosFiltro === 'ativos' ? 'active' : ''}" data-filter="ativos">Ativos (${pedidosAtivos.length})</button>
        <button class="chip ${appState.ui.pedidosFiltro === 'finalizados' ? 'active' : ''}" data-filter="finalizados">Finalizados (${pedidosFinalizados.length})</button>
        <button class="chip ${dataFiltro === 'mes_atual' ? 'active' : ''}" data-pedidos-data-filtro="mes_atual">Mês atual</button>
        <button class="chip ${dataFiltro === 'mes_anterior' ? 'active' : ''}" data-pedidos-data-filtro="mes_anterior">Mês anterior</button>
        <button class="chip ${dataFiltro === 'personalizado' ? 'active' : ''}" data-pedidos-data-filtro="personalizado">Personalizado</button>
        ${
          dataFiltro === 'personalizado'
            ? `<input id="pedidosDataInicio" class="search-input date-input" type="date" value="${escapeHtml(appState.ui.pedidosDataInicio || '')}" />
               <input id="pedidosDataFim" class="search-input date-input" type="date" value="${escapeHtml(appState.ui.pedidosDataFim || '')}" />`
            : ''
        }
      </div>

      <div class="kanban-wrap">
        ${lanes
          .map((lane) => {
            const items = source.filter((pedido) => (pedido.lane || statusToLane(pedido.status)) === lane.key);

            return `
              <article class="kanban-col" data-drop-lane="${lane.key}">
                <header class="kanban-head ${lane.color}">
                  <span>${lane.label}</span>
                  <b>${items.length}</b>
                </header>
                <div class="kanban-body">
                  ${
                    items.length
                      ? items
                          .map((pedido) => {
                            return `
                              <div class="order-card" draggable="true" data-drag-order-id="${pedido._id}">
                                <div class="order-card-title-row">
                                  <h4>${getOrderTitle(pedido, escapeHtml)}</h4>
                                  <span class="order-card-qty">Qtd: ${number(pedido.quantidade || 1)}</span>
                                </div>
                                <p class="order-code">Pedido: ${escapeHtml(getOrderCode(pedido))}</p>
                                <p>Cliente: ${escapeHtml(pedido.cliente?.nome || 'Sem cliente')}</p>
                                <p>Material: ${escapeHtml(pedido.material || '-')}</p>
                                <p>Data do pedido: ${safeDate(pedido.createdAt || pedido.updatedAt)}</p>
                                <p>Valor: ${money(pedido.valor)} | Lucro: ${money(pedido?.custos?.lucroReal)}</p>
                                <p>Filamento: ${escapeHtml(pedido?.filamento?.tipo || '-')} | Equipamento: ${escapeHtml(
                              pedido?.impressora?.nome || pedido?.impressora?.modelo || '-'
                            )}</p>
                                <div class="order-card-actions">
                                  <button class="icon-btn" data-print-order="${pedido._id}" title="Imprimir / PDF">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                      <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                      <rect x="6" y="14" width="12" height="8"></rect>
                                    </svg>
                                  </button>
                                  <button class="icon-btn edit-btn" data-edit-order="${pedido._id}" title="Editar">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                  </button>
                                  <button class="icon-btn delete-btn" data-delete-order="${pedido._id}" title="Excluir">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                      <polyline points="3 6 5 6 21 6"></polyline>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                      <line x1="10" y1="11" x2="10" y2="17"></line>
                                      <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            `;
                          })
                          .join('')
                      : '<div class="empty-col">Nenhum pedido</div>'
                  }
                </div>
              </article>
            `;
          })
          .join('')}
      </div>

      ${
        appState.ui.mostrarNovoPedido || (appState.ui.mostrarEditarPedido && pedidoEmEdicao)
          ? `<div class="pedido-modal-backdrop" id="pedidoModalBackdrop">
              <aside class="pedido-drawer" role="dialog" aria-modal="true">
                <header>
                  <h3>${appState.ui.mostrarEditarPedido ? 'Editar pedido' : 'Novo pedido'}</h3>
                  <button id="btnClosePedidoModal" type="button">×</button>
                </header>
                ${
                  appState.ui.mostrarEditarPedido && pedidoEmEdicao
                    ? renderPedidoForm({
                        formId: 'editOrderForm',
                        submitLabel: 'Salvar Alteracoes',
                        order: pedidoEmEdicao,
                        appState,
                        escapeHtml,
                        money,
                        number,
                        equipamentos,
                        materiaisDisponiveis,
                        showCancelButton: true,
                      })
                    : renderPedidoForm({
                        formId: 'orderForm',
                        submitLabel: 'Salvar Pedido',
                        order: null,
                        appState,
                        escapeHtml,
                        money,
                        number,
                        equipamentos,
                        materiaisDisponiveis,
                      })
                }
              </aside>
            </div>`
          : ''
      }
    </section>
  `;
}
