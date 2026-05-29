export function renderProdutosPage(ctx) {
  const { appState, escapeHtml, number, money } = ctx;
  const total = appState.produtos.length;
  const busca = (appState.ui.produtosBusca || '').toLowerCase();
  const categoriaSelecionada = appState.ui.produtosCategoria || 'todas';
  const produtoEmEdicao = appState.produtos.find((item) => item._id === appState.ui.produtoEmEdicaoId) || null;
  const modalTitulo = produtoEmEdicao ? 'Editar Produto' : 'Novo Produto';

  const categoriasCatalogo = (appState.outrosCadastros?.categorias || [])
    .map((item) => String(item?.nome || '').trim())
    .filter(Boolean);
  const categoriasProdutos = appState.produtos.map((item) => String(item.categoria || '').trim()).filter(Boolean);
  const categorias = [...new Set([...categoriasCatalogo, ...categoriasProdutos])];

  const filtrados = appState.produtos.filter((item) => {
    const texto = `${item.nome || ''} ${item.categoria || ''} ${item.descricao || ''}`.toLowerCase();
    const matchBusca = texto.includes(busca);
    const matchCategoria = categoriaSelecionada === 'todas' || (item.categoria || '').toLowerCase() === categoriaSelecionada.toLowerCase();
    const estoqueAtual = Number(item.estoqueInicial || 0);
    const estoqueMinimo = Number(item.estoqueMinimo || 5);
    const matchEstoque = !appState.ui.produtosSomenteEstoqueBaixo || estoqueAtual <= estoqueMinimo;
    return matchBusca && matchCategoria && matchEstoque;
  });

  const linhas = filtrados
    .map((item) => {
      const estoqueAtual = Number(item.estoqueInicial || 0);
      const estoqueMinimo = Number(item.estoqueMinimo || 5);
      const baixo = estoqueAtual <= estoqueMinimo;
      return `
        <article class="produto-row">
          <div class="produto-col produto-col-nome">
            <h4>${escapeHtml(item.nome)}</h4>
            <p>${escapeHtml(item.descricao || 'Sem descricao')}</p>
          </div>
          <div class="produto-col produto-col-categoria">${escapeHtml(item.categoria || 'Sem categoria')}</div>
          <div class="produto-col produto-col-preco">${money(item.precoFinal)}</div>
          <div class="produto-col produto-col-estoque">
            <span class="${baixo ? 'estoque-badge baixo' : 'estoque-badge ok'}">${number(estoqueAtual)}</span>
          </div>
          <div class="produto-col produto-col-acoes">
            <button class="icon-btn edit-btn" data-edit-product="${item._id}" title="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="icon-btn delete-btn" data-delete-product="${item._id}" title="Excluir">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
            <button class="icon-btn" data-view-product-image="${item._id}" title="Ver imagem" ${item?.fotos?.[0] ? '' : 'disabled'}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </button>
          </div>
        </article>
      `;
    })
    .join('');

  return `
    <section>
      <header class="produtos-head">
        <div>
          <h2>Produtos <span class="produtos-count">${total} cadastrados</span></h2>
          <p>Gerencie seus produtos acabados para venda</p>
        </div>
        <div class="produtos-actions">
          <button class="ghost-btn" type="button">Ajuda</button>
          <button id="btnNovoProduto" class="primary-btn" type="button">+ Novo Produto</button>
        </div>
      </header>

      <div class="produtos-toolbar">
        <input id="produtosBusca" class="search-input" placeholder="Buscar produtos..." value="${escapeHtml(appState.ui.produtosBusca || '')}" />
        <select id="produtosCategoria">
          <option value="todas">Todas as categorias</option>
          ${categorias
            .map(
              (categoria) =>
                `<option value="${escapeHtml(categoria)}" ${categoriaSelecionada === categoria ? 'selected' : ''}>${escapeHtml(categoria)}</option>`
            )
            .join('')}
        </select>
        <button id="btnFiltroEstoqueBaixo" class="chip ${appState.ui.produtosSomenteEstoqueBaixo ? 'active' : ''}" type="button">Estoque Baixo</button>
      </div>

      <section class="produtos-content">
        ${
          filtrados.length
            ? `<div class="produtos-list">
                <div class="produtos-list-head">
                  <span>Produto</span>
                  <span>Categoria</span>
                  <span>Preco</span>
                  <span>Estoque</span>
                  <span>Acoes</span>
                </div>
                ${linhas}
              </div>`
            : `<div class="produtos-empty">
                <div class="produtos-empty-icon">◻</div>
                <h3>Nenhum produto encontrado</h3>
                <p>Comece adicionando seu primeiro produto.</p>
                <button id="btnNovoProdutoEmpty" class="primary-btn" type="button">+ Novo Produto</button>
              </div>`
        }
      </section>

      ${
        appState.ui.mostrarNovoProduto
          ? `<div class="produto-modal-backdrop" id="produtoModalBackdrop">
              <aside class="produto-drawer" role="dialog" aria-modal="true">
                <header>
                  <h3>${modalTitulo}</h3>
                  <button id="btnCloseProdutoModal" type="button">×</button>
                </header>
                <form id="productForm" class="produto-form">
                  <input type="hidden" name="fotoAtual" value="${escapeHtml(produtoEmEdicao?.fotos?.[0] || '')}" />
                  <label>Nome do Produto *</label>
                  <input name="nome" placeholder="Ex: Chaveiro Pokemon" value="${escapeHtml(produtoEmEdicao?.nome || '')}" required />

                  <label>Descricao</label>
                  <textarea name="descricao" placeholder="Descricao do produto...">${escapeHtml(produtoEmEdicao?.descricao || '')}</textarea>

                  <label>Imagem do Produto</label>
                  <input id="produtoImagemInput" name="imagemProduto" type="file" accept="image/*" />
                  ${
                    produtoEmEdicao?.fotos?.[0]
                      ? `<button type="button" class="ghost-btn" data-open-current-image>Ver imagem atual</button>`
                      : ''
                  }

                  <label>Categoria *</label>
                  <select name="categoria" required>
                    <option value="" ${produtoEmEdicao?.categoria ? '' : 'selected'}>Selecione</option>
                    ${categorias
                      .map(
                        (categoria) =>
                          `<option value="${escapeHtml(categoria)}" ${produtoEmEdicao?.categoria === categoria ? 'selected' : ''}>${escapeHtml(categoria)}</option>`
                      )
                      .join('')}
                  </select>

                  <div class="produto-form-grid two">
                    <div>
                      <label>Custo de Producao (R$) *</label>
                      <input name="custo" type="number" min="0" step="0.01" value="${Number(produtoEmEdicao?.custo || 0)}" required />
                    </div>
                    <div>
                      <label>Preco de Venda (R$) *</label>
                      <input name="precoFinal" type="number" min="0" step="0.01" value="${Number(produtoEmEdicao?.precoFinal || 0)}" required />
                    </div>
                  </div>

                  <div class="produto-form-grid two">
                    <div>
                      <label>Quantidade em Estoque *</label>
                      <input name="estoqueInicial" type="number" min="0" value="${Number(produtoEmEdicao?.estoqueInicial || 0)}" required />
                    </div>
                    <div>
                      <label>Estoque Minimo</label>
                      <input name="estoqueMinimo" type="number" min="0" value="${Number(produtoEmEdicao?.estoqueMinimo || 5)}" />
                    </div>
                  </div>

                  <div class="produto-form-grid two">
                    <div>
                      <label>Peso Medio (g)</label>
                      <input name="pesoMedio" type="number" min="0" value="${Number(produtoEmEdicao?.pesoMedio || 0)}" />
                    </div>
                    <div>
                      <label>Tempo de Producao (min)</label>
                      <input name="tempoMedio" type="number" min="0" value="${Number(produtoEmEdicao?.tempoMedio || 0)}" />
                    </div>
                  </div>

                  <label>Margem (%)</label>
                  <input name="margem" type="number" min="0" step="0.01" value="${Number(produtoEmEdicao?.margem || 0)}" />

                  <button type="submit" class="primary-btn">${produtoEmEdicao ? 'Salvar Alteracoes' : 'Salvar Produto'}</button>
                </form>
              </aside>
            </div>`
          : ''
      }

      ${
        appState.ui.produtoImagemVisualizando
          ? `<div class="produto-view-backdrop" id="produtoViewBackdrop">
              <div class="produto-view-modal">
                <button id="btnCloseProdutoView" type="button">×</button>
                <img src="${escapeHtml(appState.ui.produtoImagemVisualizando)}" alt="Imagem do produto" />
              </div>
            </div>`
          : ''
      }
    </section>
  `;
}
