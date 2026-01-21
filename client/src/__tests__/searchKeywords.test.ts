import { describe, it, expect } from 'vitest';
import {
  searchKeywords,
  getMatchingOccupancyIds,
  getAutocompleteSuggestions,
  getDidYouMeanSuggestions,
  getAllKeywords
} from '../lib/searchKeywords';

describe('searchKeywords', () => {
  describe('searchKeywords data structure', () => {
    it('should have keywords for all major occupancy types', () => {
      const expectedIds = ['A-1', 'A-2', 'A-3', 'A-4', 'B-1', 'B-2', 'B-3', 'C-1', 'C-2', 'D', 'E', 'F-1', 'F-2', 'F-3'];
      expectedIds.forEach(id => {
        expect(searchKeywords[id]).toBeDefined();
        expect(Array.isArray(searchKeywords[id])).toBe(true);
        expect(searchKeywords[id].length).toBeGreaterThan(0);
      });
    });

    it('should have church keyword mapped to A-2', () => {
      expect(searchKeywords['A-2']).toContain('church');
    });

    it('should have hospital keyword mapped to B-2', () => {
      expect(searchKeywords['B-2']).toContain('hospital');
    });

    it('should have basement suite keyword mapped to C-2', () => {
      expect(searchKeywords['C-2']).toContain('basement suite');
    });
  });

  describe('getMatchingOccupancyIds', () => {
    it('should return A-2 for "church"', () => {
      const result = getMatchingOccupancyIds('church');
      expect(result).toContain('A-2');
    });

    it('should return B-2 for "hospital"', () => {
      const result = getMatchingOccupancyIds('hospital');
      expect(result).toContain('B-2');
    });

    it('should return C-2 for "basement suite"', () => {
      const result = getMatchingOccupancyIds('basement suite');
      expect(result).toContain('C-2');
    });

    it('should return C-1 for "hotel"', () => {
      const result = getMatchingOccupancyIds('hotel');
      expect(result).toContain('C-1');
    });

    it('should return E for "store"', () => {
      const result = getMatchingOccupancyIds('store');
      expect(result).toContain('E');
    });

    it('should return empty array for non-matching query', () => {
      const result = getMatchingOccupancyIds('xyznonexistent');
      expect(result).toEqual([]);
    });

    it('should be case insensitive', () => {
      const result1 = getMatchingOccupancyIds('CHURCH');
      const result2 = getMatchingOccupancyIds('church');
      expect(result1).toEqual(result2);
    });
  });

  describe('getAutocompleteSuggestions', () => {
    it('should return suggestions for partial input "chu"', () => {
      const result = getAutocompleteSuggestions('chu');
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(s => s.includes('church'))).toBe(true);
    });

    it('should return suggestions for partial input "hos"', () => {
      const result = getAutocompleteSuggestions('hos');
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(s => s.includes('hospital') || s.includes('hostel') || s.includes('hospice'))).toBe(true);
    });

    it('should return empty array for very short input', () => {
      const result = getAutocompleteSuggestions('a');
      expect(result).toEqual([]);
    });

    it('should limit results to maxResults parameter', () => {
      const result = getAutocompleteSuggestions('a', 3);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should prioritize prefix matches', () => {
      const result = getAutocompleteSuggestions('church');
      if (result.length > 0) {
        expect(result[0]).toBe('church');
      }
    });
  });

  describe('getDidYouMeanSuggestions', () => {
    it('should suggest "hospital" for misspelled "hospitl"', () => {
      const result = getDidYouMeanSuggestions('hospitl');
      expect(result.some(s => s.includes('hospital') || s.includes('hostel') || s.includes('hospice'))).toBe(true);
    });

    it('should suggest similar words for "churh"', () => {
      const result = getDidYouMeanSuggestions('churh');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array for very short input', () => {
      const result = getDidYouMeanSuggestions('a');
      expect(result).toEqual([]);
    });

    it('should limit results to maxResults parameter', () => {
      const result = getDidYouMeanSuggestions('hosp', 2);
      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getAllKeywords', () => {
    it('should return all unique keywords', () => {
      const result = getAllKeywords();
      expect(result.length).toBeGreaterThan(50);
    });

    it('should return sorted keywords', () => {
      const result = getAllKeywords();
      const sorted = [...result].sort();
      expect(result).toEqual(sorted);
    });

    it('should contain common building types', () => {
      const result = getAllKeywords();
      expect(result).toContain('church');
      expect(result).toContain('hospital');
      expect(result).toContain('office');
      expect(result).toContain('store');
    });
  });
});
