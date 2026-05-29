import mongoose from 'mongoose';

export function getRequestUserId(req) {
  const userId = String(req?.auth?.sub || '').trim();
  return userId;
}

export function requireRequestUserObjectId(req) {
  const userId = requireRequestUserId(req);
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error('Sessao invalida.');
    error.status = 401;
    error.statusCode = 401;
    throw error;
  }
  return new mongoose.Types.ObjectId(userId);
}

export function requireRequestUserId(req) {
  const userId = getRequestUserId(req);
  if (!userId) {
    const error = new Error('Sessao invalida.');
    error.status = 401;
    error.statusCode = 401;
    throw error;
  }
  return userId;
}

export function withOwnerScope(req, criteria = {}) {
  const userId = requireRequestUserId(req);
  return {
    ...criteria,
    ownerUserId: userId,
  };
}

export function withOwnerPayload(req, payload = {}) {
  const userId = requireRequestUserId(req);
  return {
    ...payload,
    ownerUserId: userId,
  };
}
