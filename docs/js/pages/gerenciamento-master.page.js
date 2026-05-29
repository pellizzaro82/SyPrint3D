export function renderGerenciamentoMasterPage(ctx) {
  const isAdmin = Boolean(ctx?.appState?.conta?.user?.isAdmin);

  if (!isAdmin) {
    return `
      <section class="master-page">
        <header class="page-header">
          <div>
            <h2>Gerenciamento Master</h2>
            <p>Area exclusiva do dono do sistema.</p>
          </div>
        </header>
        <div class="limit-box">Acesso restrito ao administrador master.</div>
      </section>
    `;
  }

  return `
    <section class="master-page">
      <header class="page-header">
        <div>
          <h2>Gerenciamento Master</h2>
          <p>Central do dono do sistema para governanca de usuarios, planos e permissoes.</p>
        </div>
      </header>

      <div class="master-grid">
        <article class="master-card">
          <h3>Gestao de Usuarios</h3>
          <p>Gerencie acessos, niveis e redefinicao de senha da equipe.</p>
          <div class="master-card-actions">
            <button type="button" class="primary-btn" data-page="usuarios">Abrir Gestao de Usuarios</button>
          </div>
        </article>

        <article class="master-card">
          <h3>Gestao de Planos</h3>
          <p>Compare recursos, limite de uso e selecione o plano ideal.</p>
          <div class="master-card-actions">
            <button type="button" class="primary-btn" data-page="planos">Abrir Gestao de Planos</button>
          </div>
        </article>
      </div>
    </section>
  `;
}
