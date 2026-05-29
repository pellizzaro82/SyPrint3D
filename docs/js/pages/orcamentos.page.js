export function renderOrcamentosPage(ctx) {
  const { appState, escapeHtml, money, number, safeDate, getOrderCode } = ctx;

  const getOrcamentoItems = (orcamento) => {
    if (Array.isArray(orcamento?.itens) && orcamento.itens.length) {
      return orcamento.itens;
    }

    if (!orcamento) {
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
          observacoes: '',
        },
      ];
    }

    return [
      {
        produto: orcamento?.produto || null,
        quantidade: orcamento?.quantidade || 1,
        impressora: orcamento?.impressora || null,
        material: orcamento?.material || 'PLA',
        cor: orcamento?.cor || '',
        pesoEstimado: orcamento?.pesoEstimado || 0,
        tempoImpressao: orcamento?.tempoImpressao || 0,
        valor: orcamento?.valor || 0,
        observacoes: orcamento?.observacoes || '',
      },
    ];
  };

  const getOrcamentoTitle = (orcamento) => {
    const items = getOrcamentoItems(orcamento);
    const firstLabel = escapeHtml(items[0]?.produto?.nome || orcamento?.produto?.nome || 'Sem produto');
    if (items.length <= 1) return firstLabel;
    return `${firstLabel} +${items.length - 1} item${items.length - 1 > 1 ? 's' : ''}`;
  };

  const renderOrcamentoItemForm = (item, index) => `
    <section class="orcamento-item-card" data-quote-item data-quote-item-index="${index}">
      <div class="orcamento-item-head">
        <div>
          <strong>Item ${index + 1}</strong>
          <span>Produto e dados do item do orcamento.</span>
        </div>
        <button type="button" class="ghost-btn tiny-btn" data-remove-quote-item ${index === 0 ? 'disabled' : ''}>Remover</button>
      </div>

      <div class="orcamento-form-grid two">
        <div>
          <label>Produto *</label>
          <select name="quoteItemProduto_${index}" data-quote-item-field="produto" required>
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
          <input name="quoteItemQuantidade_${index}" data-quote-item-field="quantidade" type="number" min="1" step="1" value="${Number(item?.quantidade || 1)}" required />
        </div>
      </div>

      <div class="orcamento-form-grid two">
        <div>
          <label>Equipamento</label>
          <select name="quoteItemImpressora_${index}" data-quote-item-field="impressora">
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
          <input name="quoteItemMaterial_${index}" data-quote-item-field="material" value="${escapeHtml(item?.material || 'PLA')}" required />
        </div>
      </div>

      <div class="orcamento-form-grid two">
        <div>
          <label>Peso estimado (g) *</label>
          <input name="quoteItemPeso_${index}" data-quote-item-field="pesoEstimado" type="number" min="0" value="${Number(item?.pesoEstimado || 0)}" required />
        </div>
        <div>
          <label>Tempo (min) *</label>
          <input name="quoteItemTempo_${index}" data-quote-item-field="tempoImpressao" type="number" min="0" value="${Number(item?.tempoImpressao || 0)}" required />
        </div>
      </div>

      <div class="orcamento-form-grid one">
        <div>
          <label>Valor final (R$) *</label>
          <input name="quoteItemValor_${index}" data-quote-item-field="valor" type="number" step="0.01" min="0" value="${Number(item?.valor || 0)}" required />
        </div>
      </div>
    </section>
  `;

  const pedidosBase = appState.orcamentos.filter((item) => ['orcamento', 'aprovado'].includes(item.status));
  const total = pedidosBase.length;
  const busca = (appState.ui.orcamentosBusca || '').toLowerCase();
  const filtro = appState.ui.orcamentosFiltro || 'todos';
  const orcamentoEmEdicao = pedidosBase.find((item) => item._id === appState.ui.orcamentoEmEdicaoId) || null;
  const modalTitulo = orcamentoEmEdicao ? 'Editar orcamento' : 'Novo orcamento';
  const equipamentos = appState.impressoras || [];

  const filtrados = pedidosBase.filter((item) => {
    const items = getOrcamentoItems(item);
    const texto = `${item?.cliente?.nome || ''} ${items.map((entry) => entry?.produto?.nome || '').join(' ')} ${items.map((entry) => entry?.material || '').join(' ')}`.toLowerCase();
    const matchBusca = texto.includes(busca);

    if (filtro === 'pendentes') {
      return matchBusca && item.status === 'orcamento';
    }
    if (filtro === 'aprovados') {
      return matchBusca && item.status === 'aprovado';
    }

    return matchBusca;
  });

  const countPendentes = pedidosBase.filter((item) => item.status === 'orcamento').length;
  const countAprovados = pedidosBase.filter((item) => item.status === 'aprovado').length;

  const toInputDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  };

  const linhas = filtrados
    .map((item) => {
      const expiraEm = item.dataEntregaPrevista ? new Date(item.dataEntregaPrevista) : null;
      const vencido = expiraEm ? expiraEm.getTime() < Date.now() : false;

      return `
        <article class="orcamento-row">
          <div class="orcamento-col orcamento-col-item">
            <h4>${getOrcamentoTitle(item)}</h4>
            <p>${escapeHtml(item?.cliente?.nome || 'Sem cliente')} · ${escapeHtml(getOrderCode(item))}</p>
          </div>
          <div class="orcamento-col">${escapeHtml(item.material || '-')}</div>
          <div class="orcamento-col">${number(item.pesoEstimado)} g</div>
          <div class="orcamento-col">${number(item.tempoImpressao)} min</div>
          <div class="orcamento-col orcamento-col-valor">${money(item.valor)}</div>
          <div class="orcamento-col">${safeDate(item.dataEntregaPrevista)}</div>
          <div class="orcamento-col"><span class="${item.status === 'aprovado' ? 'status-badge ativo' : vencido ? 'status-badge inativo' : 'status-badge pendente'}">${
            item.status === 'aprovado' ? 'Aprovado' : vencido ? 'Vencido' : 'Pendente'
          }</span></div>
          <div class="orcamento-col orcamento-col-acoes">
            <button class="icon-btn" data-print-orcamento="${item._id}" title="Imprimir / PDF">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
            </button>
            <button class="icon-btn edit-btn" data-edit-orcamento="${item._id}" title="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            ${
              item.status === 'orcamento'
                ? `<button class="icon-btn" data-approve-orcamento="${item._id}" title="Aprovar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </button>`
                : ''
            }
            <button class="icon-btn delete-btn" data-delete-orcamento="${item._id}" title="Excluir">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </article>
      `;
    })
    .join('');

  return `
    <section>
      <header class="orcamentos-head">
        <div>
          <h2>Orcamentos <span class="orcamentos-count">${total} registrados</span></h2>
          <p>Monte propostas comerciais e gere PDF para enviar ao cliente.</p>
        </div>
        <div class="orcamentos-actions">
          <button class="ghost-btn" type="button">Ajuda</button>
          <button id="btnNovoOrcamento" class="primary-btn" type="button">+ Novo Orcamento</button>
        </div>
      </header>

      <div class="orcamentos-toolbar">
        <input id="orcamentosBusca" class="search-input" placeholder="Buscar orcamentos..." value="${escapeHtml(appState.ui.orcamentosBusca || '')}" />
        <button class="chip ${filtro === 'todos' ? 'active' : ''}" data-filter-orcamento="todos">Todos (${pedidosBase.length})</button>
        <button class="chip ${filtro === 'pendentes' ? 'active' : ''}" data-filter-orcamento="pendentes">Pendentes (${countPendentes})</button>
        <button class="chip ${filtro === 'aprovados' ? 'active' : ''}" data-filter-orcamento="aprovados">Aprovados (${countAprovados})</button>
      </div>

      <section class="orcamentos-content">
        ${
          filtrados.length
            ? `<div class="orcamentos-list">
                <div class="orcamentos-list-head">
                  <span>Item</span>
                  <span>Material</span>
                  <span>Peso</span>
                  <span>Tempo</span>
                  <span>Valor</span>
                  <span>Validade</span>
                  <span>Status</span>
                  <span>Acoes</span>
                </div>
                ${linhas}
              </div>`
            : `<div class="orcamentos-empty">
                <div class="orcamentos-empty-icon">◻</div>
                <h3>Nenhum orcamento encontrado</h3>
                <p>Crie seu primeiro orcamento para enviar ao cliente.</p>
                <button id="btnNovoOrcamentoEmpty" class="primary-btn" type="button">+ Novo Orcamento</button>
              </div>`
        }
      </section>

      ${
        appState.ui.mostrarNovoOrcamento
          ? `<div class="orcamento-modal-backdrop" id="orcamentoModalBackdrop">
              <aside class="orcamento-drawer" role="dialog" aria-modal="true">
                <header>
                  <h3>${modalTitulo}</h3>
                  <button id="btnCloseOrcamentoModal" type="button">×</button>
                </header>
                <form id="orcamentoForm" class="orcamento-form">
                  <div class="orcamento-form-grid one">
                    <div>
                      <label>Cliente *</label>
                      <select name="cliente" required>
                        <option value="">Selecione</option>
                        ${appState.clientes
                          .map(
                            (cliente) =>
                              `<option value="${cliente._id}" ${orcamentoEmEdicao?.cliente?._id === cliente._id ? 'selected' : ''}>${escapeHtml(cliente.nome)}</option>`
                          )
                          .join('')}
                      </select>
                    </div>
                  </div>

                  <div class="orcamento-items-stack" data-quote-items-list>
                    ${getOrcamentoItems(orcamentoEmEdicao)
                      .map((item, index) => renderOrcamentoItemForm(item, index))
                      .join('')}
                  </div>

                  <div class="orcamento-form-grid one">
                    <div class="orcamento-items-actions">
                      <button type="button" class="ghost-btn" data-add-quote-item>+ Adicionar produto</button>
                      <small>Monte um orcamento com varios produtos no mesmo documento.</small>
                    </div>
                  </div>

                  <div class="orcamento-form-grid two">
                    <div>
                      <label>Validade do orcamento</label>
                      <input name="dataEntregaPrevista" type="date" value="${toInputDate(orcamentoEmEdicao?.dataEntregaPrevista)}" />
                    </div>
                    <div>
                      <label>Status</label>
                      <select name="status">
                        <option value="orcamento" ${orcamentoEmEdicao?.status === 'aprovado' ? '' : 'selected'}>Pendente</option>
                        <option value="aprovado" ${orcamentoEmEdicao?.status === 'aprovado' ? 'selected' : ''}>Aprovado</option>
                      </select>
                    </div>
                  </div>

                  <div class="orcamento-form-grid one">
                    <div>
                      <label>Foto do projeto (para anexar)</label>
                      <input name="fotoPedidoArquivo" type="file" accept="image/*" />
                    </div>
                  </div>

                  <div class="orcamento-form-grid one">
                    <div>
                      <label>Observacoes</label>
                      <textarea name="observacoes" placeholder="Detalhes para o cliente...">${escapeHtml(orcamentoEmEdicao?.observacoes || '')}</textarea>
                    </div>
                  </div>

                  <button type="submit" class="primary-btn">${orcamentoEmEdicao ? 'Salvar Alteracoes' : 'Salvar Orcamento'}</button>
                  ${orcamentoEmEdicao ? '<button type="button" id="cancelOrcamentoEdit" class="ghost-btn">Cancelar edicao</button>' : ''}
                </form>
              </aside>
            </div>`
          : ''
      }
    </section>
  `;
}
