import mongoose from 'mongoose';

const printerSchema = new mongoose.Schema(
  {
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    nome: { type: String, required: true, trim: true },
    modelo: { type: String, trim: true },
    consumoW: { type: Number, min: 0, default: 0 },
    custoKwh: { type: Number, min: 0, default: 0.95 },
    custoDepreciacaoHora: { type: Number, min: 0, default: 0 },
    horasUso: { type: Number, default: 0 },
    manutencaoEm: { type: Date },
    trocaBicoEm: { type: Date },
    erros: [{ type: String, trim: true }],
    uptimePercentual: { type: Number, default: 100 },
  },
  { timestamps: true, collection: 'Equipamentos' }
);

export const Printer = mongoose.model('Printer', printerSchema);
