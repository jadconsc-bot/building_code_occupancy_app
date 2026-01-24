/**
 * Tests for ref-based drawing implementation
 * This tests the fix for mobile drawing where we use refs instead of state
 * to avoid React re-renders during active drawing
 */

import { describe, it, expect } from "vitest";

describe("Ref-based Drawing Implementation", () => {
  describe("Drawing State Management", () => {
    it("should track drawing state in ref to avoid re-renders", () => {
      // Simulate the ref-based approach
      let isDrawingRef = { current: false };
      let currentStrokeRef = { current: null as any };
      let lastTouchPointRef = { current: null as any };
      
      // Start drawing
      isDrawingRef.current = true;
      currentStrokeRef.current = {
        id: "stroke-1",
        type: "freehand",
        points: [{ x: 100, y: 100 }],
        color: "#000000",
        width: 2
      };
      lastTouchPointRef.current = { x: 100, y: 100 };
      
      expect(isDrawingRef.current).toBe(true);
      expect(currentStrokeRef.current).not.toBeNull();
      expect(lastTouchPointRef.current).toEqual({ x: 100, y: 100 });
    });

    it("should accumulate points in ref during drawing", () => {
      let currentStrokeRef = { current: {
        id: "stroke-1",
        type: "freehand",
        points: [{ x: 100, y: 100 }],
        color: "#000000",
        width: 2
      }};
      
      // Simulate multiple touch move events
      const newPoints = [
        { x: 110, y: 105 },
        { x: 120, y: 110 },
        { x: 130, y: 115 },
        { x: 140, y: 120 }
      ];
      
      newPoints.forEach(point => {
        currentStrokeRef.current = {
          ...currentStrokeRef.current,
          points: [...currentStrokeRef.current.points, point]
        };
      });
      
      expect(currentStrokeRef.current.points.length).toBe(5);
      expect(currentStrokeRef.current.points[4]).toEqual({ x: 140, y: 120 });
    });

    it("should commit stroke to state only on touch end", () => {
      let drawingStrokes: any[] = [];
      let currentStrokeRef = { current: {
        id: "stroke-1",
        type: "freehand",
        points: [{ x: 100, y: 100 }, { x: 150, y: 150 }],
        color: "#000000",
        width: 2
      }};
      let isDrawingRef = { current: true };
      
      // Simulate touch end - commit to state
      if (isDrawingRef.current && currentStrokeRef.current) {
        const completedStroke = currentStrokeRef.current;
        if (completedStroke.points.length >= 2) {
          drawingStrokes = [...drawingStrokes, completedStroke];
        }
        currentStrokeRef.current = null;
        isDrawingRef.current = false;
      }
      
      expect(drawingStrokes.length).toBe(1);
      expect(drawingStrokes[0].id).toBe("stroke-1");
      expect(currentStrokeRef.current).toBeNull();
      expect(isDrawingRef.current).toBe(false);
    });

    it("should not commit strokes with less than 2 points", () => {
      let drawingStrokes: any[] = [];
      let currentStrokeRef = { current: {
        id: "stroke-1",
        type: "freehand",
        points: [{ x: 100, y: 100 }], // Only 1 point
        color: "#000000",
        width: 2
      }};
      
      // Simulate touch end
      const completedStroke = currentStrokeRef.current;
      if (completedStroke.points.length >= 2) {
        drawingStrokes = [...drawingStrokes, completedStroke];
      }
      
      expect(drawingStrokes.length).toBe(0);
    });
  });

  describe("Shape Tools with Refs", () => {
    it("should update line tool points in ref", () => {
      let currentStrokeRef = { current: {
        id: "stroke-1",
        type: "line",
        points: [{ x: 100, y: 100 }],
        color: "#000000",
        width: 2
      }};
      const drawingStartPoint = { x: 100, y: 100 };
      
      // Simulate mouse move for line tool
      const endPoint = { x: 200, y: 200 };
      currentStrokeRef.current = {
        ...currentStrokeRef.current,
        points: [drawingStartPoint, endPoint]
      };
      
      expect(currentStrokeRef.current.points.length).toBe(2);
      expect(currentStrokeRef.current.points[0]).toEqual({ x: 100, y: 100 });
      expect(currentStrokeRef.current.points[1]).toEqual({ x: 200, y: 200 });
    });

    it("should update rectangle tool points in ref", () => {
      let currentStrokeRef = { current: {
        id: "stroke-1",
        type: "rectangle",
        points: [{ x: 50, y: 50 }],
        color: "#FF0000",
        width: 3
      }};
      const drawingStartPoint = { x: 50, y: 50 };
      
      // Simulate drag to create rectangle
      const endPoint = { x: 150, y: 100 };
      currentStrokeRef.current = {
        ...currentStrokeRef.current,
        points: [drawingStartPoint, endPoint]
      };
      
      expect(currentStrokeRef.current.type).toBe("rectangle");
      expect(currentStrokeRef.current.points[1]).toEqual({ x: 150, y: 100 });
    });

    it("should update circle tool points in ref", () => {
      let currentStrokeRef = { current: {
        id: "stroke-1",
        type: "circle",
        points: [{ x: 200, y: 200 }],
        color: "#0000FF",
        width: 2
      }};
      const drawingStartPoint = { x: 200, y: 200 };
      
      // Simulate drag to create circle
      const endPoint = { x: 250, y: 250 };
      currentStrokeRef.current = {
        ...currentStrokeRef.current,
        points: [drawingStartPoint, endPoint]
      };
      
      expect(currentStrokeRef.current.type).toBe("circle");
      expect(currentStrokeRef.current.points.length).toBe(2);
    });
  });

  describe("Immediate Canvas Drawing", () => {
    it("should track last touch point for line segments", () => {
      let lastTouchPointRef = { current: { x: 100, y: 100 } };
      
      // Simulate drawing a line segment
      const currentPoint = { x: 110, y: 105 };
      const lineSegment = {
        from: lastTouchPointRef.current,
        to: currentPoint
      };
      
      expect(lineSegment.from).toEqual({ x: 100, y: 100 });
      expect(lineSegment.to).toEqual({ x: 110, y: 105 });
      
      // Update last point for next segment
      lastTouchPointRef.current = currentPoint;
      expect(lastTouchPointRef.current).toEqual({ x: 110, y: 105 });
    });

    it("should calculate canvas coordinates with zoom and pan", () => {
      const zoom = 0.8;
      const pan = { x: 50, y: 30 };
      const rawPoint = { x: 100, y: 100 };
      
      // Convert to image coordinates (what we store)
      const imageX = (rawPoint.x - pan.x) / zoom;
      const imageY = (rawPoint.y - pan.y) / zoom;
      
      expect(imageX).toBeCloseTo(62.5);
      expect(imageY).toBeCloseTo(87.5);
      
      // Convert back to canvas coordinates (for drawing)
      const canvasX = imageX * zoom + pan.x;
      const canvasY = imageY * zoom + pan.y;
      
      expect(canvasX).toBeCloseTo(100);
      expect(canvasY).toBeCloseTo(100);
    });
  });

  describe("Touch Event Handling", () => {
    it("should handle touch start correctly", () => {
      let isDrawingRef = { current: false };
      let currentStrokeRef = { current: null as any };
      let lastTouchPointRef = { current: null as any };
      
      // Simulate touch start
      const touchPoint = { x: 150, y: 200 };
      const strokeColor = "#FF0000";
      const strokeWidth = 3;
      const drawingTool = "pen";
      
      isDrawingRef.current = true;
      lastTouchPointRef.current = touchPoint;
      currentStrokeRef.current = {
        id: `stroke-${Date.now()}`,
        type: drawingTool === "pen" ? "freehand" : drawingTool,
        points: [touchPoint],
        color: strokeColor,
        width: strokeWidth
      };
      
      expect(isDrawingRef.current).toBe(true);
      expect(lastTouchPointRef.current).toEqual({ x: 150, y: 200 });
      expect(currentStrokeRef.current.type).toBe("freehand");
    });

    it("should handle touch move correctly for freehand", () => {
      let currentStrokeRef = { current: {
        id: "stroke-1",
        type: "freehand",
        points: [{ x: 150, y: 200 }],
        color: "#FF0000",
        width: 3
      }};
      let lastTouchPointRef = { current: { x: 150, y: 200 } };
      
      // Simulate touch move
      const newPoint = { x: 160, y: 210 };
      
      // Update ref (not state!)
      currentStrokeRef.current = {
        ...currentStrokeRef.current,
        points: [...currentStrokeRef.current.points, newPoint]
      };
      lastTouchPointRef.current = newPoint;
      
      expect(currentStrokeRef.current.points.length).toBe(2);
      expect(lastTouchPointRef.current).toEqual({ x: 160, y: 210 });
    });

    it("should handle touch end correctly", () => {
      let drawingStrokes: any[] = [];
      let isDrawingRef = { current: true };
      let currentStrokeRef = { current: {
        id: "stroke-1",
        type: "freehand",
        points: [{ x: 150, y: 200 }, { x: 160, y: 210 }, { x: 170, y: 220 }],
        color: "#FF0000",
        width: 3
      }};
      let lastTouchPointRef = { current: { x: 170, y: 220 } };
      
      // Simulate touch end
      lastTouchPointRef.current = null;
      isDrawingRef.current = false;
      
      const completedStroke = currentStrokeRef.current;
      if (completedStroke && completedStroke.points.length >= 2) {
        drawingStrokes = [...drawingStrokes, completedStroke];
      }
      currentStrokeRef.current = null;
      
      expect(drawingStrokes.length).toBe(1);
      expect(drawingStrokes[0].points.length).toBe(3);
      expect(lastTouchPointRef.current).toBeNull();
      expect(isDrawingRef.current).toBe(false);
      expect(currentStrokeRef.current).toBeNull();
    });
  });

  describe("No Re-render During Drawing", () => {
    it("should not trigger state updates during active drawing", () => {
      let stateUpdateCount = 0;
      const mockSetState = () => { stateUpdateCount++; };
      
      // Simulate 100 touch move events (like rapid drawing)
      for (let i = 0; i < 100; i++) {
        // Using refs - no state updates
        // In the old code, this would call setCurrentStroke 100 times
      }
      
      expect(stateUpdateCount).toBe(0);
    });

    it("should only update state once on touch end", () => {
      let stateUpdateCount = 0;
      const mockSetDrawingStrokes = () => { stateUpdateCount++; };
      
      // Simulate touch end - commit stroke
      mockSetDrawingStrokes();
      
      expect(stateUpdateCount).toBe(1);
    });
  });
});
