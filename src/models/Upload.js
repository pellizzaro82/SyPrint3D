import mongoose from 'mongoose';

const uploadSchema = new mongoose.Schema(
  {
    hash: { type: String, required: true, unique: true, index: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    nomeArquivo: { type: String, trim: true },
    tamanhoBytes: { type: Number, min: 0, default: 0 },
    dataBase64: { type: String, required: true },
  },
  { timestamps: true, collection: 'uploads' }
);

export const Upload = mongoose.model('Upload', uploadSchema);
