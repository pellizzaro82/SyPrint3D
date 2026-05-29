import mongoose from 'mongoose';

const orcamentoCostSchema = new mongoose.Schema(
  {
    filamentoKg: { type: Number, default: 120 },
    custoFilamento: { type: Number, default: 0 },
    energiaKwh: { type: Number, default: 0.8 },
    custoKwh: { type: Number, default: 0.95 },
    custoEnergia: { type: Number, default: 0 },
    custoDesgasteHora: { type: Number, default: 0.5 },
    custoDesgaste: { type: Number, default: 0 },
    custoTotal: { type: Number, default: 0 },
    lucroReal: { type: Number, default: 0 },
  },
  { _id: false }
);

const orcamentoItemSchema = new mongoose.Schema(
  {
    produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantidade: { type: Number, min: 1, default: 1 },
    impressora: { type: mongoose.Schema.Types.ObjectId, ref: 'Impressora' },
    material: { type: String, trim: true, default: 'PLA' },
    cor: { type: String, trim: true },
    pesoEstimado: { type: Number, min: 0, default: 0 },
    tempoImpressao: { type: Number, min: 0, default: 0 },
    valor: { type: Number, min: 0, default: 0 },
    custos: { type: orcamentoCostSchema, default: () => ({}) },
    observacoes: { type: String, trim: true },
  },
  { _id: true }
);

const OrcamentoSchema = new mongoose.Schema({
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantidade: { type: Number, min: 1, default: 1 },
  impressora: { type: mongoose.Schema.Types.ObjectId, ref: 'Impressora' },
  material: { type: String },
  cor: { type: String },
  pesoEstimado: { type: Number },
  tempoImpressao: { type: Number },
  valor: { type: Number },
  fotoPedidoNome: { type: String },
  fotoPedido: { type: String },
  fotosPedidoNomes: {
    type: [{ type: String, trim: true }],
    validate: {
      validator: (arr) => !arr || arr.length <= 5,
      message: 'Maximo de 5 nomes de fotos por orcamento.',
    },
  },
  fotosPedido: {
    type: [{ type: String }],
    default: undefined,
    validate: {
      validator: (arr) => !arr || arr.length <= 5,
      message: 'Maximo de 5 fotos por orcamento.',
    },
  },
  fotosPedidoUploads: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Upload' }],
    validate: {
      validator: (arr) => !arr || arr.length <= 5,
      message: 'Maximo de 5 referencias de fotos por orcamento.',
    },
  },
  dataEntregaPrevista: { type: Date },
  numeroOrcamento: {
    type: Number,
    unique: true,
    sparse: true,
    index: true,
  },
  codigoOrcamento: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  itens: {
    type: [orcamentoItemSchema],
    default: undefined,
  },
  status: { type: String, default: 'orcamento' },
  custos: { type: orcamentoCostSchema, default: () => ({}) },
  observacoes: { type: String },
}, { timestamps: true, collection: 'Orcamentos' });

export default mongoose.model('Orcamento', OrcamentoSchema);
