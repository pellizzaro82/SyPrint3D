export function renderComprasPage(ctx) {
  const { appState, escapeHtml, money, safeDate, number } = ctx;
  const saidas = appState.financeiro.filter((item) => item.tipo === 'saida');
  const total = saidas.length;
  const busca = (appState.ui.comprasBusca || '').toLowerCase();
  const compraEmEdicao = saidas.find((item) => item._id === appState.ui.compraEmEdicaoId) || null;
  const modalTitulo = compraEmEdicao ? 'Editar compra' : 'Nova compra';

  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

  const filtradas = saidas.filter((item) => {
    const texto = `${item.categoria || ''} ${item.descricao || ''} ${item.metodo || ''} ${item.fornecedor || ''}`.toLowerCase();
    const matchBusca = texto.includes(busca);
    const data = item.data ? new Date(item.data) : null;
    const matchMesAtual = !appState.ui.comprasSomenteMesAtual || (data && data >= inicioMes);
    return matchBusca && matchMesAtual;
  });

  const linhas = filtradas
    .map((item) => {
      const quantidade = Number(item.quantidade || 1);
      const valorUnitario = Number(item.valorUnitario || 0);
      return `
        <article class="compra-row">
          <div class="compra-col compra-col-item">
            <h4>${escapeHtml(item.categoria || 'Sem categoria')}</h4>
            <p>${escapeHtml(item.descricao || 'Sem descricao')}</p>
          </div>
          <div class="compra-col">${escapeHtml(item.fornecedor || '-')}</div>
          <div class="compra-col">${escapeHtml(item.metodo || '-')}</div>
          <div class="compra-col">${number(quantidade)}</div>
          <div class="compra-col">${valorUnitario > 0 ? money(valorUnitario) : '-'}</div>
          <div class="compra-col compra-col-valor">${money(item.valor)}</div>
          <div class="compra-col">${safeDate(item.data)}</div>
          <div class="compra-col compra-col-acoes">
            <button class="icon-btn edit-btn" data-edit-compra="${item._id}" title="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="icon-btn delete-btn" data-delete-compra="${item._id}" title="Excluir">
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

  const toInputDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  };

  return `
    <section>
      <header class="compras-head">
        <div>
          <h2>Compras <span class="compras-count">${total} lancamentos</span></h2>
          <p>Controle de compras, suprimentos e saidas operacionais.</p>
        </div>
        <div class="compras-actions-top">
          <button class="ghost-btn" type="button">Ajuda</button>
          <button id="btnNovaCompra" class="primary-btn" type="button">+ Nova Compra</button>
        </div>
      </header>

      <div class="compras-toolbar">
        <input id="comprasBusca" class="search-input" placeholder="Buscar compras..." value="${escapeHtml(appState.ui.comprasBusca || '')}" />
        <button id="btnFiltroComprasMesAtual" class="chip ${appState.ui.comprasSomenteMesAtual ? 'active' : ''}" type="button">Mes atual</button>
      </div>

      <section class="compras-content">
        ${
          filtradas.length
            ? `<div class="compras-list">
                <div class="compras-list-head">
                  <span>Categoria</span>
                  <span>Fornecedor</span>
                  <span>Metodo</span>
                  <span>Qtd</span>
                  <span>Vlr Unitario</span>
                  <span>Valor</span>
                  <span>Data</span>
                  <span>Acoes</span>
                </div>
                ${linhas}
              </div>`
            : `<div class="compras-empty">
                <div class="compras-empty-icon">◻</div>
                <h3>Nenhuma compra encontrada</h3>
                <p>Comece registrando sua primeira compra.</p>
                <button id="btnNovaCompraEmpty" class="primary-btn" type="button">+ Nova Compra</button>
              </div>`
        }
      </section>

      ${
        appState.ui.mostrarNovaCompra
          ? `<div class="compra-modal-backdrop" id="compraModalBackdrop">
              <aside class="compra-drawer" role="dialog" aria-modal="true">
                <header>
                  <h3>${modalTitulo}</h3>
                  <button id="btnCloseCompraModal" type="button">×</button>
                </header>
                <form id="compraForm" class="compra-form">
                  <label>Categoria *</label>
                  <select name="categoria" required>
                    <option value="" ${compraEmEdicao?.categoria ? '' : 'selected'}>Selecione</option>
                    <option value="Filamento" ${compraEmEdicao?.categoria === 'Filamento' ? 'selected' : ''}>Filamento</option>
                    <option value="Resina" ${compraEmEdicao?.categoria === 'Resina' ? 'selected' : ''}>Resina</option>
                    <option value="Embalagens" ${compraEmEdicao?.categoria === 'Embalagens' ? 'selected' : ''}>Embalagens</option>
                    <option value="Ferramentas" ${compraEmEdicao?.categoria === 'Ferramentas' ? 'selected' : ''}>Ferramentas</option>
                    <option value="Maquina" ${compraEmEdicao?.categoria === 'Maquina' ? 'selected' : ''}>Maquina</option>
                    <option value="Frete" ${compraEmEdicao?.categoria === 'Frete' ? 'selected' : ''}>Frete</option>
                    <option value="Outros" ${compraEmEdicao?.categoria === 'Outros' ? 'selected' : ''}>Outros</option>
                  </select>

                  <label>Descricao</label>
                  <textarea name="descricao" placeholder="Descreva a compra...">${escapeHtml(compraEmEdicao?.descricao || '')}</textarea>

                  <div class="compra-form-grid two">
                    <div>
                      <label>Fornecedor</label>
                      <input name="fornecedor" value="${escapeHtml(compraEmEdicao?.fornecedor || '')}" placeholder="Nome do fornecedor" />
                    </div>
                    <div>
                      <label>Metodo de pagamento</label>
                      <select name="metodo">
                        <option value="" ${compraEmEdicao?.metodo ? '' : 'selected'}>Selecione</option>
                        <option value="PIX" ${compraEmEdicao?.metodo === 'PIX' ? 'selected' : ''}>PIX</option>
                        <option value="Cartao" ${compraEmEdicao?.metodo === 'Cartao' ? 'selected' : ''}>Cartao</option>
                        <option value="Boleto" ${compraEmEdicao?.metodo === 'Boleto' ? 'selected' : ''}>Boleto</option>
                        <option value="Dinheiro" ${compraEmEdicao?.metodo === 'Dinheiro' ? 'selected' : ''}>Dinheiro</option>
                        <option value="Transferencia" ${compraEmEdicao?.metodo === 'Transferencia' ? 'selected' : ''}>Transferencia</option>
                      </select>
                    </div>
                  </div>

                  <div class="compra-form-grid three">
                    <div>
                      <label>Quantidade</label>
                      <input name="quantidade" type="number" min="0" step="1" value="${Number(compraEmEdicao?.quantidade || 1)}" />
                    </div>
                    <div>
                      <label>Valor unitario</label>
                      <input name="valorUnitario" type="number" min="0" step="0.01" value="${Number(compraEmEdicao?.valorUnitario || 0)}" />
                    </div>
                    <div>
                      <label>Valor total *</label>
                      <input name="valor" type="number" min="0" step="0.01" value="${Number(compraEmEdicao?.valor || 0)}" required />
                    </div>
                  </div>

                  <label>Data *</label>
                  <input name="data" type="date" value="${toInputDate(compraEmEdicao?.data)}" required />

                  <button type="submit" class="primary-btn">${compraEmEdicao ? 'Salvar Alteracoes' : 'Salvar Compra'}</button>
                  ${compraEmEdicao ? '<button type="button" id="cancelCompraEdit" class="ghost-btn">Cancelar edicao</button>' : ''}
                </form>
              </aside>
            </div>`
          : ''
      }
    </section>
  `;
}
