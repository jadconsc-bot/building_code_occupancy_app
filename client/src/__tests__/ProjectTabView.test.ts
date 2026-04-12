/**
 * Unit tests for ProjectTabView
 * Tests badge logic, metric comparisons, and status determination
 * Per PROJECT_TAB_SPECIFICATION v1.0
 */

import { describe, it, expect } from 'vitest';

// ============================================================================
// PURE FUNCTIONS FOR TESTING
// ============================================================================

/**
 * Get badge configuration based on compliance status
 */
const getBadgeConfig = (status: 'PASS' | 'FAIL' | 'IN_REVIEW' | 'UNKNOWN') => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    PASS: { bg: '#10B981', text: 'white', label: 'PASS' },
    FAIL: { bg: '#EF4444', text: 'white', label: 'FAIL' },
    IN_REVIEW: { bg: '#FBBF24', text: '#78350F', label: 'IN REVIEW' },
    UNKNOWN: { bg: '#D1D5DB', text: '#374151', label: '—' },
  };
  return config[status] || config.UNKNOWN;
};

/**
 * Determine if occupancy is within limits
 */
const isOccupancyOK = (current: number | null, max: number | null): boolean | null => {
  if (current === null || max === null) return null;
  return current < max;
};

/**
 * Determine if egress requirements are met
 */
const isEgressOK = (provided: number | null, required: number | null): boolean | null => {
  if (provided === null || required === null) return null;
  return provided >= required;
};

/**
 * Determine if travel distance is within limits (40m)
 */
const isTravelDistanceOK = (actual: number | null, limit: number = 40): boolean | null => {
  if (actual === null) return null;
  return actual <= limit;
};

/**
 * Get indicator color (green = OK, red = violation)
 */
const getIndicatorColor = (isOK: boolean | null): string => {
  if (isOK === null) return '#D1D5DB'; // Gray for unknown
  return isOK ? '#10B981' : '#EF4444'; // Green or red
};

// ============================================================================
// TEST SUITES
// ============================================================================

describe('Badge Logic', () => {
  it('returns PASS badge for compliant project', () => {
    const badge = getBadgeConfig('PASS');
    expect(badge.bg).toBe('#10B981');
    expect(badge.text).toBe('white');
    expect(badge.label).toBe('PASS');
  });

  it('returns FAIL badge for non-compliant project', () => {
    const badge = getBadgeConfig('FAIL');
    expect(badge.bg).toBe('#EF4444');
    expect(badge.text).toBe('white');
    expect(badge.label).toBe('FAIL');
  });

  it('returns IN_REVIEW badge for projects under review', () => {
    const badge = getBadgeConfig('IN_REVIEW');
    expect(badge.bg).toBe('#FBBF24');
    expect(badge.text).toBe('#78350F');
    expect(badge.label).toBe('IN REVIEW');
  });

  it('returns UNKNOWN badge for unknown status', () => {
    const badge = getBadgeConfig('UNKNOWN');
    expect(badge.bg).toBe('#D1D5DB');
    expect(badge.text).toBe('#374151');
    expect(badge.label).toBe('—');
  });

  it('returns UNKNOWN badge for invalid status', () => {
    const badge = getBadgeConfig('INVALID' as any);
    expect(badge.bg).toBe('#D1D5DB');
    expect(badge.label).toBe('—');
  });
});

describe('Occupancy Metric Comparisons', () => {
  it('returns true when occupancy is within limits (current < max)', () => {
    expect(isOccupancyOK(45, 50)).toBe(true);
  });

  it('returns false when occupancy equals max (at capacity)', () => {
    expect(isOccupancyOK(50, 50)).toBe(false);
  });

  it('returns false when occupancy exceeds max (over capacity)', () => {
    expect(isOccupancyOK(55, 50)).toBe(false);
  });

  it('returns null when current is null', () => {
    expect(isOccupancyOK(null, 50)).toBe(null);
  });

  it('returns null when max is null', () => {
    expect(isOccupancyOK(45, null)).toBe(null);
  });

  it('returns null when both are null', () => {
    expect(isOccupancyOK(null, null)).toBe(null);
  });

  it('handles zero values correctly', () => {
    expect(isOccupancyOK(0, 50)).toBe(true);
    expect(isOccupancyOK(0, 0)).toBe(false);
  });
});

describe('Egress Metric Comparisons', () => {
  it('returns true when egress is sufficient (provided >= required)', () => {
    expect(isEgressOK(2, 2)).toBe(true);
  });

  it('returns true when egress exceeds requirement', () => {
    expect(isEgressOK(3, 2)).toBe(true);
  });

  it('returns false when egress is insufficient (provided < required)', () => {
    expect(isEgressOK(1, 2)).toBe(false);
  });

  it('returns null when provided is null', () => {
    expect(isEgressOK(null, 2)).toBe(null);
  });

  it('returns null when required is null', () => {
    expect(isEgressOK(2, null)).toBe(null);
  });

  it('returns null when both are null', () => {
    expect(isEgressOK(null, null)).toBe(null);
  });

  it('handles zero values correctly', () => {
    expect(isEgressOK(0, 0)).toBe(true);
    expect(isEgressOK(0, 1)).toBe(false);
  });
});

describe('Travel Distance Metric Comparisons', () => {
  it('returns true when travel distance is within 40m limit', () => {
    expect(isTravelDistanceOK(35)).toBe(true);
  });

  it('returns true when travel distance equals 40m limit', () => {
    expect(isTravelDistanceOK(40)).toBe(true);
  });

  it('returns false when travel distance exceeds 40m limit', () => {
    expect(isTravelDistanceOK(45)).toBe(false);
  });

  it('returns null when actual distance is null', () => {
    expect(isTravelDistanceOK(null)).toBe(null);
  });

  it('supports custom limit parameter', () => {
    expect(isTravelDistanceOK(30, 50)).toBe(true);
    expect(isTravelDistanceOK(60, 50)).toBe(false);
  });

  it('handles zero values correctly', () => {
    expect(isTravelDistanceOK(0)).toBe(true);
  });

  it('handles negative values correctly (should still be OK)', () => {
    expect(isTravelDistanceOK(-5)).toBe(true);
  });
});

describe('Indicator Color Logic', () => {
  it('returns green (#10B981) when status is OK', () => {
    expect(getIndicatorColor(true)).toBe('#10B981');
  });

  it('returns red (#EF4444) when status is NOT OK', () => {
    expect(getIndicatorColor(false)).toBe('#EF4444');
  });

  it('returns gray (#D1D5DB) when status is unknown (null)', () => {
    expect(getIndicatorColor(null)).toBe('#D1D5DB');
  });
});

describe('Aggregate Compliance Logic', () => {
  /**
   * Determine if project has violations
   */
  const hasViolations = (
    occupancy_current: number | null,
    occupancy_max: number | null,
    egress_provided: number | null,
    egress_required: number | null,
    travel_distance: number | null
  ): boolean => {
    const occupancyOK = isOccupancyOK(occupancy_current, occupancy_max);
    const egressOK = isEgressOK(egress_provided, egress_required);
    const travelOK = isTravelDistanceOK(travel_distance);

    // If any metric is NOT OK, project has violations
    return occupancyOK === false || egressOK === false || travelOK === false;
  };

  it('returns false when all metrics are OK', () => {
    expect(hasViolations(45, 50, 2, 2, 35)).toBe(false);
  });

  it('returns true when occupancy is violated', () => {
    expect(hasViolations(50, 50, 2, 2, 35)).toBe(true);
  });

  it('returns true when egress is violated', () => {
    expect(hasViolations(45, 50, 1, 2, 35)).toBe(true);
  });

  it('returns true when travel distance is violated', () => {
    expect(hasViolations(45, 50, 2, 2, 45)).toBe(true);
  });

  it('returns true when multiple metrics are violated', () => {
    expect(hasViolations(50, 50, 1, 2, 45)).toBe(true);
  });

  it('returns false when metrics are null (data unavailable)', () => {
    expect(hasViolations(null, null, null, null, null)).toBe(false);
  });

  it('returns false when some metrics are null (partial data)', () => {
    expect(hasViolations(45, 50, null, null, 35)).toBe(false);
  });

  it('returns true when one metric is violated and others are null', () => {
    expect(hasViolations(50, 50, null, null, null)).toBe(true);
  });
});

describe('Edge Cases and Boundary Conditions', () => {
  it('handles very large numbers', () => {
    expect(isOccupancyOK(1000000, 2000000)).toBe(true);
    expect(isTravelDistanceOK(1000000)).toBe(false);
  });

  it('handles decimal values', () => {
    expect(isOccupancyOK(45.5, 50.5)).toBe(true);
    expect(isTravelDistanceOK(40.1)).toBe(false);
  });

  it('handles mixed null and non-null values', () => {
    expect(isOccupancyOK(45, null)).toBe(null);
    expect(isEgressOK(null, 2)).toBe(null);
  });
});
