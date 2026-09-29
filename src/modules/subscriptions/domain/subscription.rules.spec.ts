import { describe, expect, it } from 'vitest';
import { pickBundleWithLatestRemainingQuota } from './subscription.rules.js';

describe('pickBundleWithLatestRemainingQuota', () => {
  const base = new Date('2026-01-01T00:00:00.000Z');

  it('picks the highest remaining finite quota', () => {
    const picked = pickBundleWithLatestRemainingQuota([
      {
        remainingMessages: 2,
        maxMessages: 10,
        createdAt: base,
      },
      {
        remainingMessages: 8,
        maxMessages: 10,
        createdAt: base,
      },
    ]);
    expect(picked?.remainingMessages).toBe(8);
  });

  it('uses newest createdAt on tie', () => {
    const newer = new Date('2026-02-01T00:00:00.000Z');
    const picked = pickBundleWithLatestRemainingQuota([
      {
        remainingMessages: 5,
        maxMessages: 10,
        createdAt: base,
      },
      {
        remainingMessages: 5,
        maxMessages: 10,
        createdAt: newer,
      },
    ]);
    expect(picked?.createdAt).toEqual(newer);
  });

  it('falls back to enterprise unlimited when finite are empty', () => {
    const picked = pickBundleWithLatestRemainingQuota([
      {
        remainingMessages: 0,
        maxMessages: 10,
        createdAt: base,
      },
      {
        remainingMessages: null,
        maxMessages: null,
        createdAt: base,
      },
    ]);
    expect(picked?.maxMessages).toBeNull();
  });
});
