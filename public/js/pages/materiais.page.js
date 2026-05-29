export function renderMateriaisPage(ctx) {
  const { appState, escapeHtml, number, money, safeDate } = ctx;
  const total = appState.materiais.length;
  const busca = (appState.ui.materiaisBusca || '').toLowerCase();
  const itemEmEdicao = appState.materiais.find((item) => item._id === appState.ui.filamentoEmEdicaoId) || null;
  const modalTitulo = itemEmEdicao ? 'Editar material' : 'Novo material';

  const toInputDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  };

  const filtrados = appState.materiais.filter((item) => {
    const descricao = item.descricao || item.tipo || '';
    const tipoMaterial = item.tipoMaterial || item.material || '';
    const texto = `${descricao} ${tipoMaterial} ${item.marca || ''} ${item.fornecedor || ''}`.toLowerCase();
    const quantidadeDisponivel = Number(item.quantidadeDisponivel ?? item.estoqueAtual ?? 0);
    const low = quantidadeDisponivel <= Number(item.estoqueMinimo || 0);
    const matchBusca = texto.includes(busca);
    const matchEstoque = !appState.ui.materiaisSomenteEstoqueBaixo || low;
    return matchBusca && matchEstoque;
  });

  const linhas = filtrados
    .map((item) => {
      const descricao = item.descricao || item.tipo;
      const tipoMaterial = item.tipoMaterial || item.material;
      const unidadeMedida = item.unidadeMedida || 'g';
      const quantidadeDisponivel = Number(item.quantidadeDisponivel ?? item.estoqueAtual ?? 0);
      const precoCusto = Number(item.precoCusto ?? item.precoPorKg ?? 0);
      const low = quantidadeDisponivel <= Number(item.estoqueMinimo || 0);
      return `
        <article class="estoque-row">
          <div class="estoque-col estoque-col-item">
            <h4>${escapeHtml(descricao)}</h4>
            <p>${escapeHtml(tipoMaterial || 'Sem tipo')} · ${number(item.peso)} ${escapeHtml(unidadeMedida)}</p>
          </div>
          <div class="estoque-col">${escapeHtml(item.marca || '-')}</div>
          <div class="estoque-col">${escapeHtml(item.fornecedor || '-')}</div>
          <div class="estoque-col">${money(precoCusto)}</div>
          <div class="estoque-col estoque-col-acoes">
            <button class="icon-btn edit-btn" data-edit-filament="${item._id}" title="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="icon-btn delete-btn" data-delete-filament="${item._id}" title="Excluir">
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
      <header class="estoque-head">
        <div>
          <h2>Materiais <span class="estoque-count">${total} cadastrados</span></h2>
          <p>Cadastro e controle de materiais (filamento e resina).</p>
        </div>
        <div class="estoque-actions-top">
          <button class="ghost-btn" type="button">Ajuda</button>
          <button id="btnNovoFilamento" class="primary-btn" type="button">+ Novo Item</button>
        </div>
      </header>

      <div class="estoque-toolbar">
        <input id="materiaisBusca" class="search-input" placeholder="Buscar item de estoque..." value="${escapeHtml(appState.ui.materiaisBusca || '')}" />
        <button id="btnFiltroEstoqueMateriais" class="chip ${appState.ui.materiaisSomenteEstoqueBaixo ? 'active' : ''}" type="button">Estoque Baixo</button>
      </div>

      <section class="estoque-content">
        ${
          filtrados.length
            ? `<div class="estoque-list">
                <div class="estoque-list-head">
                  <span>Item</span>
                  <span>Marca</span>
                  <span>Fornecedor</span>
                  <span>Preco Custo</span>
                  <span>Acoes</span>
                </div>
                ${linhas}
              </div>`
            : `<div class="estoque-empty">
                <div class="estoque-empty-icon">◻</div>
                <h3>Nenhum item encontrado</h3>
                <p>Comece adicionando seu primeiro material.</p>
                <button id="btnNovoFilamentoEmpty" class="primary-btn" type="button">+ Novo Item</button>
              </div>`
        }
      </section>

      ${
        appState.ui.mostrarNovoFilamento
          ? `<div class="filamento-modal-backdrop" id="filamentoModalBackdrop">
              <aside class="filamento-drawer" role="dialog" aria-modal="true">
                <header>
                  <h3>${modalTitulo}</h3>
                  <button id="btnCloseFilamentoModal" type="button">×</button>
                </header>
                <form id="filamentForm" class="filamento-form">
                  <label>Descricao *</label>
                  <input name="descricao" placeholder="Ex: Resina UV cinza" value="${escapeHtml(itemEmEdicao?.descricao || itemEmEdicao?.tipo || '')}" required />

                  <div class="filamento-form-grid two">
                    <div>
                      <label>Tipo *</label>
                      <select name="tipoMaterial" required>
                        <option value="" ${(itemEmEdicao?.tipoMaterial || itemEmEdicao?.material) ? '' : 'selected'}>Selecione</option>
                        <option value="Filamento" ${(itemEmEdicao?.tipoMaterial || itemEmEdicao?.material) === 'Filamento' ? 'selected' : ''}>Filamento</option>
                        <option value="Resina" ${(itemEmEdicao?.tipoMaterial || itemEmEdicao?.material) === 'Resina' ? 'selected' : ''}>Resina</option>
                      </select>
                    </div>
                    <div>
                      <label>Peso *</label>
                      <input name="peso" type="number" min="0" placeholder="0" value="${Number(itemEmEdicao?.peso || 0)}" required />
                    </div>
                  </div>

                  <div class="filamento-form-grid one">
                    <div>
                      <label>Unidade *</label>
                      <select name="unidadeMedida" required>
                        <option value="g" ${(itemEmEdicao?.unidadeMedida || 'g') === 'g' ? 'selected' : ''}>g</option>
                        <option value="kg" ${(itemEmEdicao?.unidadeMedida || 'g') === 'kg' ? 'selected' : ''}>kg</option>
                        <option value="ml" ${(itemEmEdicao?.unidadeMedida || 'g') === 'ml' ? 'selected' : ''}>ml</option>
                        <option value="L" ${(itemEmEdicao?.unidadeMedida || 'g') === 'L' ? 'selected' : ''}>L</option>
                      </select>
                    </div>
                  </div>

                  <div class="filamento-form-grid two">
                    <div>
                      <label>Marca *</label>
                      <input name="marca" placeholder="Marca" value="${escapeHtml(itemEmEdicao?.marca || '')}" required />
                    </div>
                    <div>
                      <label>Fornecedor</label>
                      <input name="fornecedor" placeholder="Fornecedor" value="${escapeHtml(itemEmEdicao?.fornecedor || '')}" />
                    </div>
                  </div>

                  <div class="filamento-form-grid two">
                    <div>
                      <label>Preco de custo *</label>
                      <input name="precoCusto" type="number" min="0" step="0.01" placeholder="0,00" value="${Number(itemEmEdicao?.precoCusto ?? itemEmEdicao?.precoPorKg ?? 0)}" required />
                    </div>
                    <div>
                      <label>Quantidade disponivel *</label>
                      <input name="quantidadeDisponivel" type="number" min="0" placeholder="0" value="${Number(itemEmEdicao?.quantidadeDisponivel ?? itemEmEdicao?.estoqueAtual ?? 0)}" required />
                    </div>
                  </div>

                  <div class="filamento-form-grid two">
                    <div>
                      <label>Estoque minimo</label>
                      <input name="estoqueMinimo" type="number" min="0" placeholder="0" value="${Number(itemEmEdicao?.estoqueMinimo ?? 0)}" />
                    </div>
                    <div></div>
                  </div>

                  <div class="filamento-form-grid two">
                    <div>
                      <label>Data de compra</label>
                      <input name="dataCompra" type="date" value="${toInputDate(itemEmEdicao?.dataCompra)}" />
                    </div>
                    <div>
                      <label>Validade</label>
                      <input name="validade" type="date" value="${toInputDate(itemEmEdicao?.validade)}" />
                    </div>
                  </div>

                  <button type="submit" class="primary-btn">${itemEmEdicao ? 'Salvar Alteracoes' : 'Salvar Item'}</button>
                  ${itemEmEdicao ? '<button type="button" id="cancelFilamentEdit" class="ghost-btn">Cancelar edicao</button>' : ''}
                </form>
              </aside>
            </div>`
          : ''
      }
    </section>
  `;
}
