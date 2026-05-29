function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function renderCalculadoraPage() {
  return `
    <section class="calculadora-page">
      <header class="page-header">
        <div>
          <h2>Calculadora</h2>
          <p>Ferramenta de apoio para simular custos e margem dos pedidos.</p>
        </div>
      </header>

      <div class="summary-grid">
        <article class="summary-card">
          <p>Custo base sugerido</p>
          <strong>${money(0)}</strong>
        </article>
        <article class="summary-card">
          <p>Preco sugerido</p>
          <strong>${money(0)}</strong>
        </article>
        <article class="summary-card">
          <p>Margem estimada</p>
          <strong>0,0%</strong>
        </article>
      </div>

      <div class="limit-box">
        <div>
          <h4>Modulo em restauracao</h4>
          <p>A tela foi recriada para manter o sistema operacional sem pagina em branco.</p>
        </div>
      </div>
    </section>
  `;
}
