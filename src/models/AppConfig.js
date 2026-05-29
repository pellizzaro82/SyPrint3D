import mongoose from 'mongoose';

const appConfigSchema = new mongoose.Schema(
  {
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    chave: { type: String, required: true, default: 'default', index: true },
    perfilEmpresa: {
      nomeFantasia: { type: String, trim: true, default: 'SyPrint3D' },
      telefoneWhatsApp: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, default: '' },
      endereco: { type: String, trim: true, default: '' },
      logoDataUrl: { type: String, default: '' },
      logoNome: { type: String, trim: true, default: '' },
    },
    preferenciasTela: {
      temaPadrao: { type: String, enum: ['claro', 'escuro'], default: 'claro' },
      formatoData: { type: String, enum: ['pt-BR', 'en-US'], default: 'pt-BR' },
      mostrarCentavos: { type: Boolean, default: true },
    },
    orcamentos: {
      validadePadraoDias: { type: Number, min: 1, max: 365, default: 7 },
      textoPadraoObservacoes: { type: String, trim: true, default: '' },
      mensagemPadraoPdf: { type: String, trim: true, default: 'Proposta comercial para impressao 3D.' },
    },
    impressaoPdf: {
      mostrarLogoNoPdf: { type: Boolean, default: true },
      corCabecalhoPdf: { type: String, trim: true, default: '#e9eef5' },
      rodapePadrao: { type: String, trim: true, default: 'SyPrint3D' },
    },
  },
  { timestamps: true, collection: 'ConfiguracoesApp' }
);

appConfigSchema.index({ ownerUserId: 1, chave: 1 }, { unique: true });

export const AppConfig = mongoose.model('AppConfig', appConfigSchema);
