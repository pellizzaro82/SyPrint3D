import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isAdmin: { type: Boolean, default: false },
    planCode: { type: String, default: 'basic', trim: true, lowercase: true },
    expirePlan: { type: Date },
    lastLogin: { type: Date },
    payment_status: { type: String, default: 'active', trim: true },
    whatsapp: { type: String, trim: true, default: '' },
  },
  { timestamps: true, collection: 'Users' }
);

export const User = mongoose.model('User', userSchema);
