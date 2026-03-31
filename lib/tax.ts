function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function roundTaxRate(value: number) {
  return Math.round(value * 10000) / 10000;
}

export function calculateOrderPricing(subtotalInput: number, taxRateInput: number) {
  const subtotal = roundCurrency(subtotalInput);
  const taxRateApplied = roundTaxRate(taxRateInput);
  const tax = roundCurrency(subtotal * taxRateApplied);
  const total = roundCurrency(subtotal + tax);

  return {
    subtotal,
    tax,
    total,
    taxRateApplied,
  };
}
