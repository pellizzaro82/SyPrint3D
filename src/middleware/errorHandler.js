export function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Rota nao encontrada.' });
}

function getFriendlyFieldLabel(path) {
  const labels = {
    cliente: 'Cliente',
    produto: 'Produto',
    impressora: 'Equipamento',
    material: 'Material',
    filamento: 'Filamento',
    pedido: 'Pedido',
    valor: 'Valor',
    quantidade: 'Quantidade',
    pesoEstimado: 'Peso estimado',
    tempoImpressao: 'Tempo de impressao',
    categoria: 'Categoria',
    fornecedor: 'Fornecedor',
  };

  return labels[String(path || '').trim()] || 'Campo';
}

function getFriendlyValidationMessage(err) {
  if (!err) return '';

  if (err.name === 'CastError') {
    const label = getFriendlyFieldLabel(err.path);
    if (String(err.kind || '').toLowerCase() === 'objectid') {
      return `${label} invalido. Selecione um valor valido.`;
    }
    return `${label} invalido.`;
  }

  if (err.name === 'ValidationError' && err.errors) {
    const messages = Object.values(err.errors)
      .map((fieldError) => {
        if (fieldError?.name === 'CastError') {
          const label = getFriendlyFieldLabel(fieldError.path);
          return `${label} invalido. Selecione um valor valido.`;
        }

        if (fieldError?.kind === 'required') {
          const label = getFriendlyFieldLabel(fieldError.path);
          return `${label} e obrigatorio.`;
        }

        return String(fieldError?.message || '').trim();
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages[0];
    }

    return 'Dados informados sao invalidos. Revise os campos e tente novamente.';
  }

  if (err.code === 11000) {
    return 'Ja existe um registro com esses dados.';
  }

  return '';
}

export function errorHandler(err, req, res, next) {
  const friendlyMessage = getFriendlyValidationMessage(err);
  const statusCode = err.statusCode || (friendlyMessage ? 400 : 500);
  const message = friendlyMessage || err.message || 'Erro interno no servidor.';

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(statusCode).json({
    message,
    details: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });
}
