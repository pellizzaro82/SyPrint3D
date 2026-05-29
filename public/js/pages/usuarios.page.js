function renderPlanOptions(plans, selectedCode = '') {
  const entries = Array.isArray(plans) && plans.length
    ? plans
    : [
        { code: 'basic', name: 'Basic' },
        { code: 'premium', name: 'Premium' },
      ];
  return entries
    .map((plan) => {
      const code = String(plan?.code || '').trim();
      if (!code) return '';
      const selected = code === String(selectedCode || '').trim() ? 'selected' : '';
      return `<option value="${code}" ${selected}>${plan?.name || code}</option>`;
    })
    .join('');
}

function renderAdminUsersTable(users, plans) {
  const rows = (Array.isArray(users) ? users : [])
    .map(
      (user) => `
        <tr>
          <td>
            <strong>${user.nome || '-'}</strong>
            <small>${user.email || '-'}</small>
          </td>
          <td>${user.planName || user.planCode || '-'}</td>
          <td>${user.isAdmin ? 'Admin' : 'Usuario'}</td>
          <td>${user.isActive ? 'Ativo' : 'Inativo'}</td>
          <td>
            <div class="admin-users-actions">
              <select data-admin-plan-select="${user.id}">
                ${renderPlanOptions(plans, user.planCode)}
              </select>
              <button type="button" class="ghost-btn" data-admin-save-plan="${user.id}">Salvar plano</button>
              <button type="button" class="ghost-btn" data-admin-change-password="${user.id}">Alterar senha</button>
              <button type="button" class="ghost-btn" data-admin-toggle-active="${user.id}">${user.isActive ? 'Desativar' : 'Ativar'}</button>
              <button type="button" class="ghost-btn danger" data-admin-delete-user="${user.id}">Excluir</button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');

  return `
    <div class="table-wrap admin-users-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Plano</th>
            <th>Perfil</th>
            <th>Status</th>
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="5">Nenhum usuario cadastrado.</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function renderCreateUserForm(plans) {
  return `
    <form id="adminUserForm" class="admin-user-form structured admin-user-modal-form">
      <div class="admin-user-field full">
        <label>Nome *</label>
        <input name="nome" type="text" placeholder="Nome do usuario" required />
      </div>

      <div class="admin-user-field">
        <label>E-mail *</label>
        <input name="email" type="email" placeholder="E-mail" required />
      </div>

      <div class="admin-user-field">
        <label>Telefone</label>
        <input name="whatsapp" type="text" placeholder="Digite o numero" />
      </div>

      <div class="admin-user-field">
        <label>Plano</label>
        <select name="planCode">
          ${renderPlanOptions(plans, String(plans?.[0]?.code || ''))}
        </select>
      </div>

      <div class="admin-user-field">
        <label>Vencimento Plano</label>
        <input name="expirePlan" type="date" />
      </div>

      <div class="admin-user-field">
        <label>Informe senha *</label>
        <input name="senha" type="password" placeholder="Minimo 6 caracteres" required minlength="6" />
      </div>

      <div class="admin-user-field">
        <label>Confirme a senha *</label>
        <input name="senhaConfirmacao" type="password" placeholder="Repita a senha" required minlength="6" />
      </div>

      <div class="admin-user-field full admin-user-submit-wrap">
        <button type="submit" class="primary-btn">Criar usuario</button>
      </div>
    </form>
  `;
}

export function renderUsuariosPage(ctx) {
  const { appState } = ctx;
  const user = appState?.conta?.user || {};
  const users = Array.isArray(appState.adminUsers) ? appState.adminUsers : [];
  const plans = Array.isArray(appState?.masterPlans) && appState.masterPlans.length
    ? appState.masterPlans
    : Array.isArray(appState?.conta?.plans)
      ? appState.conta.plans
      : [];
  const busca = String(appState?.ui?.adminUsersBusca || '');

  const filteredUsers = users.filter((item) => {
    const query = normalizeSearchText(busca);
    if (!query) return true;

    const bucket = normalizeSearchText(
      [
        item?.nome,
        item?.email,
        item?.whatsapp,
        item?.planName,
        item?.planCode,
        item?.isAdmin ? 'admin' : 'usuario',
        item?.isActive ? 'ativo' : 'inativo',
      ].join(' ')
    );
    return bucket.includes(query);
  });
  const senhaTargetUserId = String(appState?.ui?.adminUserPasswordModalId || '').trim();
  const senhaTargetUser = users.find((item) => String(item?.id || '') === senhaTargetUserId) || null;

  if (!user.isAdmin) {
    return `
      <section class="assinatura-page">
        <header class="page-header">
          <div>
            <h2>Gestao de Usuarios</h2>
            <p>Somente administradores podem gerenciar usuarios.</p>
          </div>
        </header>
        <div class="limit-box">Acesso restrito ao perfil administrador.</div>
      </section>
    `;
  }

  return `
    <section class="assinatura-page">
      <header class="page-header">
        <div>
          <h2>Gestao de Usuarios</h2>
          <p>Crie usuarios, altere plano, perfil e status de acesso.</p>
        </div>
        <div class="admin-users-header-actions">
          <button type="button" class="ghost-btn" data-refresh-admin-users="1">Atualizar usuarios</button>
          <button type="button" class="primary-btn" data-open-admin-user-modal="1">Novo usuario</button>
        </div>
      </header>

      <section class="assinatura-admin-users">
        <div class="admin-users-toolbar">
          <input
            id="adminUsersSearch"
            type="search"
            placeholder="Filtrar por nome, e-mail, plano, perfil ou status"
            value="${busca}"
          />
          <span>${filteredUsers.length} usuario(s)</span>
        </div>
        ${renderAdminUsersTable(filteredUsers, plans)}
      </section>

      ${
        appState?.ui?.mostrarNovoUsuarioModal
          ? `<div class="admin-user-modal-backdrop" id="adminUserModalBackdrop">
              <aside class="admin-user-drawer" role="dialog" aria-modal="true" aria-label="Cadastrar novo usuario">
                <header>
                  <h3>Cadastrar novo usuario</h3>
                  <button id="btnCloseAdminUserModal" type="button">×</button>
                </header>
                ${renderCreateUserForm(plans)}
              </aside>
            </div>`
          : ''
      }

      ${
        senhaTargetUser
          ? `<div class="admin-password-modal-backdrop" id="adminPasswordModalBackdrop">
              <aside class="admin-password-modal" role="dialog" aria-modal="true" aria-label="Alterar senha de usuario">
                <header>
                  <h3>Alterar senha</h3>
                  <button id="btnCloseAdminPasswordModal" type="button">×</button>
                </header>
                <form id="adminPasswordForm" class="admin-password-form">
                  <p class="admin-password-user">Usuario: <strong>${senhaTargetUser.nome || senhaTargetUser.email || '-'}</strong></p>
                  <input type="hidden" name="userId" value="${senhaTargetUserId}" />
                  <div class="admin-user-field">
                    <label>Nova senha *</label>
                    <input name="novaSenha" type="password" placeholder="Minimo 6 caracteres" required minlength="6" />
                  </div>
                  <div class="admin-user-field">
                    <label>Confirmar nova senha *</label>
                    <input name="confirmarNovaSenha" type="password" placeholder="Repita a nova senha" required minlength="6" />
                  </div>
                  <div class="admin-password-actions">
                    <button type="button" class="ghost-btn" data-close-admin-password-modal="1">Cancelar</button>
                    <button type="submit" class="primary-btn">Salvar nova senha</button>
                  </div>
                </form>
              </aside>
            </div>`
          : ''
      }
    </section>
  `;
}
