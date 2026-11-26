export const sumCost = (edges = []) =>
  edges.reduce((total, edge) => total + (Number.isFinite(Number(edge.cost)) ? Number(edge.cost) : 0), 0);

export function computeSavings(originalCost, optimizedCost) {
  const original = Number(originalCost) || 0;
  const optimized = Number(optimizedCost) || 0;
  const amount = Math.max(0, original - optimized);
  const percentage = original > 0 ? (amount / original) * 100 : 0;
  return { original, optimized, amount, percentage };
}

export function formatCurrency(value, currency = 'USD') {
  const number = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: number % 1 === 0 ? 0 : 2,
  }).format(number);
}

export const formatNumber = (value) => new Intl.NumberFormat('en-US').format(Number(value) || 0);

export function formatTime(ms) {
  const value = Number(ms) || 0;
  if (value < 1) return `${value.toFixed(4)} ms`;
  if (value < 1000) return `${value.toFixed(3)} ms`;
  return `${(value / 1000).toFixed(3)} s`;
}

/** Deterministic average of repeated real measurements, used by benchmark charts. */
export function measure(referenceFn, repeats = 3) {
  const times = [];
  let lastResult;
  for (let i = 0; i < repeats; i += 1) {
    lastResult = referenceFn();
    times.push(lastResult.executionTimeMs);
  }
  return {
    ...lastResult,
    executionTimeMs: times.reduce((a, b) => a + b, 0) / times.length,
    sampleCount: repeats,
    samples: times,
  };
}

export function timestampLabel(timestamp) {
  if (!timestamp) return 'Never';
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
