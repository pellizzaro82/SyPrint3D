import mongoose from 'mongoose';

const financeEntrySchema = new mongoose.Schema(
  {
    tipo: { type: String, enum: ['entrada', 'saida'], required: true },
    categoria: { type: String, required: true, trim: true },
    metodo: { type: String, trim: true },
    fornecedor: { type: String, trim: true },
    quantidade: { type: Number, min: 0, default: 1 },
    valorUnitario: { type: Number, min: 0, default: 0 },
    valor: { type: Number, required: true, min: 0 },
    descricao: { type: String, trim: true },
    pedido: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    data: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'Compras' }
);

export const FinanceEntry = mongoose.model('FinanceEntry', financeEntrySchema);
