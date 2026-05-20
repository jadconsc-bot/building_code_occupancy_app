#!/usr/bin/env node

/**
 * Test Drawing Generator
 * Creates synthetic PDF drawings for testing BC/AB compliance system
 * 
 * Generates:
 * - Simple geometric shapes with known dimensions
 * - Labeled rooms and areas
 * - North arrow for orientation
 * - Window callouts with dimensions
 * - Building sections with R-values
 * 
 * Usage: node generateTestDrawings.mjs
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const testDir = './tests/test-drawings';

// Create test directory if it doesn't exist
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

/**
 * Generate a simple rectangular floor plan
 * Represents a 10m × 20m = 200m² building
 */
function generateSimpleRectangle() {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50
  });

  const filename = path.join(testDir, 'rect_10x20.pdf');
  const stream = fs.createWriteStream(filename);
  doc.pipe(stream);

  // Title
  doc.fontSize(16).font('Helvetica-Bold').text('Simple Rectangle Floor Plan', { align: 'center' });
  doc.fontSize(10).font('Helvetica').text('Test Drawing: 10m × 20m = 200m²', { align: 'center' });
  doc.moveDown();

  // Draw rectangle (scaled: 1m = 10px)
  const scale = 10;
  const width = 10 * scale; // 100px
  const height = 20 * scale; // 200px
  const startX = 150;
  const startY = 150;

  // Rectangle outline
  doc.rect(startX, startY, width, height).stroke();

  // Dimensions
  doc.fontSize(8).text('10m', startX + width / 2 - 10, startY - 20);
  doc.text('20m', startX - 40, startY + height / 2 - 5);

  // Area label
  doc.fontSize(12).font('Helvetica-Bold').text('200m²', startX + width / 2 - 20, startY + height / 2 - 10);

  // Scale note
  doc.fontSize(8).font('Helvetica').text('Scale: 1m = 10px', 50, 400);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      console.log(`✓ Generated: ${filename}`);
      resolve();
    });
    stream.on('error', reject);
  });
}

/**
 * Generate an L-shaped floor plan
 * Tests complex geometry handling
 */
function generateLShape() {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50
  });

  const filename = path.join(testDir, 'L_shape.pdf');
  const stream = fs.createWriteStream(filename);
  doc.pipe(stream);

  // Title
  doc.fontSize(16).font('Helvetica-Bold').text('L-Shaped Floor Plan', { align: 'center' });
  doc.fontSize(10).font('Helvetica').text('Test Drawing: Complex Geometry', { align: 'center' });
  doc.moveDown();

  const scale = 8;
  const startX = 100;
  const startY = 150;

  // Draw L-shape (two rectangles)
  // Horizontal part: 20m × 10m
  doc.rect(startX, startY, 20 * scale, 10 * scale).stroke();
  
  // Vertical part: 10m × 15m
  doc.rect(startX, startY + 10 * scale, 10 * scale, 15 * scale).stroke();

  // Labels
  doc.fontSize(10).font('Helvetica-Bold').text('Horizontal: 20m × 10m = 200m²', startX + 50, startY + 30);
  doc.fontSize(10).text('Vertical: 10m × 15m = 150m²', startX + 50, startY + 100);
  doc.fontSize(12).font('Helvetica-Bold').text('Total: 350m²', startX + 50, startY + 150);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      console.log(`✓ Generated: ${filename}`);
      resolve();
    });
    stream.on('error', reject);
  });
}

/**
 * Generate a multi-room floor plan
 * Tests room detection and labeling
 */
function generateMultiRoom() {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50
  });

  const filename = path.join(testDir, 'multi_room.pdf');
  const stream = fs.createWriteStream(filename);
  doc.pipe(stream);

  // Title
  doc.fontSize(16).font('Helvetica-Bold').text('Multi-Room Floor Plan', { align: 'center' });
  doc.fontSize(10).font('Helvetica').text('Test Drawing: Room Detection', { align: 'center' });
  doc.moveDown();

  const scale = 6;
  const startX = 100;
  const startY = 150;

  // Room 1: Bedroom 12m²
  doc.rect(startX, startY, 4 * scale, 3 * scale).stroke();
  doc.fontSize(9).font('Helvetica-Bold').text('Bedroom', startX + 5, startY + 15);
  doc.fontSize(8).font('Helvetica').text('12m²', startX + 5, startY + 30);

  // Room 2: Kitchen 15m²
  doc.rect(startX + 4 * scale, startY, 5 * scale, 3 * scale).stroke();
  doc.fontSize(9).font('Helvetica-Bold').text('Kitchen', startX + 4 * scale + 10, startY + 15);
  doc.fontSize(8).font('Helvetica').text('15m²', startX + 4 * scale + 10, startY + 30);

  // Room 3: Living Room 20m²
  doc.rect(startX, startY + 3 * scale, 9 * scale, 4 * scale).stroke();
  doc.fontSize(9).font('Helvetica-Bold').text('Living Room', startX + 20, startY + 3 * scale + 20);
  doc.fontSize(8).font('Helvetica').text('20m²', startX + 20, startY + 3 * scale + 35);

  // Total
  doc.fontSize(12).font('Helvetica-Bold').text('Total: 47m²', startX + 100, startY + 150);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      console.log(`✓ Generated: ${filename}`);
      resolve();
    });
    stream.on('error', reject);
  });
}

/**
 * Generate a drawing with north arrow
 * Tests orientation detection
 */
function generateNorthArrow() {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50
  });

  const filename = path.join(testDir, 'north_arrow.pdf');
  const stream = fs.createWriteStream(filename);
  doc.pipe(stream);

  // Title
  doc.fontSize(16).font('Helvetica-Bold').text('Site Plan with North Arrow', { align: 'center' });
  doc.fontSize(10).font('Helvetica').text('Test Drawing: Orientation Detection', { align: 'center' });
  doc.moveDown();

  const scale = 8;
  const startX = 150;
  const startY = 150;

  // Building footprint
  doc.rect(startX, startY, 20 * scale, 15 * scale).stroke();
  doc.fontSize(10).font('Helvetica-Bold').text('Building', startX + 60, startY + 50);

  // North arrow
  const arrowX = startX + 250;
  const arrowY = startY + 50;

  // Arrow shaft
  doc.moveTo(arrowX, arrowY + 40).lineTo(arrowX, arrowY).stroke();

  // Arrow head (triangle)
  doc.polygon(
    [arrowX - 5, arrowY],
    [arrowX + 5, arrowY],
    [arrowX, arrowY - 10]
  ).stroke();

  // Label
  doc.fontSize(12).font('Helvetica-Bold').text('N', arrowX - 5, arrowY - 25);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      console.log(`✓ Generated: ${filename}`);
      resolve();
    });
    stream.on('error', reject);
  });
}

/**
 * Generate a drawing with window callouts
 * Tests text extraction and dimension parsing
 */
function generateWindowCallouts() {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50
  });

  const filename = path.join(testDir, 'window_callouts.pdf');
  const stream = fs.createWriteStream(filename);
  doc.pipe(stream);

  // Title
  doc.fontSize(16).font('Helvetica-Bold').text('Elevation with Window Callouts', { align: 'center' });
  doc.fontSize(10).font('Helvetica').text('Test Drawing: Text Extraction', { align: 'center' });
  doc.moveDown();

  const scale = 8;
  const startX = 100;
  const startY = 150;

  // Wall
  doc.rect(startX, startY, 40 * scale, 15 * scale).stroke();

  // Windows
  const windows = [
    { x: startX + 50, y: startY + 30, label: 'W1: 2.4m × 1.8m' },
    { x: startX + 150, y: startY + 30, label: 'W2: 2.4m × 1.8m' },
    { x: startX + 250, y: startY + 30, label: 'W3: 1.5m × 1.2m' }
  ];

  windows.forEach(w => {
    doc.rect(w.x, w.y, 30, 25).stroke();
    doc.fontSize(8).font('Helvetica').text(w.label, w.x - 20, w.y - 15);
  });

  // Wall label
  doc.fontSize(10).font('Helvetica-Bold').text('South Elevation', startX + 100, startY - 20);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      console.log(`✓ Generated: ${filename}`);
      resolve();
    });
    stream.on('error', reject);
  });
}

/**
 * Generate a building section with R-values
 * Tests material property extraction
 */
function generateBuildingSection() {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50
  });

  const filename = path.join(testDir, 'section_with_rvalues.pdf');
  const stream = fs.createWriteStream(filename);
  doc.pipe(stream);

  // Title
  doc.fontSize(16).font('Helvetica-Bold').text('Building Section with R-Values', { align: 'center' });
  doc.fontSize(10).font('Helvetica').text('Test Drawing: Material Properties', { align: 'center' });
  doc.moveDown();

  const startX = 100;
  const startY = 150;

  // Roof
  doc.rect(startX, startY, 200, 30).stroke();
  doc.fontSize(9).font('Helvetica').text('Roof: R-60', startX + 50, startY + 8);

  // Wall
  doc.rect(startX, startY + 30, 200, 80).stroke();
  doc.fontSize(9).font('Helvetica').text('Wall: R-22', startX + 50, startY + 60);

  // Foundation
  doc.rect(startX, startY + 110, 200, 40).stroke();
  doc.fontSize(9).font('Helvetica').text('Foundation: R-15', startX + 50, startY + 125);

  // Dimensions
  doc.fontSize(8).font('Helvetica').text('200mm', startX - 30, startY + 40);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      console.log(`✓ Generated: ${filename}`);
      resolve();
    });
    stream.on('error', reject);
  });
}

/**
 * Generate a low-quality scan
 * Tests confidence scoring and error handling
 */
function generateLowQualityScan() {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50
  });

  const filename = path.join(testDir, 'low_quality_scan.pdf');
  const stream = fs.createWriteStream(filename);
  doc.pipe(stream);

  // Title (blurry effect simulated with light gray)
  doc.fontSize(14).fillColor('#999999').font('Helvetica-Bold').text('Low Quality Scan', { align: 'center' });
  doc.fontSize(9).fillColor('#666666').font('Helvetica').text('Confidence: ~50% - Requires Manual Review', { align: 'center' });
  doc.moveDown();

  // Draw faint rectangle (simulating poor scan)
  doc.fillColor('#CCCCCC').rect(100, 150, 200, 150).fill();
  doc.strokeColor('#999999').lineWidth(1).rect(100, 150, 200, 150).stroke();

  // Barely readable text
  doc.fontSize(8).fillColor('#888888').text('Unclear dimensions', 120, 200);
  doc.text('Poor contrast', 120, 220);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      console.log(`✓ Generated: ${filename}`);
      resolve();
    });
    stream.on('error', reject);
  });
}

/**
 * Main function - generate all test drawings
 */
async function main() {
  console.log('🏗️  Generating test drawings for BC/AB compliance system...\n');

  try {
    await generateSimpleRectangle();
    await generateLShape();
    await generateMultiRoom();
    await generateNorthArrow();
    await generateWindowCallouts();
    await generateBuildingSection();
    await generateLowQualityScan();

    console.log('\n✅ All test drawings generated successfully!');
    console.log(`📁 Location: ${testDir}\n`);

    // Print summary
    console.log('Generated files:');
    console.log('  - rect_10x20.pdf: Simple rectangle (200m²)');
    console.log('  - L_shape.pdf: Complex L-shaped geometry (350m²)');
    console.log('  - multi_room.pdf: Multi-room floor plan (47m²)');
    console.log('  - north_arrow.pdf: Site plan with orientation');
    console.log('  - window_callouts.pdf: Elevation with window dimensions');
    console.log('  - section_with_rvalues.pdf: Building section with R-values');
    console.log('  - low_quality_scan.pdf: Low-quality scan for error handling\n');

  } catch (error) {
    console.error('❌ Error generating test drawings:', error);
    process.exit(1);
  }
}

main();
