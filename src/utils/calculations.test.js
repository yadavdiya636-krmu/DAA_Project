import { describe, it, expect } from 'vitest';
import { sumCost, computeSavings, measure } from './calculations.js';
import { primMST } from '../algorithms/prim.js';

describe('Calculations', () => {
  it('sums edge weights using real values', () => {
    expect(sumCost([{ cost: 10 }, { cost: 2.5 }, { cost: 'x' }])).toBe(12.5);
  });

  it('computes savings and percentage correctly', () => {
    const savings = computeSavings(200, 76);
    expect(savings.amount).toBe(124);
    expect(savings.percentage).toBe(62);
    expect(computeSavings(0, 0).percentage).toBe(0);
  });

  it('measures repeated executions without modifying results', () => {
    const result = measure(() => primMST(['A', 'B'], [{ id: 'e', source: 'A', target: 'B', cost: 9 }]), 3);
    expect(result.totalCost).toBe(9);
    expect(result.sampleCount).toBe(3);
    expect(result.samples).toHaveLength(3);
  });
});
