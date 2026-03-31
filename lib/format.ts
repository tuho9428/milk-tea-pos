export function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}

export function formatTaxRate(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}
