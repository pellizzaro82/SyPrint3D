export function renderClientesPage(ctx) {
  const { appState, escapeHtml } = ctx;
  const total = appState.clientes.length;
  const busca = (appState.ui.clientesBusca || '').toLowerCase();
  const clienteEmEdicao = appState.clientes.find((item) => item._id === appState.ui.clienteEmEdicaoId) || null;
  const modalTitulo = clienteEmEdicao ? 'Editar cliente' : 'Novo cliente';

  const filtrados = appState.clientes.filter((item) => {
    const texto = `${item.nome || ''} ${item.cpfCnpj || ''} ${item.whatsapp || ''} ${item.email || ''} ${item.cidade || ''} ${item.estado || ''}`.toLowerCase();
    const matchBusca = texto.includes(busca);
    const matchStatus = !appState.ui.clientesSomenteAtivos || item.ativo !== false;
    return matchBusca && matchStatus;
  });

  const formatAddress = (item) => {
    const ruaNumero = [item.logradouro, item.numero].filter(Boolean).join(', ');
    const cidadeEstado = [item.cidade, item.estado].filter(Boolean).join('/');
    const bairro = item.bairro || '';
    const parts = [ruaNumero, bairro, cidadeEstado].filter(Boolean);
    return parts.join(' - ') || item.endereco || '-';
  };

  const linhas = filtrados
    .map(
      (item) => `
        <article class="cliente-row">
          <div class="cliente-col cliente-col-item">
            <h4>${escapeHtml(item.nome)}</h4>
            <p>${escapeHtml(item.email || 'Sem e-mail')}</p>
          </div>
          <div class="cliente-col">${escapeHtml(item.cpfCnpj || '-')}</div>
          <div class="cliente-col">${escapeHtml(item.whatsapp || '-')}</div>
          <div class="cliente-col">${escapeHtml(formatAddress(item))}</div>
          <div class="cliente-col"><span class="${item.ativo !== false ? 'status-badge ativo' : 'status-badge inativo'}">${
            item.ativo !== false ? 'Ativo' : 'Inativo'
          }</span></div>
          <div class="cliente-col cliente-col-acoes">
            <button class="icon-btn edit-btn" data-edit-client="${item._id}" title="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="icon-btn delete-btn" data-delete-client="${item._id}" title="Excluir">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </article>
      `
    )
    .join('');

  return `
    <section>
      <header class="clientes-head">
        <div>
          <h2>Clientes <span class="clientes-count">${total} cadastrados</span></h2>
          <p>Cadastro completo e historico de clientes.</p>
        </div>
        <div class="clientes-actions">
          <button class="ghost-btn" type="button">Ajuda</button>
          <button id="btnNovoCliente" class="primary-btn" type="button">+ Novo Cliente</button>
        </div>
      </header>

      <div class="clientes-toolbar">
        <input id="clientesBusca" class="search-input" placeholder="Buscar clientes..." value="${escapeHtml(appState.ui.clientesBusca || '')}" />
        <button id="btnFiltroClientesAtivos" class="chip ${appState.ui.clientesSomenteAtivos ? 'active' : ''}" type="button">Somente ativos</button>
      </div>

      <section class="clientes-content">
        ${
          filtrados.length
            ? `<div class="clientes-list">
                <div class="clientes-list-head">
                  <span>Cliente</span>
                  <span>CPF/CNPJ</span>
                  <span>WhatsApp</span>
                  <span>Endereco</span>
                  <span>Status</span>
                  <span>Acoes</span>
                </div>
                ${linhas}
              </div>`
            : `<div class="clientes-empty">
                <div class="clientes-empty-icon">◻</div>
                <h3>Nenhum cliente encontrado</h3>
                <p>Comece adicionando seu primeiro cliente.</p>
                <button id="btnNovoClienteEmpty" class="primary-btn" type="button">+ Novo Cliente</button>
              </div>`
        }
      </section>

      ${
        appState.ui.mostrarNovoCliente
          ? `<div class="cliente-modal-backdrop" id="clienteModalBackdrop">
              <aside class="cliente-drawer" role="dialog" aria-modal="true">
                <header>
                  <h3>${modalTitulo}</h3>
                  <button id="btnCloseClienteModal" type="button">×</button>
                </header>
                <form id="clientForm" class="cliente-form">
                  <label>Nome *</label>
                  <input name="nome" placeholder="Nome" value="${escapeHtml(clienteEmEdicao?.nome || '')}" required />

                  <div class="cliente-form-grid two">
                    <div>
                      <label>CPF/CNPJ</label>
                      <input name="cpfCnpj" placeholder="CPF/CNPJ" value="${escapeHtml(clienteEmEdicao?.cpfCnpj || '')}" />
                    </div>
                    <div>
                      <label>WhatsApp</label>
                      <input name="whatsapp" placeholder="WhatsApp" value="${escapeHtml(clienteEmEdicao?.whatsapp || '')}" />
                    </div>
                  </div>

                  <label>E-mail</label>
                  <input name="email" placeholder="E-mail" value="${escapeHtml(clienteEmEdicao?.email || '')}" />

                  <label>CEP</label>
                  <div class="cep-input-wrap">
                    <input id="clientCep" name="cep" placeholder="00000-000" maxlength="9" value="${escapeHtml(clienteEmEdicao?.cep || '')}" />
                    <button type="button" class="icon-btn input-icon-btn" id="btnBuscarCep" title="Buscar CEP">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </button>
                  </div>

                  <label>Logradouro</label>
                  <input id="clientLogradouro" name="logradouro" placeholder="Rua, avenida..." value="${escapeHtml(clienteEmEdicao?.logradouro || '')}" />

                  <div class="cliente-form-grid two">
                    <div>
                      <label>Numero</label>
                      <input id="clientNumero" name="numero" placeholder="Numero" value="${escapeHtml(clienteEmEdicao?.numero || '')}" />
                    </div>
                    <div>
                      <label>Complemento</label>
                      <input id="clientComplemento" name="complemento" placeholder="Complemento" value="${escapeHtml(clienteEmEdicao?.complemento || '')}" />
                    </div>
                  </div>

                  <label>Bairro</label>
                  <input id="clientBairro" name="bairro" placeholder="Bairro" value="${escapeHtml(clienteEmEdicao?.bairro || '')}" />

                  <div class="cliente-form-grid two">
                    <div>
                      <label>Cidade</label>
                      <input id="clientCidade" name="cidade" placeholder="Cidade" value="${escapeHtml(clienteEmEdicao?.cidade || '')}" />
                    </div>
                    <div>
                      <label>Estado</label>
                      <input id="clientEstado" name="estado" placeholder="UF" maxlength="2" value="${escapeHtml(clienteEmEdicao?.estado || '')}" />
                    </div>
                  </div>

                  <label>Observacoes</label>
                  <textarea name="observacoes" placeholder="Observacoes">${escapeHtml(clienteEmEdicao?.observacoes || '')}</textarea>

                  <label>Status</label>
                  <select name="ativo">
                    <option value="true" ${clienteEmEdicao?.ativo === false ? '' : 'selected'}>Ativo</option>
                    <option value="false" ${clienteEmEdicao?.ativo === false ? 'selected' : ''}>Inativo</option>
                  </select>

                  <button type="submit" class="primary-btn">${clienteEmEdicao ? 'Salvar Alteracoes' : 'Salvar Cliente'}</button>
                  ${clienteEmEdicao ? '<button type="button" id="cancelClientEdit" class="ghost-btn">Cancelar edicao</button>' : ''}
                </form>
              </aside>
            </div>`
          : ''
      }
    </section>
  `;
}
