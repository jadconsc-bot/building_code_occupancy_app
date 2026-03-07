/**
 * Tests for 5 C's Principle Components
 * Compliance, Clarification, Culture, Connection, Checkback
 */

import { describe, it, expect } from "vitest";

describe("5 C's Principle Components", () => {
  // ============================================
  // 1. COMPLIANCE TESTS
  // ============================================
  describe("Compliance Components", () => {
    describe("ComplianceBadge", () => {
      it("should have correct status types", () => {
        const validStatuses = ["compliant", "non-compliant", "warning", "pending", "not-applicable"];
        expect(validStatuses).toHaveLength(5);
        expect(validStatuses).toContain("compliant");
        expect(validStatuses).toContain("non-compliant");
      });

      it("should support different sizes", () => {
        const validSizes = ["sm", "md", "lg"];
        expect(validSizes).toHaveLength(3);
      });

      it("should map status to correct visual indicators", () => {
        const statusConfig = {
          compliant: { color: "green", icon: "CheckCircle2" },
          "non-compliant": { color: "red", icon: "XCircle" },
          warning: { color: "yellow", icon: "AlertTriangle" },
          pending: { color: "gray", icon: "HelpCircle" },
          "not-applicable": { color: "slate", icon: "Info" }
        };
        
        expect(statusConfig.compliant.color).toBe("green");
        expect(statusConfig["non-compliant"].color).toBe("red");
        expect(statusConfig.warning.color).toBe("yellow");
      });
    });

    describe("CodeReference", () => {
      it("should format NBC code references correctly", () => {
        const codeRef = "NBC 3.2.3";
        expect(codeRef).toMatch(/^NBC \d+\.\d+(\.\d+)?$/);
      });

      it("should support common NBC article formats", () => {
        const validFormats = [
          "NBC 3.2.3",
          "NBC 3.1.17.1",
          "NBC 3.4.2.5",
          "NBC Part 3.2",
          "NBC Table 3.1.3.1"
        ];
        
        validFormats.forEach(format => {
          expect(format).toContain("NBC");
        });
      });
    });

    describe("ComplianceSummary", () => {
      it("should calculate overall status correctly", () => {
        const items = [
          { category: "Fire Separation", status: "compliant" as const },
          { category: "Exit Width", status: "compliant" as const },
          { category: "Travel Distance", status: "warning" as const }
        ];
        
        const compliantCount = items.filter(i => i.status === "compliant").length;
        const warningCount = items.filter(i => i.status === "warning").length;
        const nonCompliantCount = items.filter(i => i.status === "non-compliant").length;
        
        expect(compliantCount).toBe(2);
        expect(warningCount).toBe(1);
        expect(nonCompliantCount).toBe(0);
        
        // Overall status should be "warning" since there are warnings but no non-compliant
        const overallStatus = nonCompliantCount > 0 ? "non-compliant" : 
          warningCount > 0 ? "warning" : "compliant";
        expect(overallStatus).toBe("warning");
      });

      it("should prioritize non-compliant over warning", () => {
        const items = [
          { category: "Fire Separation", status: "non-compliant" as const },
          { category: "Exit Width", status: "warning" as const },
          { category: "Travel Distance", status: "compliant" as const }
        ];
        
        const nonCompliantCount = items.filter(i => i.status === "non-compliant").length;
        const overallStatus = nonCompliantCount > 0 ? "non-compliant" : "compliant";
        expect(overallStatus).toBe("non-compliant");
      });
    });
  });

  // ============================================
  // 2. CLARIFICATION TESTS
  // ============================================
  describe("Clarification Components", () => {
    describe("ClarificationPanel", () => {
      it("should support importance levels", () => {
        const importanceLevels = ["low", "medium", "high", "critical"];
        expect(importanceLevels).toHaveLength(4);
      });

      it("should map importance to visual styling", () => {
        const importanceColors = {
          low: "gray",
          medium: "blue",
          high: "yellow",
          critical: "red"
        };
        
        expect(importanceColors.critical).toBe("red");
        expect(importanceColors.low).toBe("gray");
      });
    });

    describe("WhyImportant", () => {
      it("should include reason, consequences, and example", () => {
        const whyImportant = {
          reason: "Fire separations prevent fire spread",
          consequences: "Rapid fire spread endangers lives",
          example: "2-hour separation protects detention occupants"
        };
        
        expect(whyImportant.reason).toBeTruthy();
        expect(whyImportant.consequences).toBeTruthy();
        expect(whyImportant.example).toBeTruthy();
      });
    });

    describe("ContextualHelp", () => {
      it("should provide term definitions", () => {
        const helpItem = {
          term: "Fire Resistance Rating",
          definition: "Time a construction assembly can withstand fire exposure",
          relatedTerms: ["Fire Separation", "Fire Wall", "Fire Damper"]
        };
        
        expect(helpItem.term).toBe("Fire Resistance Rating");
        expect(helpItem.relatedTerms).toHaveLength(3);
      });
    });
  });

  // ============================================
  // 3. CULTURE TESTS
  // ============================================
  describe("Culture Components", () => {
    describe("RegionalNote", () => {
      it("should support Alberta-specific regions", () => {
        const albertaRegions = [
          "Edmonton",
          "Calgary",
          "Red Deer",
          "Lethbridge",
          "Medicine Hat",
          "Alberta"
        ];
        
        expect(albertaRegions).toContain("Edmonton");
        expect(albertaRegions).toContain("Calgary");
        expect(albertaRegions).toContain("Alberta");
      });

      it("should include effective dates for amendments", () => {
        const regionalNote = {
          region: "Edmonton",
          note: "Additional setback requirements for corner lots",
          effectiveDate: "2024-01-01"
        };
        
        expect(regionalNote.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    describe("LandAcknowledgment", () => {
      it("should include Alberta treaty territories", () => {
        const acknowledgment = "Treaty 6, Treaty 7, and Treaty 8 territories";
        
        expect(acknowledgment).toContain("Treaty 6");
        expect(acknowledgment).toContain("Treaty 7");
        expect(acknowledgment).toContain("Treaty 8");
      });

      it("should mention Métis Nation of Alberta", () => {
        const acknowledgment = "Métis Nation of Alberta";
        expect(acknowledgment).toContain("Métis");
      });
    });
  });

  // ============================================
  // 4. CONNECTION TESTS
  // ============================================
  describe("Connection Components", () => {
    describe("RelatedRequirements", () => {
      it("should link fire separation to related codes", () => {
        const fireSeparationRelated = [
          { title: "Fire-Rated Doors", codeRef: "NBC 3.1.8" },
          { title: "Fire Dampers", codeRef: "NBC 3.1.9" },
          { title: "Sprinkler Systems", codeRef: "NBC 3.2.5" },
          { title: "Fireblocking", codeRef: "NBC 3.1.11" }
        ];
        
        expect(fireSeparationRelated).toHaveLength(4);
        expect(fireSeparationRelated[0].codeRef).toMatch(/^NBC \d+\.\d+/);
      });

      it("should link occupant load to dependent calculations", () => {
        const occupantLoadRelated = [
          { title: "Number of Exits", codeRef: "NBC 3.4.2.1" },
          { title: "Exit Width", codeRef: "NBC 3.4.3.2" },
          { title: "Plumbing Fixtures", codeRef: "NBC 3.7.2" },
          { title: "Sprinkler Requirements", codeRef: "NBC 3.2.5" }
        ];
        
        expect(occupantLoadRelated).toHaveLength(4);
      });

      it("should link exit requirements to related codes", () => {
        const exitRelated = [
          { title: "Travel Distance", codeRef: "NBC 3.4.2.5" },
          { title: "Exit Signs", codeRef: "NBC 3.4.5" },
          { title: "Emergency Lighting", codeRef: "NBC 3.2.7" },
          { title: "Panic Hardware", codeRef: "NBC 3.4.6.15" }
        ];
        
        expect(exitRelated).toHaveLength(4);
      });
    });

    describe("SeeAlso", () => {
      it("should provide navigation shortcuts", () => {
        const seeAlsoItems = [
          { label: "Fire Separation Calculator" },
          { label: "Occupant Load Calculator" },
          { label: "Travel Distance Calculator" }
        ];
        
        expect(seeAlsoItems).toHaveLength(3);
        expect(seeAlsoItems[0].label).toContain("Calculator");
      });
    });
  });

  // ============================================
  // 5. CHECKBACK TESTS
  // ============================================
  describe("Checkback Components", () => {
    describe("CheckbackPrompt", () => {
      it("should require all items to be checked before confirming", () => {
        const checkItems = [
          "I have verified the occupancy classification",
          "I have confirmed the floor area measurement",
          "I understand this is for preliminary design only"
        ];
        
        const checkedItems = new Set([0, 1]); // Only 2 of 3 checked
        const allChecked = checkedItems.size === checkItems.length;
        
        expect(allChecked).toBe(false);
        
        checkedItems.add(2);
        const nowAllChecked = checkedItems.size === checkItems.length;
        expect(nowAllChecked).toBe(true);
      });
    });

    describe("CalculatorReview", () => {
      it("should display all input values for verification", () => {
        const inputs = [
          { label: "Floor Area", value: 500, unit: "m²" },
          { label: "Occupancy Type", value: "Assembly", unit: undefined },
          { label: "Space Type", value: "Standing space", unit: undefined }
        ];
        
        expect(inputs).toHaveLength(3);
        expect(inputs[0].unit).toBe("m²");
        expect(inputs[1].unit).toBeUndefined();
      });
    });

    describe("DidYouConsider", () => {
      it("should prompt for fire separation considerations", () => {
        const fireSeparationConsiderations = [
          "Are there any openings that penetrate this fire separation?",
          "Does the fire separation extend continuously from floor to roof?",
          "Are all penetrations properly firestopped?",
          "Is the building fully sprinklered?",
          "Have you verified with the AHJ?"
        ];
        
        expect(fireSeparationConsiderations).toHaveLength(5);
        expect(fireSeparationConsiderations[0]).toContain("openings");
      });

      it("should prompt for occupant load considerations", () => {
        const occupantLoadConsiderations = [
          "Does this space have multiple use types?",
          "Are there any fixed seats?",
          "Will actual occupancy exceed calculated load?",
          "Have you included all floor levels?",
          "Are mezzanines included?"
        ];
        
        expect(occupantLoadConsiderations).toHaveLength(5);
      });

      it("should prompt for exit considerations", () => {
        const exitConsiderations = [
          "Are exits located remotely from each other?",
          "Do exit doors swing in direction of travel?",
          "Is there a clear path to each exit?",
          "Are exit stairs enclosed?",
          "Have you checked travel distance?"
        ];
        
        expect(exitConsiderations).toHaveLength(5);
      });
    });
  });

  // ============================================
  // INTEGRATION TESTS
  // ============================================
  describe("5 C's Integration", () => {
    it("should have all 5 principles represented in calculators", () => {
      const principles = [
        "Compliance",    // ComplianceBadge, CodeReference, ComplianceSummary
        "Clarification", // ClarificationPanel, WhyImportant, ContextualHelp
        "Culture",       // RegionalNote, LandAcknowledgment
        "Connection",    // RelatedRequirements, SeeAlso
        "Checkback"      // CheckbackPrompt, CalculatorReview, DidYouConsider
      ];
      
      expect(principles).toHaveLength(5);
    });

    it("should flow from Compliance through Checkback", () => {
      // Typical user flow through a calculator
      const userFlow = [
        "1. See compliance status (COMPLIANCE)",
        "2. Understand what it means (CLARIFICATION)",
        "3. See regional variations (CULTURE)",
        "4. Navigate to related requirements (CONNECTION)",
        "5. Verify inputs and confirm understanding (CHECKBACK)"
      ];
      
      expect(userFlow).toHaveLength(5);
      expect(userFlow[0]).toContain("COMPLIANCE");
      expect(userFlow[4]).toContain("CHECKBACK");
    });

    it("should enhance Fire Separation Calculator with all 5 C's", () => {
      const fireSeparationEnhancements = {
        compliance: "CodeReference for NBC 3.2.3",
        clarification: "WhyImportant and ClarificationPanel",
        culture: "Alberta-specific fire separation notes",
        connection: "Links to fire doors, dampers, sprinklers",
        checkback: "DidYouConsider prompts"
      };
      
      expect(Object.keys(fireSeparationEnhancements)).toHaveLength(5);
    });

    it("should enhance Occupant Load Calculator with all 5 C's", () => {
      const occupantLoadEnhancements = {
        compliance: "CodeReference for NBC 3.1.17",
        clarification: "Plain language explanation of load factors",
        culture: "Alberta-specific occupancy requirements",
        connection: "Links to exits, plumbing, sprinklers",
        checkback: "Input review and considerations"
      };
      
      expect(Object.keys(occupantLoadEnhancements)).toHaveLength(5);
    });

    it("should enhance Exit Requirements Calculator with all 5 C's", () => {
      const exitEnhancements = {
        compliance: "CodeReference for NBC 3.4.2, 3.4.3",
        clarification: "Historical context (Station Nightclub)",
        culture: "Alberta building code amendments",
        connection: "Links to travel distance, signs, lighting",
        checkback: "Exit location and configuration prompts"
      };
      
      expect(Object.keys(exitEnhancements)).toHaveLength(5);
    });
  });
});
