function limitLabel(value) {
  if (value === null || typeof value === 'undefined') return 'Ilimitado';
  return String(value);
}

function featureList(plan) {
  return (Array.isArray(plan?.features) ? plan.features : [])
    .map((item) => `<li>${item}</li>`)
    .join('');
}

function renderPlanChangeOptions(plans, currentCode, money) {
  const list = Array.isArray(plans) ? plans : [];
  if (!list.length) {
    return '<div class="limit-box">Nenhum plano disponivel no momento.</div>';
  }

  return `
    <div class="assinatura-plan-options-grid">
      ${list
        .map((plan) => {
          const code = String(plan?.code || '').trim();
          const isCurrent = code && code === String(currentCode || '').trim();
          const price = money(plan?.promotionalPrice ?? (plan?.monthlyPrice || 0));
          const discount = Number(plan?.discountPercent || 0);
          const promoLabel = String(plan?.promoLabel || '').trim();

          return `
            <article class="assinatura-plan-option ${isCurrent ? 'atual' : ''}">
              <header>
                <h4>${plan?.name || code || 'Plano'}</h4>
                <p>${price}<span>/mes</span></p>
              </header>
              ${discount > 0 ? `<small class="assinatura-plan-option-discount">${discount.toFixed(1)}% OFF ${promoLabel}</small>` : ''}
              <ul>${featureList(plan)}</ul>
              <button
                type="button"
                class="${isCurrent ? 'ghost-btn' : 'primary-btn'}"
                data-change-plan="${code}"
                ${isCurrent ? 'disabled' : ''}
              >
                ${isCurrent ? 'Plano atual' : `Selecionar ${plan?.name || 'plano'}`}
              </button>
            </article>
          `;
        })
        .join('')}
    </div>
  `;
}

function usageRow(label, current, limit) {
  const cappedLimit = limit === null || typeof limit === 'undefined' ? null : Number(limit || 0);
  const currentValue = Number(current || 0);
  const progress = cappedLimit ? Math.max(0, Math.min(100, (currentValue / Math.max(1, cappedLimit)) * 100)) : 16;

  return `
    <article class="assinatura-usage-item">
      <div class="assinatura-usage-head">
        <strong>${label}</strong>
        <span>${currentValue} / ${limitLabel(cappedLimit)}</span>
      </div>
      <div class="assinatura-usage-track">
        <i style="width:${progress}%;"></i>
      </div>
    </article>
  `;
}

export function renderAssinaturaPage(ctx) {
  const { appState, money, safeDate } = ctx;
  const account = appState.conta || {};
  const user = account.user || {};
  const currentPlan = account.currentPlan || {};
  const plans = Array.isArray(account.plans) ? account.plans : [];
  const usage = account.usage || {};
  const limits = currentPlan.limits || {};

  return `
    <section class="assinatura-page">
      <header class="page-header">
        <div>
          <h2>Minha Assinatura</h2>
          <p>Plano atual, consumo e renovacao da sua conta.</p>
        </div>
        <div class="page-header-actions">
          <button type="button" class="ghost-btn" data-refresh-account="1">Atualizar dados</button>
        </div>
      </header>

      <div class="assinatura-grid">
        <article class="assinatura-card destaque">
          <h3>${currentPlan.name || 'Plano Basic'}</h3>
          <p class="assinatura-price">${money(currentPlan.monthlyPrice || 0)}<span>/mes</span></p>
          <p>Status: <strong>${user.payment_status || 'active'}</strong></p>
          <p>Renovacao: <strong>${safeDate(user.expirePlan)}</strong></p>
          <div class="assinatura-card-actions">
            <button type="button" class="primary-btn" data-open-planos="1">Mudar plano</button>
          </div>
        </article>

        <article class="assinatura-card">
          <h3>Consumo atual</h3>
          ${usageRow('Pedidos no mes', usage.ordersPerMonth, limits.ordersPerMonth)}
          ${usageRow('Clientes', usage.clientsTotal, limits.clientsTotal)}
          ${usageRow('Produtos', usage.productsTotal, limits.productsTotal)}
          ${usageRow('Materiais', usage.materialsTotal, limits.materialsTotal)}
        </article>

        <article class="assinatura-card recursos">
          <h3>Recursos incluidos</h3>
          <ul>${featureList(currentPlan)}</ul>
        </article>
      </div>

      ${
        appState?.ui?.mostrarTrocaPlanoModal
          ? `<div class="assinatura-plan-modal-backdrop" id="assinaturaPlanModalBackdrop">
              <aside class="assinatura-plan-modal" role="dialog" aria-modal="true" aria-label="Trocar plano">
                <header>
                  <h3>Trocar plano</h3>
                  <button id="btnCloseAssinaturaPlanModal" type="button">×</button>
                </header>
                <div class="assinatura-plan-modal-content">
                  ${renderPlanChangeOptions(plans, currentPlan.code, money)}
                </div>
              </aside>
            </div>`
          : ''
      }
    </section>
  `;
}
