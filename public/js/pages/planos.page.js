const DEFAULT_LIMITS = [
  { key: 'ordersPerMonth', label: 'Pedidos/mes' },
  { key: 'clientsTotal', label: 'Clientes' },
  { key: 'productsTotal', label: 'Produtos' },
  { key: 'materialsTotal', label: 'Materiais' },
];

const DEFAULT_PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'pedidos', label: 'Pedidos' },
  { key: 'orcamentos', label: 'Orcamentos' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'produtos', label: 'Produtos' },
  { key: 'materiais', label: 'Materiais' },
  { key: 'compras', label: 'Compras' },
  { key: 'equipamentos', label: 'Equipamentos' },
  { key: 'outrosCadastros', label: 'Outros cadastros' },
  { key: 'relatorios', label: 'Relatorios' },
  { key: 'configuracoes', label: 'Configuracoes' },
];

function limitLabel(value) {
  if (value === null || typeof value === 'undefined' || String(value).trim() === '') return 'Ilimitado';
  return String(value);
}

function renderPlanLimitList(plan, limitsDef) {
  const limits = plan?.limits || {};
  const labels = Array.isArray(limitsDef) && limitsDef.length ? limitsDef : DEFAULT_LIMITS;

  return labels
    .map((item) => `<li><span>${item.label}</span><strong>${limitLabel(limits[item.key])}</strong></li>`)
    .join('');
}

function renderFeatures(features) {
  return (Array.isArray(features) ? features : []).map((item) => `<li>${item}</li>`).join('');
}

function renderPublicPlans({ plans, currentCode, money, limitsDef }) {
  return `
    <div class="planos-grid">
      ${plans
        .map(
          (plan) => `
            <article class="plano-card ${plan.code === currentCode ? 'atual' : ''}">
              <div class="plano-head">
                <h3>${plan.name}</h3>
                <p>${money(plan.promotionalPrice ?? (plan.monthlyPrice || 0))}<span>/mes</span></p>
                ${Number(plan.discountPercent || 0) > 0 ? `<small>${Number(plan.discountPercent || 0).toFixed(1)}% OFF ${plan.promoLabel || ''}</small>` : ''}
              </div>
              <ul class="plano-limits">${renderPlanLimitList(plan, limitsDef)}</ul>
              <ul class="plano-features">${renderFeatures(plan.features)}</ul>
              <button
                type="button"
                class="${plan.code === currentCode ? 'ghost-btn' : 'primary-btn'}"
                data-change-plan="${plan.code}"
                ${plan.code === currentCode ? 'disabled' : ''}
              >
                ${plan.code === currentCode ? 'Plano atual' : `Assinar ${plan.name}`}
              </button>
            </article>
          `
        )
        .join('')}
    </div>
  `;
}

function renderPlanEditorCard(plan, limitsDef, permissionsDef) {
  const code = String(plan?.code || '').trim() || 'plano';
  const name = String(plan?.name || '').trim() || code;
  const monthlyPrice = Number(plan?.monthlyPrice || 0);
  const discountPercent = Number(plan?.discountPercent || 0);
  const promotionalPrice = Math.max(0, monthlyPrice * (1 - discountPercent / 100));
  const featuresText = Array.isArray(plan?.features) ? plan.features.join('\n') : '';
  const isSystem = code === 'basic' || code === 'premium';

  const limitsHtml = (Array.isArray(limitsDef) && limitsDef.length ? limitsDef : DEFAULT_LIMITS)
    .map((item) => {
      const value = plan?.limits?.[item.key];
      return `
        <label>
          <span>${item.label}</span>
          <input type="number" min="1" step="1" value="${value ?? ''}" data-plan-limit="${item.key}" placeholder="Ilimitado" />
        </label>
      `;
    })
    .join('');

  const permissionsHtml = (Array.isArray(permissionsDef) && permissionsDef.length ? permissionsDef : DEFAULT_PERMISSIONS)
    .map((item) => {
      const checked = plan?.permissions?.[item.key] !== false ? 'checked' : '';
      return `
        <label class="plan-permission-item">
          <input type="checkbox" data-plan-permission="${item.key}" ${checked} />
          <span>${item.label}</span>
        </label>
      `;
    })
    .join('');

  return `
    <article class="plan-master-card" data-master-plan-item="${code}">
      <div class="plan-master-head">
        <h3>${name}</h3>
        <div class="plan-master-head-actions">
          ${isSystem ? '<small>Plano base do sistema</small>' : `<button type="button" class="ghost-btn danger" data-remove-master-plan="${code}">Remover</button>`}
        </div>
      </div>

      <div class="plan-master-grid">
        <label>
          <span>Nome do plano</span>
          <input type="text" value="${name}" data-plan-field="name" maxlength="80" />
        </label>
        <label>
          <span>Codigo interno</span>
          <input type="text" value="${code}" data-plan-field="code" maxlength="40" ${isSystem ? 'readonly' : ''} />
        </label>
        <label>
          <span>Preco mensal (R$)</span>
          <input type="number" min="0" step="0.01" value="${monthlyPrice.toFixed(2)}" data-plan-field="monthlyPrice" />
        </label>
        <label>
          <span>Desconto (%)</span>
          <input type="number" min="0" max="100" step="0.1" value="${discountPercent.toFixed(1)}" data-plan-field="discountPercent" />
        </label>
        <label>
          <span>Label promocional</span>
          <input type="text" value="${String(plan?.promoLabel || '')}" data-plan-field="promoLabel" maxlength="120" placeholder="Ex.: Black Friday" />
        </label>
        <label class="plan-master-active">
          <span>Disponivel para escolha dos usuarios</span>
          <input type="checkbox" data-plan-field="isActive" ${plan?.isActive === false ? '' : 'checked'} />
        </label>
      </div>

      <div class="plan-master-price-preview">
        <small>Preco final com desconto</small>
        <strong>R$ ${promotionalPrice.toFixed(2)}</strong>
      </div>

      <section class="plan-master-section">
        <h4>Limites do plano</h4>
        <div class="plan-master-limits-grid">${limitsHtml}</div>
      </section>

      <section class="plan-master-section">
        <h4>Permissoes de acesso</h4>
        <div class="plan-master-permissions-grid">${permissionsHtml}</div>
      </section>

      <section class="plan-master-section">
        <h4>Beneficios comerciais</h4>
        <textarea rows="4" data-plan-field="features" placeholder="Um beneficio por linha">${featuresText}</textarea>
      </section>
    </article>
  `;
}

export function renderPlanosPage(ctx) {
  const { appState, money } = ctx;
  const account = appState.conta || {};
  const plans = Array.isArray(account.plans) ? account.plans : [];
  const currentCode = String(account.currentPlan?.code || 'basic');
  const isAdmin = Boolean(account?.user?.isAdmin);

  const limitsDef = Array.isArray(appState?.masterPlanMeta?.limits) ? appState.masterPlanMeta.limits : DEFAULT_LIMITS;
  const permissionsDef = Array.isArray(appState?.masterPlanMeta?.permissions)
    ? appState.masterPlanMeta.permissions
    : DEFAULT_PERMISSIONS;

  if (!isAdmin) {
    return `
      <section class="planos-page">
        <header class="page-header">
          <div>
            <h2>Planos</h2>
            <p>Escolha o plano ideal para sua operacao.</p>
          </div>
        </header>
        ${renderPublicPlans({ plans, currentCode, money, limitsDef })}
      </section>
    `;
  }

  const masterPlans = Array.isArray(appState.masterPlans) && appState.masterPlans.length ? appState.masterPlans : plans;

  return `
    <section class="planos-page planos-master-page">
      <header class="page-header">
        <div>
          <h2>Gestao de Planos</h2>
          <p>Painel master para definir catalogo, precificacao, promocoes e permissoes por plano.</p>
        </div>
        <div class="admin-users-header-actions">
          <button type="button" class="ghost-btn" data-refresh-master-plans="1">Atualizar catalogo</button>
          <button type="button" class="ghost-btn" data-add-master-plan="1">Novo plano</button>
          <button type="button" class="primary-btn" data-save-master-plans="1">Salvar catalogo</button>
        </div>
      </header>

      <div class="plan-master-grid-wrap">
        ${masterPlans.map((plan) => renderPlanEditorCard(plan, limitsDef, permissionsDef)).join('')}
      </div>
    </section>
  `;
}
