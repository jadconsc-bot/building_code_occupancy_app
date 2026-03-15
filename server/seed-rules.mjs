import mysql from 'mysql2/promise';

const SAMPLE_RULES = [
  // NBC - Occupancy Rules
  {
    ruleCode: 'NBC-2023-OCC-001',
    name: 'Occupancy Load Calculation - Residential',
    description: 'Calculate occupancy load for residential buildings based on floor area and occupancy type',
    category: 'occupancy',
    jurisdiction: 'NBC',
    municipality: null,
    codeEdition: 'NBC-2023',
    nbcReference: 'NBC 3.2.2.1',
    keywords: 'occupancy,load,residential,calculation',
    applicableOccupancies: '["A-1", "A-2", "A-3"]',
    applicableConstructionTypes: '["V-1", "V-2", "III-1", "III-2"]',
  },
  {
    ruleCode: 'NBC-2023-OCC-002',
    name: 'Occupancy Load Calculation - Commercial',
    description: 'Calculate occupancy load for commercial buildings based on use and floor area',
    category: 'occupancy',
    jurisdiction: 'NBC',
    municipality: null,
    codeEdition: 'NBC-2023',
    nbcReference: 'NBC 3.2.2.2',
    keywords: 'occupancy,load,commercial,calculation,area',
    applicableOccupancies: '["B-1", "B-2", "B-3"]',
    applicableConstructionTypes: '["II-1", "II-2", "III-1", "III-2"]',
  },
  // NBC - Fire Safety Rules
  {
    ruleCode: 'NBC-2023-FIRE-001',
    name: 'Fire Separation Requirements',
    description: 'Minimum fire separation distances between buildings based on occupancy and construction type',
    category: 'fire',
    jurisdiction: 'NBC',
    municipality: null,
    codeEdition: 'NBC-2023',
    nbcReference: 'NBC 3.2.3.1',
    keywords: 'fire,separation,distance,safety',
    applicableOccupancies: '["A-1", "B-1", "C-1"]',
    applicableConstructionTypes: '["I-1", "II-1", "III-1", "IV-1", "V-1"]',
  },
  {
    ruleCode: 'NBC-2023-FIRE-002',
    name: 'Fire Rating Requirements - Walls',
    description: 'Required fire ratings for walls based on occupancy classification and separation requirements',
    category: 'fire',
    jurisdiction: 'NBC',
    municipality: null,
    codeEdition: 'NBC-2023',
    nbcReference: 'NBC 3.2.3.2',
    keywords: 'fire,rating,walls,construction,safety',
    applicableOccupancies: '["A-1", "B-1", "C-1", "D-1"]',
    applicableConstructionTypes: '["I-1", "II-1", "III-1", "IV-1", "V-1"]',
  },
  // NBC - Egress Rules
  {
    ruleCode: 'NBC-2023-EGRESS-001',
    name: 'Exit Door Width Requirements',
    description: 'Minimum exit door widths based on occupancy load and building classification',
    category: 'egress',
    jurisdiction: 'NBC',
    municipality: null,
    codeEdition: 'NBC-2023',
    nbcReference: 'NBC 3.4.1.1',
    keywords: 'egress,exit,door,width,minimum',
    applicableOccupancies: '["A-1", "A-2", "B-1", "B-2", "C-1"]',
    applicableConstructionTypes: '["I-1", "II-1", "III-1", "IV-1", "V-1"]',
  },
  {
    ruleCode: 'NBC-2023-EGRESS-002',
    name: 'Stair Dimensions - Residential',
    description: 'Required stair dimensions (rise, run, width) for residential buildings',
    category: 'egress',
    jurisdiction: 'NBC',
    municipality: null,
    codeEdition: 'NBC-2023',
    nbcReference: 'NBC 3.4.6.1',
    keywords: 'egress,stair,dimensions,rise,run,residential',
    applicableOccupancies: '["A-1", "A-2"]',
    applicableConstructionTypes: '["V-1", "V-2"]',
  },
  // Alberta Provincial Rules
  {
    ruleCode: 'AB-2023-OCC-001',
    name: 'Alberta Occupancy Load - Residential',
    description: 'Alberta-specific occupancy load requirements for residential buildings',
    category: 'occupancy',
    jurisdiction: 'Alberta',
    municipality: null,
    codeEdition: 'AE-2023',
    nbcReference: 'NBC 3.2.2.1 (AB Amendment)',
    keywords: 'occupancy,load,residential,alberta',
    applicableOccupancies: '["A-1", "A-2"]',
    applicableConstructionTypes: '["V-1", "V-2"]',
  },
  // Calgary Municipal Rules
  {
    ruleCode: 'CALGARY-2023-FIRE-001',
    name: 'Calgary Fire Separation - Enhanced',
    description: 'Calgary municipal requirements for enhanced fire separation between buildings',
    category: 'fire',
    jurisdiction: 'Calgary',
    municipality: 'Calgary',
    codeEdition: 'NBC-2023',
    nbcReference: 'NBC 3.2.3.1 (Calgary Amendment)',
    keywords: 'fire,separation,calgary,municipal',
    applicableOccupancies: '["A-1", "B-1"]',
    applicableConstructionTypes: '["I-1", "II-1"]',
  },
  // Edmonton Municipal Rules
  {
    ruleCode: 'EDMONTON-2023-EGRESS-001',
    name: 'Edmonton Exit Requirements - Enhanced',
    description: 'Edmonton municipal requirements for exit doors and egress pathways',
    category: 'egress',
    jurisdiction: 'Edmonton',
    municipality: 'Edmonton',
    codeEdition: 'NBC-2023',
    nbcReference: 'NBC 3.4.1.1 (Edmonton Amendment)',
    keywords: 'egress,exit,edmonton,municipal',
    applicableOccupancies: '["B-1", "B-2"]',
    applicableConstructionTypes: '["II-1", "III-1"]',
  },
  // Toronto Municipal Rules
  {
    ruleCode: 'TORONTO-2023-ACCESSIBILITY-001',
    name: 'Toronto Accessibility Requirements',
    description: 'Toronto municipal requirements for building accessibility and universal design',
    category: 'accessibility',
    jurisdiction: 'Toronto',
    municipality: 'Toronto',
    codeEdition: 'NBC-2023',
    nbcReference: 'NBC 3.8.1.1 (Toronto Amendment)',
    keywords: 'accessibility,universal,design,toronto',
    applicableOccupancies: '["A-1", "B-1", "C-1"]',
    applicableConstructionTypes: '["I-1", "II-1", "III-1"]',
  },
];

async function seedRules() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'dev_user',
      password: process.env.DB_PASSWORD || 'dev_password_123',
      database: process.env.DB_NAME || 'building_code_db',
    });

    console.log('Connected to database');

    // Insert rules
    for (const rule of SAMPLE_RULES) {
      try {
        await connection.execute(
          `INSERT INTO rulesLibrary (
            ruleCode, name, description, category, jurisdiction, municipality,
            codeEdition, nbcReference, keywords, applicableOccupancies,
            applicableConstructionTypes, isActive, isCustom, createdBy, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            rule.ruleCode,
            rule.name,
            rule.description,
            rule.category,
            rule.jurisdiction,
            rule.municipality,
            rule.codeEdition,
            rule.nbcReference,
            rule.keywords,
            rule.applicableOccupancies,
            rule.applicableConstructionTypes,
            true, // isActive
            false, // isCustom
            1, // createdBy (admin user)
          ]
        );
        console.log(`✓ Inserted rule: ${rule.ruleCode}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⊘ Rule already exists: ${rule.ruleCode}`);
        } else {
          console.error(`✗ Error inserting rule ${rule.ruleCode}:`, error.message);
        }
      }
    }

    await connection.end();
    console.log('\n✓ Database seeding completed');
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
}

seedRules();
