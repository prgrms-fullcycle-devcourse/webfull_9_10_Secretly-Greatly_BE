export function formatOptimizerLog(code: string, avgPrice: number, quantity: number, rateOfReturn: number): string {
  const formattedPrice = avgPrice.toLocaleString();
  const formattedQty = quantity.toFixed(1);
  const formattedReturn = rateOfReturn.toFixed(2);

  return `[Optimizer Info] Asset '${code}' thread tuned. Expected AvgPrice: ${formattedPrice}, Total Qty: ${formattedQty}, ReturnRatio: ${formattedReturn}. Break-even threshold optimized.`;
}
