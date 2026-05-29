// Pagina de cadastro e gestao de equipamentos (ativos)
export function renderAtivosPage(ctx) {
  const { appState, escapeHtml, money, safeDate } = ctx;
  const impressoras = appState.impressoras || [];
  const busca = appState.ui.ativosBusca?.toLowerCase() || '';
  const filtradas = impressoras.filter((imp) => {
    const texto = `${imp.marca} ${imp.modelo} ${imp.numeroSerie}`.toLowerCase();
    const statusOk = !appState.ui.ativosFiltro || appState.ui.ativosFiltro === 'todos' || (appState.ui.ativosFiltro === 'ativos' ? imp.ativo !== false : imp.ativo === false);
    return texto.includes(busca) && statusOk;
  });

  return `
    <section>
      <header class="page-header">
        <div>
          <h2>Equipamentos da Empresa</h2>
          <p>Cadastre e gerencie os equipamentos, marcas, valores e fotos.</p>
        </div>
        <button id="btnNovoEquipamento" class="primary-btn">+ Novo Equipamento</button>
      </header>
      <div class="ativos-toolbar">
        <input id="ativosBusca" class="search-input" placeholder="Buscar equipamentos..." value="${escapeHtml(appState.ui.ativosBusca || '')}" />
        <button class="chip ${!appState.ui.ativosFiltro || appState.ui.ativosFiltro === 'todos' ? 'active' : ''}" data-ativos-filtro="todos">Todos</button>
        <button class="chip ${appState.ui.ativosFiltro === 'ativos' ? 'active' : ''}" data-ativos-filtro="ativos">Ativos</button>
        <button class="chip ${appState.ui.ativosFiltro === 'inativos' ? 'active' : ''}" data-ativos-filtro="inativos">Inativos</button>
      </div>
      <div class="ativos-grid">
        ${filtradas.length === 0 ? `<div class='limit-box'>Nenhum equipamento cadastrado.</div>` :
          filtradas.map(imp => `
            <article class="ativo-card">
              <div class="ativo-foto">
                ${imp.foto ? `<img src="${escapeHtml(imp.foto)}" alt="Foto do equipamento" />` : `<div class="foto-placeholder">Sem foto</div>`}
              </div>
              <div class="ativo-info">
                <h4>${escapeHtml(imp.marca)} ${escapeHtml(imp.modelo)}</h4>
                <p><b>Nº Série:</b> ${escapeHtml(imp.numeroSerie)}</p>
                <p><b>Valor de Compra:</b> ${money(imp.valorCompra)}</p>
                <p><b>Data de Compra:</b> ${escapeHtml(safeDate(imp.dataCompra))}</p>
                <p><b>Status:</b> <span class="${imp.ativo === false ? 'inativo' : 'ativo'}">${imp.ativo === false ? 'Inativo' : 'Ativo'}</span></p>
                <button class="edit-btn" data-id="${imp._id || imp.id || ''}">Editar</button>
                <button class="delete-btn" data-id="${imp._id || imp.id || ''}">Excluir</button>
              </div>
            </article>
          `).join('')
        }
      </div>
      <div id="modalImpressora" class="modal" style="display:none"></div>
    </section>
  `;
}
