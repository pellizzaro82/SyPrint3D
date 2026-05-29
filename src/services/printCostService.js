export function calcularCustosImpressao(payload) {
  const pesoEstimado = Number(payload.pesoEstimado || 0);
  const tempoImpressao = Number(payload.tempoImpressao || 0);
  const valor = Number(payload.valor || 0);

  const filamentoKg = Number(payload?.custos?.filamentoKg || 120);
  const energiaKwh = Number(payload?.custos?.energiaKwh || 0.8);
  const custoKwh = Number(payload?.custos?.custoKwh || 0.95);
  const custoDesgasteHora = Number(payload?.custos?.custoDesgasteHora || 0.5);

  const custoFilamento = (pesoEstimado / 1000) * filamentoKg;
  const horas = tempoImpressao / 60;
  const custoEnergia = horas * energiaKwh * custoKwh;
  const custoDesgaste = horas * custoDesgasteHora;
  const custoTotal = custoFilamento + custoEnergia + custoDesgaste;
  const lucroReal = valor - custoTotal;

  return {
    filamentoKg,
    custoFilamento: Number(custoFilamento.toFixed(2)),
    energiaKwh,
    custoKwh,
    custoEnergia: Number(custoEnergia.toFixed(2)),
    custoDesgasteHora,
    custoDesgaste: Number(custoDesgaste.toFixed(2)),
    custoTotal: Number(custoTotal.toFixed(2)),
    lucroReal: Number(lucroReal.toFixed(2)),
  };
}

export function sugerirFilamentoParaPedido({ filamentos, pesoEstimado, corDesejada, materialDesejado }) {
  const candidatos = (filamentos || []).filter((filamento) => {
    const corOk = !corDesejada || filamento.cor?.toLowerCase() === corDesejada.toLowerCase();
    const materialOk =
      !materialDesejado || filamento.material?.toLowerCase() === materialDesejado.toLowerCase();
    const estoqueOk = Number(filamento.estoqueAtual || 0) >= Number(pesoEstimado || 0);

    return corOk && materialOk && estoqueOk;
  });

  return candidatos.sort((a, b) => Number(a.precoPorKg || 0) - Number(b.precoPorKg || 0))[0] || null;
}

export function sugerirImpressoraParaPedido({ impressoras }) {
  const candidatos = (impressoras || []).filter((impressora) => Number(impressora.uptimePercentual || 0) >= 85);
  return candidatos.sort((a, b) => Number(a.horasUso || 0) - Number(b.horasUso || 0))[0] || null;
}
