/**
 * Seed Script: Populate rulesDatabase with NBC 2025 Rules
 * 
 * This script inserts essential NBC 2025 building code rules into the database.
 * Run with: node scripts/seed-rules.mjs
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'building_code',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * NBC 2025 Rules Dataset
 * Covers major occupancy types and compliance requirements
 */
const nbc2025Rules = [
  // OCCUPANCY CLASSIFICATION RULES
  {
    ruleCode: 'OCC-A-001',
    codeVersion: 'NBC_2025',
    jurisdiction: 'Canada',
    title: 'Assembly Occupancy - Definition',
    description: 'Buildings or parts of buildings used for the gathering of persons for civic, political, social, religious, educational, recreational, or similar purposes.',
    category: 'OCCUPANCY',
    nbcReference: 'NBC 3.1.1.1',
    ruleData: {
      occupancyGroup: 'A',
      maxOccupancy: null,
      requirements: ['egress', 'fire_safety', 'accessibility'],
    },
  },
  {
    ruleCode: 'OCC-B-001',
    codeVersion: 'NBC_2025',
    jurisdiction: 'Canada',
    title: 'Institutional Occupancy - Definition',
    description: 'Buildings or parts of buildings used for the care of persons who are unable to care for themselves.',
    category: 'OCCUPANCY',
    nbcReference: 'NBC 3.1.1.2',
    ruleData: {
      occupancyGroup: 'B',
      maxOccupancy: null,
      requirements: ['egress', 'fire_safety', 'accessibility', 'emergency_systems'],
    },
  },
  {
    ruleCode: 'OCC-C-001',
    codeVersion: 'NBC_2025',
    jurisdiction: 'Canada',
    title: 'Residential Occupancy - Definition',
    description: 'Buildings or parts of buildings used for residential purposes.',
    category: 'OCCUPANCY',
    nbcReference: 'NBC 3.1.1.3',
    ruleData: {
      occupancyGroup: 'C',
      maxOccupancy: null,
      requirements: ['egress', 'fire_safety', 'accessibility'],
    },
  },
  {
    ruleCode: 'OCC-D-001',
    codeVersion: 'NBC_2025',
    jurisdiction: 'Canada',
    title: 'Business and Personal Services Occupancy',
    description: 'Buildings or parts of buildings used for business and personal services.',
    category: 'OCCUPANCY',
    nbcReference: 'NBC 3.1.1.4',
    ruleData: {
      occupancyGroup: 'D',
      maxOccupancy: null,
      requirements: ['egress', 'fire_safety', 'accessibility'],
    },
  },
  {
    ruleCode: 'OCC-E-001',
    codeVersion: 'NBC_2025',
    jurisdiction: 'Canada',
    title: 'Mercantile Occupancy - Definition',
    description: 'Buildings or parts of buildings used for the sale or display of merchandise.',
    category: 'OCCUPANCY',
    nbcReference: 'NBC 3.1.1.5',
    ruleData: {
      occupancyGroup: 'E',
      maxOccupancy: null,
      requirements: ['egress', 'fire_safety', 'accessibility'],
    },
  },
  {
    ruleCode: 'OCC-F-001',
    codeVersion: 'NBC_2025',
    jurisdiction: 'Canada',
    title: 'Industrial Occupancy - Definition',
    description: 'Buildings or parts of buildings used for manufacturing, processing, or storage of materials.',
    category: 'OCCUPANCY',
    nbcReference: 'NBC 3.1.1.6',
    ruleData: {
      occupancyGroup: 'F',
      maxOccupancy: null,
      requirements: ['egress', 'fire_safety', 'hazmat_handling'],
    },
  },

  // EGRESS REQUIREMENTS
  {
    ruleCode: 'EGR-001',
    codeVersion: 'NBC_2025',
    jurisdiction: 'Canada',
    title: 'Number of Exits Required',
    description: 'Minimum number of exits based on occupant load and occupancy type.',
    category: 'EGRESS',
    nbcReference: 'NBC 3.4.1.1',
    ruleData: {
      minExits: {
        occupantLoad: [0, 50, 500, 1000],
        exits: [1, 2, 3, 4],
      },
      notes: 'Occupant load determines minimum number of exits',
    },
  },
  {
    ruleCode: 'EGR-002',
    codeVersion: 'NBC_2025',
    jurisdiction: 'Canada',
    title: 'Travel Distance to Exit',
    description: 'Maximum permitted travel distance from any point to the nearest exit.',
    category: 'EGRESS',
    nbcReference: 'NBC 3.4.1.2',
    ruleData: {
      maxTravelDistance: {
        residential: 30, // meters
        commercial: 40, // meters
        industrial: 50, // meters
      },
      notes: 'Travel distance measured along floor level',
    },
  },
  {
    ruleCode: 'EGR-003',
    codeVersion: 'NBC_2025',
    jurisdiction: 'Canada',
    title: 'Exit Door Width Requirements',
    description: 'Minimum width of exit doors based on occupancy type.',
    category: 'EGRESS',
    nbcReference: 'NBC 3.4.2.1',
    ruleData: {
      minWidth: 0.9, // meters
      accessibility: 1.0, // meters for accessible routes
      notes: 'Width measured clear of frame',
    },
  },
  {
    ruleCode: 'EGR-004',
    codeVersion: 'NBC_2025',
    jurisdiction: 'Canada',
    title: 'Stair Dimensions - Rise and Run',
    description: 'Maximum riser height and minimum tread depth for stairs.',
    category: 'EGRESS',
    nbcReference: 'NBC 3.4.6.5',
    ruleData: {
      maxRiserHeight: 200, // mm
      minTreadDepth: 280, // mm
      tolerance: 6, // mm
      notes: 'Riser height measured vertically, tread depth measured horizontally',
    },
  },

  // FIRE SAFETY REQUIREMENTS
  {
    ruleCode: 'FS-001',
    codeVersion: 'NBC_2025',
    jurisdiction: 'Canada',
    title: 'Fire Alarm System Requirements',
    description: 'Buildings must be equipped with fire alarm systems based on occupancy and size.',
    category: 'FIRE_SAFETY',
    nbcReference: 'NBC 3.2.4.1',
    ruleData: {
      required: {
        residential: { area: 2000, storeys: 4 },
        commercial: { area: 500, storeys: 2 },
        industrial: { area: 1000, storeys: 2 },
      },
      notes: 'Thresholds are cumulative',
    },
  },
  {
    ruleCode: 'FS-002',
    codeVersion: 'NBC_2025',
    jurisdiction: 'Canada',
    title: 'Sprinkler System Requirements',
    description: 'Automatic sprinkler systems required in certain occupancies and building sizes.',
    category: 'FIRE_SAFETY',
    nbcReference: 'NBC 3.2.3.1',
    ruleData: {
      required: {
        residential: { area: 5000, storeys: 5 },
        commercial: { area: 2000, storeys: 3 },
        industrial: { area: 3000, storeys: 2 },
      },
      notes: 'Sprinklers reduce required fire rating',
    },
  },
  {
    ruleCode: 'FS-003',
    codeVersion: 'NBC_2025',
    jurisdiction: 'Canada',
    title: 'Fire Separation Requirements',
    description: 'Minimum fire-resistance rating for separations between occupancies.',
    category: 'FIRE_SAFETY',
    nbcReference: 'NBC 3.1.8.1',
    ruleData: {
      fireRating: {
        sameOccupancy: 0, // No separation required
        differentOccupancy: 2, // 2-hour fire rating minimum
      },
      notes: 'Fire rating in hours',
    },
  },
  {
    ruleCode: 'FS-004',
    codeVersion: 'NBC_2025',
    jurisdiction: 'Canada',
    title: 'Emergency Lighting Requirements',
    description: 'Emergency lighting required in exit routes and areas of refuge.',
    category: 'FIRE_SAFETY',
    nbcReference: 'NBC 3.2.5.1',
    ruleData: {
      minIllumination: 50, // lux
      duration: 90, // minutes
      coverage: ['exits', 'corridors', 'stairs', 'emergency_exits'],
    },
  },

  // ACCESSIBILITY REQUIREMENTS
  {
    ruleCode: 'ACC-001',
    codeVersion: 'NBC_2025',
    jurisdiction: 'Canada',
    title: 'Accessible Entrance Requirements',
    description: 'At least one accessible entrance required for all public buildings.',
    category: 'ACCESSIBILITY',
    nbcReference: 'NBC 3.8.1.1',
    ruleData: {
      minWidth: 1.0, // meters
      maxSlope: 0.05, // 1:20 ratio
      levelLanding: true,
    },
  },
  {
    ruleCode: 'ACC-002',
    codeVersion: 'NBC_2025',
    jurisdiction: 'Canada',
    title: 'Accessible Washroom Requirements',
    description: 'Accessible washrooms required in public buildings.',
    category: 'ACCESSIBILITY',
    nbcReference: 'NBC 3.8.2.1',
    ruleData: {
      minStallWidth: 1.5, // meters
      grabBars: true,
      accessibleSinks: true,
    },
  },
  {
    ruleCode: 'ACC-003',
    codeVersion: 'NBC_2025',
    jurisdiction: 'Canada',
    title: 'Grab Bar Requirements',
    description: 'Grab bars required in accessible washrooms and bathing areas.',
    category: 'ACCESSIBILITY',
    nbcReference: 'NBC 3.8.2.2',
    ruleData: {
      diameter: { min: 32, max: 38 }, // mm
      height: 850, // mm from floor
      spacing: { min: 40, max: 60 }, // mm from wall
    },
  },

  // CONSTRUCTION TYPE REQUIREMENTS
  {
    ruleCode: 'CONST-001',
    codeVersion: 'NBC_2025',
    jurisdiction: 'Canada',
    title: 'Non-Combustible Construction Requirements',
    description: 'Buildings must be constructed of non-combustible materials.',
    category: 'CONSTRUCTION',
    nbcReference: 'NBC 3.1.4.1',
    ruleData: {
      fireRating: 2, // hours minimum
      materials: ['steel', 'concrete', 'masonry'],
    },
  },
  {
    ruleCode: 'CONST-002',
    codeVersion: 'NBC_2025',
    jurisdiction: 'Canada',
    title: 'Combustible Construction Limitations',
    description: 'Combustible construction permitted only in certain occupancies and sizes.',
    category: 'CONSTRUCTION',
    nbcReference: 'NBC 3.1.4.2',
    ruleData: {
      maxHeight: { residential: 4, commercial: 3 },
      maxArea: { residential: 5000, commercial: 2000 },
      sprinklersRequired: true,
    },
  },
];

async function seedRules() {
  const connection = await pool.getConnection();

  try {
    console.log('🌱 Starting to seed NBC 2025 rules...');

    // Get admin user ID (or use 1 as default)
    const [users] = await connection.query('SELECT id FROM users LIMIT 1');
    const adminUserId = users.length > 0 ? users[0].id : 1;

    let insertedCount = 0;
    let skippedCount = 0;

    for (const rule of nbc2025Rules) {
      try {
        const query = `
          INSERT INTO rulesDatabase (
            ruleCode, codeVersion, jurisdiction, title, description, 
            category, nbcReference, ruleData, isActive, effectiveDate, 
            createdBy, version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          rule.ruleCode,
          rule.codeVersion,
          rule.jurisdiction,
          rule.title,
          rule.description,
          rule.category,
          rule.nbcReference,
          JSON.stringify(rule.ruleData),
          true,
          new Date(),
          adminUserId,
          1,
        ];

        await connection.query(query, values);
        insertedCount++;
        console.log(`✅ Inserted: ${rule.ruleCode} - ${rule.title}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          skippedCount++;
          console.log(`⏭️  Skipped (already exists): ${rule.ruleCode}`);
        } else {
          console.error(`❌ Error inserting ${rule.ruleCode}:`, error.message);
        }
      }
    }

    console.log(`\n✨ Seeding complete!`);
    console.log(`   Inserted: ${insertedCount} rules`);
    console.log(`   Skipped: ${skippedCount} rules (already exist)`);
    console.log(`   Total: ${nbc2025Rules.length} rules`);
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
  } finally {
    await connection.release();
    await pool.end();
  }
}

// Run the seed
seedRules().then(() => {
  console.log('\n✅ Database seeding completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
