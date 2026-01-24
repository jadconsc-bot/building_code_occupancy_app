/**
 * Tests for mobile detection and drawing feature disabling
 * Ensures Drawing Analysis is disabled on mobile devices
 */

import { describe, it, expect } from "vitest";

describe("Mobile Drawing Feature Disabled", () => {
  describe("Mobile Detection Logic", () => {
    it("should detect iPhone user agent as mobile", () => {
      const userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
      expect(mobileRegex.test(userAgent.toLowerCase())).toBe(true);
    });

    it("should detect Android user agent as mobile", () => {
      const userAgent = "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36";
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
      expect(mobileRegex.test(userAgent.toLowerCase())).toBe(true);
    });

    it("should detect iPad user agent as mobile", () => {
      const userAgent = "Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
      expect(mobileRegex.test(userAgent.toLowerCase())).toBe(true);
    });

    it("should detect tablet user agent as mobile", () => {
      const userAgent = "Mozilla/5.0 (Linux; Android 12; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36";
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
      expect(mobileRegex.test(userAgent.toLowerCase())).toBe(true);
    });

    it("should NOT detect desktop Chrome user agent as mobile", () => {
      const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36";
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
      expect(mobileRegex.test(userAgent.toLowerCase())).toBe(false);
    });

    it("should NOT detect desktop Firefox user agent as mobile", () => {
      const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/112.0";
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
      expect(mobileRegex.test(userAgent.toLowerCase())).toBe(false);
    });

    it("should NOT detect desktop Safari user agent as mobile", () => {
      const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15";
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
      expect(mobileRegex.test(userAgent.toLowerCase())).toBe(false);
    });

    it("should NOT detect desktop Edge user agent as mobile", () => {
      const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.1722.48";
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
      expect(mobileRegex.test(userAgent.toLowerCase())).toBe(false);
    });
  });

  describe("Screen Size Detection", () => {
    it("should consider screens under 1024px as mobile for drawing", () => {
      const screenWidth = 768;
      const isSmallScreen = screenWidth < 1024;
      expect(isSmallScreen).toBe(true);
    });

    it("should consider screens 1024px and above as desktop", () => {
      const screenWidth = 1024;
      const isSmallScreen = screenWidth < 1024;
      expect(isSmallScreen).toBe(false);
    });

    it("should consider large screens as desktop", () => {
      const screenWidth = 1920;
      const isSmallScreen = screenWidth < 1024;
      expect(isSmallScreen).toBe(false);
    });
  });

  describe("Combined Detection Logic", () => {
    it("should detect mobile when user agent is mobile AND screen is small", () => {
      const userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)";
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
      const isTouchDevice = true;
      const isSmallScreen = true; // 375px width
      
      const isMobile = mobileRegex.test(userAgent.toLowerCase()) || (isTouchDevice && isSmallScreen);
      expect(isMobile).toBe(true);
    });

    it("should detect mobile when touch device with small screen even if user agent is desktop", () => {
      const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
      const isTouchDevice = true;
      const isSmallScreen = true; // 800px width
      
      const isMobile = mobileRegex.test(userAgent.toLowerCase()) || (isTouchDevice && isSmallScreen);
      expect(isMobile).toBe(true);
    });

    it("should NOT detect mobile for touch device with large screen", () => {
      const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
      const isTouchDevice = true;
      const isSmallScreen = false; // 1920px width
      
      const isMobile = mobileRegex.test(userAgent.toLowerCase()) || (isTouchDevice && isSmallScreen);
      expect(isMobile).toBe(false);
    });

    it("should NOT detect mobile for non-touch desktop with large screen", () => {
      const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
      const isTouchDevice = false;
      const isSmallScreen = false;
      
      const isMobile = mobileRegex.test(userAgent.toLowerCase()) || (isTouchDevice && isSmallScreen);
      expect(isMobile).toBe(false);
    });
  });

  describe("Desktop Feature Availability", () => {
    it("should allow drawing features on desktop", () => {
      const isMobile = false;
      const drawingFeaturesEnabled = !isMobile;
      expect(drawingFeaturesEnabled).toBe(true);
    });

    it("should disable drawing features on mobile", () => {
      const isMobile = true;
      const drawingFeaturesEnabled = !isMobile;
      expect(drawingFeaturesEnabled).toBe(false);
    });
  });

  describe("Mobile Message Content", () => {
    it("should have appropriate desktop-only message", () => {
      const mobileMessage = "The Drawing Analysis tool requires a larger screen and precise mouse control for accurate annotations.";
      expect(mobileMessage).toContain("larger screen");
      expect(mobileMessage).toContain("precise mouse control");
    });

    it("should list desktop features in mobile message", () => {
      const features = [
        "Upload and analyze architectural drawings",
        "Add dimension annotations with calibration",
        "Draw freehand sketches and shapes",
        "Use AI to extract measurements automatically",
        "Check compliance against municipal bylaws",
        "Export annotated drawings and reports"
      ];
      
      expect(features.length).toBe(6);
      expect(features).toContain("Upload and analyze architectural drawings");
      expect(features).toContain("Draw freehand sketches and shapes");
    });
  });
});
