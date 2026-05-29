import mongoose from 'mongoose';

const orderCostSchema = new mongoose.Schema(
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

const orderItemSchema = new mongoose.Schema(
  {
    produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantidade: { type: Number, min: 1, default: 1 },
    material: { type: String, trim: true, default: 'PLA' },
    cor: { type: String, trim: true },
    pesoEstimado: { type: Number, required: true, min: 0 },
    tempoImpressao: { type: Number, required: true, min: 0 },
    valor: { type: Number, required: true, min: 0 },
    filamento: { type: mongoose.Schema.Types.ObjectId, ref: 'Filament' },
    impressora: { type: mongoose.Schema.Types.ObjectId, ref: 'Printer' },
    custos: { type: orderCostSchema, default: () => ({}) },
    observacoes: { type: String, trim: true },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantidade: { type: Number, min: 1, default: 1 },
    stl: { type: String, trim: true },
    stlNome: { type: String, trim: true },
    stlArquivo: { type: String },
    fotoPedidoNome: { type: String, trim: true },
    fotoPedido: { type: String },
    fotosPedidoNomes: {
      type: [{ type: String, trim: true }],
      validate: {
        validator: (arr) => !arr || arr.length <= 5,
        message: 'Maximo de 5 nomes de fotos por pedido.',
      },
    },
    fotosPedido: {
      type: [{ type: String }],
      default: undefined,
      validate: {
        validator: (arr) => !arr || arr.length <= 5,
        message: 'Maximo de 5 fotos por pedido.',
      },
    },
    fotosPedidoUploads: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Upload' }],
      validate: {
        validator: (arr) => !arr || arr.length <= 5,
        message: 'Maximo de 5 referencias de fotos por pedido.',
      },
    },
    cor: { type: String, trim: true },
    material: { type: String, trim: true, default: 'PLA' },
    pesoEstimado: { type: Number, required: true, min: 0 },
    tempoImpressao: { type: Number, required: true, min: 0 },
    valor: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['orcamento', 'aprovado', 'em_producao', 'finalizacao', 'enviado', 'entregue'],
      default: 'orcamento',
    },
    numeroPedido: {
      type: Number,
      unique: true,
      sparse: true,
      index: true,
    },
    codigoPedido: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    lane: {
      type: String,
      enum: ['recebido', 'imprimindo', 'acabamento', 'pronto', 'entrega', 'enviado', 'entregue'],
      default: 'recebido',
    },
    itens: {
      type: [orderItemSchema],
      default: undefined,
    },
    filamento: { type: mongoose.Schema.Types.ObjectId, ref: 'Filament' },
    impressora: { type: mongoose.Schema.Types.ObjectId, ref: 'Printer' },
    custos: { type: orderCostSchema, default: () => ({}) },
    observacoes: { type: String, trim: true },
    historicoStatus: [{
      status: { type: String },
      data: { type: Date, default: Date.now },
    }],
    dataEntregaPrevista: { type: Date },
  },
  { timestamps: true, collection: 'Pedidos' }
);

export const Order = mongoose.model('Order', orderSchema);
