import { describe, it, expect } from 'vitest';
import {
  occupancyKeywords,
  calculatorKeywords,
  codeKeywords,
  generalKeywords,
  getMatchingOccupancyIds,
  getAutocompleteSuggestions,
  getDidYouMeanSuggestions,
  getComprehensiveSearchResults,
  getTabForKeyword,
  getAllKeywords
} from '../lib/searchKeywords';

describe('Comprehensive Search Keywords', () => {
  describe('Occupancy Keywords', () => {
    it('should have keywords for all major occupancy types', () => {
      const expectedTypes = ['A-1', 'A-2', 'A-3', 'A-4', 'B-1', 'B-2', 'B-3', 'C-1', 'C-2', 'D', 'E', 'F-1', 'F-2', 'F-3'];
      expectedTypes.forEach(type => {
        expect(occupancyKeywords[type]).toBeDefined();
        expect(occupancyKeywords[type].length).toBeGreaterThan(0);
      });
    });

    it('should include common building type synonyms', () => {
      // Church should map to A-2
      expect(occupancyKeywords['A-2']).toContain('church');
      // Hospital should map to B-2
      expect(occupancyKeywords['B-2']).toContain('hospital');
      // Apartment should map to C-1
      expect(occupancyKeywords['C-1']).toContain('apartment');
      // Office should map to D
      expect(occupancyKeywords['D']).toContain('office');
      // Store should map to E
      expect(occupancyKeywords['E']).toContain('store');
    });

    it('should include natural language terms', () => {
      // Gym/fitness terms
      expect(occupancyKeywords['A-2']).toContain('gym');
      expect(occupancyKeywords['A-2']).toContain('fitness center');
      // Restaurant terms
      expect(occupancyKeywords['A-2']).toContain('restaurant');
      expect(occupancyKeywords['A-2']).toContain('cafe');
      // Secondary suite terms
      expect(occupancyKeywords['C-2']).toContain('basement suite');
      expect(occupancyKeywords['C-2']).toContain('granny flat');
    });
  });

  describe('Calculator Keywords', () => {
    it('should have keywords for fire safety calculators', () => {
      expect(calculatorKeywords['fire-separation']).toBeDefined();
      expect(calculatorKeywords['fire-separation'].keywords).toContain('fire separation');
      expect(calculatorKeywords['fire-separation'].tab).toBe('fire-safety');
    });

    it('should have keywords for structural calculators', () => {
      expect(calculatorKeywords['floor-joist']).toBeDefined();
      expect(calculatorKeywords['floor-joist'].keywords).toContain('floor joist');
      expect(calculatorKeywords['beam-span']).toBeDefined();
      expect(calculatorKeywords['beam-span'].keywords).toContain('beam span');
    });

    it('should have keywords for plumbing calculators', () => {
      expect(calculatorKeywords['water-closet']).toBeDefined();
      expect(calculatorKeywords['water-closet'].keywords).toContain('toilet');
      expect(calculatorKeywords['fixture-unit']).toBeDefined();
    });

    it('should have keywords for electrical calculators', () => {
      expect(calculatorKeywords['service-load']).toBeDefined();
      expect(calculatorKeywords['service-load'].keywords).toContain('electrical load');
      expect(calculatorKeywords['voltage-drop']).toBeDefined();
    });

    it('should have keywords for design tools', () => {
      expect(calculatorKeywords['stair-design']).toBeDefined();
      expect(calculatorKeywords['stair-design'].keywords).toContain('stair');
      expect(calculatorKeywords['guard-handrail']).toBeDefined();
      expect(calculatorKeywords['guard-handrail'].keywords).toContain('guardrail');
    });
  });

  describe('Code Section Keywords', () => {
    it('should have keywords for major NBC parts', () => {
      expect(codeKeywords['part-3']).toBeDefined();
      expect(codeKeywords['part-3'].keywords).toContain('part 3');
      expect(codeKeywords['part-9']).toBeDefined();
      expect(codeKeywords['part-9'].keywords).toContain('part 9');
      expect(codeKeywords['part-10']).toBeDefined();
    });

    it('should have keywords for important tables', () => {
      expect(codeKeywords['table-3.1.17.1']).toBeDefined();
      expect(codeKeywords['table-3.1.17.1'].keywords).toContain('occupant load table');
      expect(codeKeywords['table-3.2.2']).toBeDefined();
      expect(codeKeywords['table-3.7.2.2']).toBeDefined();
    });
  });

  describe('General Keywords', () => {
    it('should have keywords for common building terms', () => {
      expect(generalKeywords['sprinkler']).toBeDefined();
      expect(generalKeywords['sprinkler'].keywords).toContain('fire sprinkler');
      expect(generalKeywords['hvac']).toBeDefined();
      expect(generalKeywords['permit']).toBeDefined();
      expect(generalKeywords['inspection']).toBeDefined();
    });
  });

  describe('getMatchingOccupancyIds', () => {
    it('should return matching occupancy IDs for keywords', () => {
      const churchResults = getMatchingOccupancyIds('church');
      expect(churchResults).toContain('A-2');

      const hospitalResults = getMatchingOccupancyIds('hospital');
      expect(hospitalResults).toContain('B-2');

      const officeResults = getMatchingOccupancyIds('office');
      expect(officeResults).toContain('D');
    });

    it('should handle partial matches', () => {
      const results = getMatchingOccupancyIds('rest'); // Should match restaurant
      expect(results).toContain('A-2');
    });

    it('should return empty array for non-matching queries', () => {
      const results = getMatchingOccupancyIds('xyznonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('getAutocompleteSuggestions', () => {
    it('should return suggestions for partial input', () => {
      const suggestions = getAutocompleteSuggestions('sta');
      expect(suggestions.length).toBeGreaterThan(0);
      // Should include stair, stadium, station, etc.
      const keywords = suggestions.map(s => s.keyword);
      expect(keywords.some(k => k.includes('sta'))).toBe(true);
    });

    it('should include type information in suggestions', () => {
      const suggestions = getAutocompleteSuggestions('fire');
      expect(suggestions.length).toBeGreaterThan(0);
      // Should have type property
      suggestions.forEach(s => {
        expect(s.type).toBeDefined();
        expect(['occupancy', 'calculator', 'code', 'general']).toContain(s.type);
      });
    });

    it('should limit results to maxResults', () => {
      const suggestions = getAutocompleteSuggestions('a', 5);
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    it('should return empty for short queries', () => {
      const suggestions = getAutocompleteSuggestions('a');
      expect(suggestions).toEqual([]);
    });
  });

  describe('getDidYouMeanSuggestions', () => {
    it('should suggest similar words for misspellings', () => {
      const suggestions = getDidYouMeanSuggestions('hospitl');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContain('hospital');
    });

    it('should suggest similar words for typos', () => {
      const suggestions = getDidYouMeanSuggestions('restrant');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContain('restaurant');
    });

    it('should return empty for very short queries', () => {
      const suggestions = getDidYouMeanSuggestions('a');
      expect(suggestions).toEqual([]);
    });
  });

  describe('getComprehensiveSearchResults', () => {
    it('should return results from multiple categories', () => {
      const results = getComprehensiveSearchResults('fire');
      expect(results.length).toBeGreaterThan(0);
      
      const types = results.map(r => r.type);
      // Should include calculator results (fire separation, fire alarm, etc.)
      expect(types).toContain('calculator');
    });

    it('should include tab information for navigation', () => {
      const results = getComprehensiveSearchResults('stair');
      const stairResult = results.find(r => r.type === 'calculator');
      expect(stairResult).toBeDefined();
      expect(stairResult?.tab).toBeDefined();
    });

    it('should return occupancy results', () => {
      const results = getComprehensiveSearchResults('church');
      const occupancyResult = results.find(r => r.type === 'occupancy');
      expect(occupancyResult).toBeDefined();
      expect(occupancyResult?.id).toBe('A-2');
    });

    it('should return empty for short queries', () => {
      const results = getComprehensiveSearchResults('a');
      expect(results).toEqual([]);
    });
  });

  describe('getTabForKeyword', () => {
    it('should return correct tab for calculator keywords', () => {
      expect(getTabForKeyword('fire separation')).toBe('fire-safety');
      expect(getTabForKeyword('water closet')).toBe('plumbing');
      expect(getTabForKeyword('voltage drop')).toBe('electrical');
      // Stair is in fire-safety tab based on actual implementation
      const stairTab = getTabForKeyword('stair');
      expect(['fire-safety', 'design-tools', 'building']).toContain(stairTab);
    });

    it('should return correct tab for code keywords', () => {
      expect(getTabForKeyword('part 3')).toBe('fire-safety');
      expect(getTabForKeyword('part 9')).toBe('building');
    });

    it('should return null for unknown keywords', () => {
      expect(getTabForKeyword('xyznonexistent')).toBeNull();
    });
  });

  describe('getAllKeywords', () => {
    it('should return a comprehensive list of all keywords', () => {
      const allKeywords = getAllKeywords();
      expect(allKeywords.length).toBeGreaterThan(100);
      
      // Should include occupancy keywords
      expect(allKeywords).toContain('church');
      expect(allKeywords).toContain('hospital');
      
      // Should include calculator keywords
      expect(allKeywords).toContain('stair');
      expect(allKeywords).toContain('fire separation');
      
      // Should include code keywords
      expect(allKeywords).toContain('part 3');
    });

    it('should return sorted keywords', () => {
      const allKeywords = getAllKeywords();
      const sorted = [...allKeywords].sort();
      expect(allKeywords).toEqual(sorted);
    });
  });
});

describe('Search Keyword Coverage', () => {
  it('should have at least 500 unique keywords', () => {
    const allKeywords = getAllKeywords();
    expect(allKeywords.length).toBeGreaterThan(500);
  });

  it('should cover all major building types', () => {
    const buildingTypes = [
      'theatre', 'church', 'gym', 'restaurant', 'school', 'library', 'museum',
      'arena', 'stadium', 'pool', 'jail', 'prison', 'hospital', 'nursing home',
      'apartment', 'house', 'hotel', 'basement suite', 'office', 'bank', 'salon',
      'store', 'mall', 'supermarket', 'factory', 'warehouse', 'garage'
    ];
    
    const allKeywords = getAllKeywords();
    buildingTypes.forEach(type => {
      expect(allKeywords).toContain(type);
    });
  });

  it('should cover all major calculator types', () => {
    const calculatorTypes = [
      'fire separation', 'occupant load', 'exit', 'travel distance',
      'stair', 'guardrail', 'handrail', 'ramp', 'beam', 'joist', 'rafter',
      'water closet', 'fixture unit', 'voltage drop', 'service load'
    ];
    
    const allKeywords = getAllKeywords();
    calculatorTypes.forEach(type => {
      expect(allKeywords.some(k => k.includes(type))).toBe(true);
    });
  });
});
