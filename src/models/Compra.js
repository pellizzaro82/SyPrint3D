import mongoose from 'mongoose';

const CompraSchema = new mongoose.Schema({
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fornecedor: { type: String },
  produto: { type: String },
  quantidade: { type: Number },
  valorTotal: { type: Number },
  dataCompra: { type: Date },
  observacoes: { type: String },
}, { timestamps: true, collection: 'Compras' });

export default mongoose.model('Compra', CompraSchema);
