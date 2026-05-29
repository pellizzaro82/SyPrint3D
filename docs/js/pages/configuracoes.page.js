function escape(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const CONFIG_META = {
  perfil: {
    title: 'Perfil da Empresa',
    subtitle: 'Nome fantasia, contato, endereco e logo.',
  },
  tela: {
    title: 'Preferencias da Tela',
    subtitle: 'Tema, formato de data e exibicao de valores.',
  },
  orcamentos: {
    title: 'Orcamentos (Simples)',
    subtitle: 'Validade e textos padrao para propostas.',
  },
  pdf: {
    title: 'Impressao/PDF',
    subtitle: 'Logo, cor de cabecalho e rodape padrao.',
  },
};

function renderCards() {
  return Object.entries(CONFIG_META)
    .map(
      ([key, meta]) => `
        <button type="button" class="config-card-nav" data-open-config-section="${key}">
          <strong>${meta.title}</strong>
          <span>${meta.subtitle}</span>
        </button>
      `
    )
    .join('');
}

function renderPerfilEmpresa(config) {
  const perfil = config?.perfilEmpresa || {};
  const hasLogo = String(perfil.logoDataUrl || '').startsWith('data:');
  const logoPreview = hasLogo ? String(perfil.logoDataUrl) : 'images/Logo.png';
  const logoLabel = hasLogo ? `Logo atual: ${escape(perfil.logoNome || 'imagem carregada')}` : 'Logo padrao do sistema em uso.';

  return `
    <form id="configuracoesForm" class="config-form" data-config-form="perfil">
      <div class="config-form-grid two">
        <div>
          <label>Nome fantasia</label>
          <input name="nomeFantasia" value="${escape(perfil.nomeFantasia || 'SyPrint3D')}" maxlength="80" required />
        </div>
        <div>
          <label>Telefone/WhatsApp</label>
          <input name="telefoneWhatsApp" value="${escape(perfil.telefoneWhatsApp || '')}" maxlength="30" />
        </div>
      </div>

      <div class="config-form-grid two">
        <div>
          <label>E-mail</label>
          <input name="email" type="email" value="${escape(perfil.email || '')}" maxlength="120" />
        </div>
        <div>
          <label>Logo</label>
          <input name="logoArquivo" type="file" accept="image/*" />
          <input name="logoNome" type="hidden" value="${escape(perfil.logoNome || '')}" />
          <input name="removerLogo" type="hidden" value="false" />
          <div class="config-logo-preview-box">
            <img src="${escape(logoPreview)}" alt="Previa da logo da empresa" class="config-logo-preview" data-logo-preview />
            <div class="config-logo-preview-meta">
              <strong>${hasLogo ? 'Logo personalizada' : 'Logo padrao'}</strong>
              <span class="form-hint" data-logo-status>${logoLabel}</span>
            </div>
            <button type="button" class="ghost-btn config-logo-remove ${hasLogo ? '' : 'is-hidden'}" data-remove-company-logo>Excluir logo</button>
          </div>
        </div>
      </div>

      <div class="config-form-grid one">
        <div>
          <label>Endereco</label>
          <textarea name="endereco" rows="3" maxlength="220">${escape(perfil.endereco || '')}</textarea>
        </div>
      </div>

      <button type="submit" class="primary-btn">Salvar perfil da empresa</button>
    </form>
  `;
}

function renderPreferenciasTela(config) {
  const pref = config?.preferenciasTela || {};
  return `
    <form id="configuracoesForm" class="config-form" data-config-form="tela">
      <div class="config-form-grid three">
        <div>
          <label>Tema padrao</label>
          <select name="temaPadrao">
            <option value="claro" ${String(pref.temaPadrao || 'claro') === 'claro' ? 'selected' : ''}>Claro</option>
            <option value="escuro" ${String(pref.temaPadrao || '') === 'escuro' ? 'selected' : ''}>Escuro</option>
          </select>
        </div>
        <div>
          <label>Formato de data</label>
          <select name="formatoData">
            <option value="pt-BR" ${String(pref.formatoData || 'pt-BR') === 'pt-BR' ? 'selected' : ''}>Brasil (dd/mm/aaaa)</option>
            <option value="en-US" ${String(pref.formatoData || '') === 'en-US' ? 'selected' : ''}>EUA (mm/dd/yyyy)</option>
          </select>
        </div>
        <div>
          <label>Valores monetarios</label>
          <select name="mostrarCentavos">
            <option value="true" ${pref.mostrarCentavos !== false ? 'selected' : ''}>Com centavos</option>
            <option value="false" ${pref.mostrarCentavos === false ? 'selected' : ''}>Sem centavos</option>
          </select>
        </div>
      </div>
      <button type="submit" class="primary-btn">Salvar preferencias da tela</button>
    </form>
  `;
}

function renderOrcamentos(config) {
  const orc = config?.orcamentos || {};
  return `
    <form id="configuracoesForm" class="config-form" data-config-form="orcamentos">
      <div class="config-form-grid one">
        <div>
          <label>Validade padrao (dias)</label>
          <input name="validadePadraoDias" type="number" min="1" max="365" value="${Number(orc.validadePadraoDias || 7)}" />
        </div>
      </div>

      <div class="config-form-grid one">
        <div>
          <label>Texto padrao de observacoes</label>
          <textarea name="textoPadraoObservacoes" rows="4" maxlength="800">${escape(orc.textoPadraoObservacoes || '')}</textarea>
        </div>
      </div>

      <div class="config-form-grid one">
        <div>
          <label>Mensagem padrao do PDF</label>
          <textarea name="mensagemPadraoPdf" rows="3" maxlength="240">${escape(orc.mensagemPadraoPdf || '')}</textarea>
        </div>
      </div>

      <button type="submit" class="primary-btn">Salvar configuracoes de orcamento</button>
    </form>
  `;
}

function renderPdf(config) {
  const pdf = config?.impressaoPdf || {};
  return `
    <form id="configuracoesForm" class="config-form" data-config-form="pdf">
      <div class="config-form-grid three">
        <div>
          <label>Mostrar logo no PDF</label>
          <select name="mostrarLogoNoPdf">
            <option value="true" ${pdf.mostrarLogoNoPdf !== false ? 'selected' : ''}>Sim</option>
            <option value="false" ${pdf.mostrarLogoNoPdf === false ? 'selected' : ''}>Nao</option>
          </select>
        </div>
        <div>
          <label>Cor do cabecalho do PDF</label>
          <input name="corCabecalhoPdf" type="color" value="${escape(pdf.corCabecalhoPdf || '#e9eef5')}" />
        </div>
        <div>
          <label>Rodape padrao</label>
          <input name="rodapePadrao" value="${escape(pdf.rodapePadrao || '')}" maxlength="140" />
        </div>
      </div>

      <button type="submit" class="primary-btn">Salvar configuracoes de PDF</button>
    </form>
  `;
}

function renderSectionForm(section, config) {
  if (section === 'perfil') return renderPerfilEmpresa(config);
  if (section === 'tela') return renderPreferenciasTela(config);
  if (section === 'orcamentos') return renderOrcamentos(config);
  if (section === 'pdf') return renderPdf(config);
  return '';
}

export function renderConfiguracoesPage(ctx) {
  const { appState } = ctx;
  const section = String(appState.ui.configuracoesSecao || '');
  const meta = CONFIG_META[section];

  if (!meta) {
    return `
      <section>
        <header class="page-header">
          <div>
            <h2>Configuracoes</h2>
            <p>Ajustes basicos para usuarios comuns do sistema.</p>
          </div>
        </header>

        <div class="config-nav-grid">
          ${renderCards()}
        </div>
      </section>
    `;
  }

  return `
    <section>
      <header class="config-head">
        <div>
          <h2>${meta.title}</h2>
          <p>${meta.subtitle}</p>
        </div>
        <div class="config-actions">
          <button type="button" class="ghost-btn" data-back-config-section>← Voltar</button>
        </div>
      </header>

      <section class="config-content">
        ${renderSectionForm(section, appState.configuracoes || {})}
      </section>
    </section>
  `;
}
