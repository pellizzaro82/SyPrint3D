function escape(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const SECTION_META = {
  fornecedores: {
    title: 'Fornecedores',
    subtitle: 'Cadastro de parceiros e canais de compra.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"></path><path d="M5 21V7l8-4v18"></path><path d="M19 21V11l-6-4"></path><path d="M9 9h.01"></path><path d="M9 13h.01"></path><path d="M9 17h.01"></path></svg>',
  },
  categorias: {
    title: 'Categorias',
    subtitle: 'Itens usados em Produtos e Compras.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7 9 18l-5-5"></path><path d="M17 7h3v3"></path><path d="M7 7h5"></path><path d="M7 12h3"></path></svg>',
  },
  tiposMaterial: {
    title: 'Tipos de Material',
    subtitle: 'Opcoes do cadastro de materiais.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"></path><path d="M4 12h16"></path><path d="M4 17h16"></path><circle cx="8" cy="7" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="16" cy="17" r="1"></circle></svg>',
  },
  marcasEquipamentos: {
    title: 'Marca de Equipamentos',
    subtitle: 'Marcas sugeridas no cadastro de equipamentos.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="16" height="12" rx="2"></rect><path d="M8 6V4"></path><path d="M16 6V4"></path><path d="M8 18v2"></path><path d="M16 18v2"></path></svg>',
  },
  metodosPagamento: {
    title: 'Metodos de Pagamento',
    subtitle: 'Opcoes da tela de Compras.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 10h18"></path><path d="M7 15h4"></path></svg>',
  },
};

function renderLandingCards() {
  return Object.entries(SECTION_META)
    .map(
      ([key, meta]) => `
        <button type="button" class="outro-card-nav" data-open-other-catalog="${key}">
          <span class="outro-card-icon">${meta.icon}</span>
          <strong>${meta.title}</strong>
          <span>${meta.subtitle}</span>
        </button>
      `
    )
    .join('');
}

function renderFornecedoresRows(entries) {
  return entries
    .map(({ item, index }) => {
      const whatsapp = String(item.whatsappVendas || '').trim();
      const whatsappHref = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, '')}` : '';

      return `
        <article class="outro-row outro-row-fornecedor">
          <div class="outro-col outro-col-item">
            <h4>${escape(item.nome || 'Sem nome')}</h4>
            <p>${escape(item.email || 'Sem e-mail')}</p>
          </div>
          <div class="outro-col">${escape(item.telefone || '-')}</div>
          <div class="outro-col outro-col-whatsapp">
            <div class="outro-whatsapp-inline">
              <span>${escape(whatsapp || '-')}</span>
              ${
                whatsappHref
                  ? `<a class="icon-btn outro-wa-btn" href="${whatsappHref}" target="_blank" rel="noreferrer" title="Enviar mensagem">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-1.9 5.4A8.5 8.5 0 1 1 21 11.5z"></path>
                        <path d="M8 12.5s1.5 3 4 3c1.2 0 2.2-.5 3-1.3"></path>
                        <path d="M14.5 9.5h.01"></path>
                        <path d="M9.5 9.5h.01"></path>
                      </svg>
                    </a>`
                  : ''
              }
            </div>
          </div>
          <div class="outro-col">${item.site ? `<a href="${escape(item.site)}" target="_blank" rel="noreferrer">${escape(item.site)}</a>` : '-'}</div>
          <div class="outro-col outro-col-acoes">
            <button class="icon-btn edit-btn" data-other-edit="${index}" title="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="icon-btn delete-btn" data-other-delete="${index}" title="Excluir">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderSimpleRows(entries) {
  return entries
    .map(
      ({ item, index }) => `
        <article class="outro-row outro-row-simple">
          <div class="outro-col outro-col-item">
            <h4>${escape(item.nome || 'Sem nome')}</h4>
          </div>
          <div class="outro-col outro-col-acoes">
            <button class="icon-btn edit-btn" data-other-edit="${index}" title="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="icon-btn delete-btn" data-other-delete="${index}" title="Excluir">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </div>
        </article>
      `
    )
    .join('');
}

function renderFornecedorModal(fornecedor) {
  return `
    <div class="outro-modal-backdrop" id="otherCatalogModalBackdrop">
      <aside class="outro-drawer" role="dialog" aria-modal="true">
        <header>
          <h3>${fornecedor ? 'Editar fornecedor' : 'Novo fornecedor'}</h3>
          <button type="button" data-other-close-modal>×</button>
        </header>
        <form id="otherCatalogForm" class="outro-form" data-other-form="fornecedores">
          <label>Nome *</label>
          <input name="nome" placeholder="Nome" value="${escape(fornecedor?.nome || '')}" required />

          <div class="outro-form-grid two">
            <div>
              <label>Telefone</label>
              <input name="telefone" placeholder="Telefone" value="${escape(fornecedor?.telefone || '')}" />
            </div>
            <div>
              <label>E-mail</label>
              <input name="email" placeholder="E-mail" value="${escape(fornecedor?.email || '')}" />
            </div>
          </div>

          <div class="outro-form-grid two">
            <div>
              <label>Site</label>
              <input name="site" placeholder="https://" value="${escape(fornecedor?.site || '')}" />
            </div>
            <div>
              <label>WhatsApp vendas</label>
              <input name="whatsappVendas" placeholder="WhatsApp" value="${escape(fornecedor?.whatsappVendas || '')}" />
            </div>
          </div>

          <button type="submit" class="primary-btn">${fornecedor ? 'Salvar Alteracoes' : 'Salvar Fornecedor'}</button>
          <button type="button" class="ghost-btn" data-other-close-modal>Cancelar</button>
        </form>
      </aside>
    </div>
  `;
}

function renderSimpleModal(sectionKey, item, meta) {
  return `
    <div class="outro-modal-backdrop" id="otherCatalogModalBackdrop">
      <aside class="outro-drawer" role="dialog" aria-modal="true">
        <header>
          <h3>${item ? `Editar ${meta.title}` : `Novo ${meta.title}`}</h3>
          <button type="button" data-other-close-modal>×</button>
        </header>
        <form id="otherCatalogForm" class="outro-form" data-other-form="${sectionKey}">
          <label>Nome *</label>
          <input name="nome" placeholder="Nome" value="${escape(item?.nome || '')}" required />

          <button type="submit" class="primary-btn">${item ? 'Salvar Alteracoes' : 'Salvar Item'}</button>
          <button type="button" class="ghost-btn" data-other-close-modal>Cancelar</button>
        </form>
      </aside>
    </div>
  `;
}

function renderDetailPage(sectionKey, meta, items, ui) {
  const busca = String(ui.outrosCadastrosBusca || '').toLowerCase();
  const filtrados = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      const raw = sectionKey === 'fornecedores'
        ? `${item?.nome || ''} ${item?.telefone || ''} ${item?.email || ''} ${item?.site || ''} ${item?.whatsappVendas || ''}`
        : `${item?.nome || ''}`;

      return raw.toLowerCase().includes(busca);
    });

  const rawEditIndex = ui.outroCadastroEditIndex;
  const editIndex = typeof rawEditIndex === 'number' && rawEditIndex >= 0 ? rawEditIndex : null;
  const editItem = editIndex !== null ? items[editIndex] || null : null;
  const listHtml = sectionKey === 'fornecedores' ? renderFornecedoresRows(filtrados) : renderSimpleRows(filtrados);

  return `
    <section>
      <header class="outros-head">
        <div>
          <h2>${meta.title}</h2>
          <p>${meta.subtitle}</p>
        </div>
        <div class="outros-actions">
          <button type="button" class="ghost-btn outro-back-btn" data-back-other-catalog>← Voltar</button>
          <button id="btnNovoOtherCatalog" class="primary-btn" type="button" data-new-other-catalog>+ Novo</button>
        </div>
      </header>

      <div class="outros-toolbar">
        <input id="otherCatalogSearch" class="search-input" placeholder="Buscar..." value="${escape(ui.outrosCadastrosBusca || '')}" />
      </div>

      <section class="outros-content">
        ${
          filtrados.length
            ? `<div class="outros-list ${sectionKey === 'fornecedores' ? 'fornecedores-list' : 'simple-list'}">
                <div class="outros-list-head ${sectionKey === 'fornecedores' ? 'fornecedores-list-head' : 'simple-list-head'}">
                  ${
                    sectionKey === 'fornecedores'
                      ? '<span>Fornecedor</span><span>Telefone</span><span>WhatsApp vendas</span><span>Site</span><span>Acoes</span>'
                      : '<span>Nome</span><span>Acoes</span>'
                  }
                </div>
                ${listHtml}
              </div>`
            : `<div class="outros-empty">
                <div class="outros-empty-icon">◻</div>
                <h3>Nenhum item encontrado</h3>
                <p>Comece adicionando seu primeiro registro.</p>
                <button type="button" class="primary-btn" data-new-other-catalog>+ Novo</button>
              </div>`
        }
      </section>

      ${
        ui.mostrarOutroCadastroModal
          ? sectionKey === 'fornecedores'
            ? renderFornecedorModal(editItem)
            : renderSimpleModal(sectionKey, editItem, meta)
          : ''
      }
    </section>
  `;
}

export function renderOutrosCadastrosPage(ctx) {
  const { appState } = ctx;
  const catalog = appState.outrosCadastros || {
    fornecedores: [],
    categorias: [],
    tiposMaterial: [],
    marcasEquipamentos: [],
    metodosPagamento: [],
  };
  const sectionKey = String(appState.ui.outrosCadastrosSecao || '');
  const meta = SECTION_META[sectionKey] || null;

  if (!meta) {
    return `
      <section>
        <header class="page-header">
          <div>
            <h2>Outros Cadastros</h2>
            <p>Escolha um cadastro para abrir a proxima tela de gerenciamento.</p>
          </div>
        </header>

        <div class="outros-nav-grid">
          ${renderLandingCards()}
        </div>
      </section>
    `;
  }

  return renderDetailPage(sectionKey, meta, catalog[sectionKey] || [], appState.ui);
}
