// Sustainability & Energy Systems Data

export interface SustainabilityTopic {
  id: string;
  title: string;
  icon: string;
  description: string;
  codeReferences: string[];
  requirements: {
    id: string;
    category: string;
    items: string[];
  }[];
  considerations: string[];
}

export const sustainabilityData: SustainabilityTopic[] = [
  {
    id: "solar-pv",
    title: "Solar Photovoltaic (PV) Systems",
    icon: "sun",
    description: "Rooftop and ground-mounted solar panel installations for residential and commercial buildings.",
    codeReferences: [
      "CEC Rule 84 - Solar Photovoltaic Systems",
      "ABC 9.23.17 - Roof Loads (Snow + Dead Load)",
      "ABC 4.1.3.2 - Wind Load on Rooftop Equipment",
      "NBC 2020 Part 4 - Structural Design",
    ],
    requirements: [
      {
        id: "electrical",
        category: "Electrical Requirements (CEC Rule 84)",
        items: [
          "PV system disconnect required within sight of service panel",
          "Maximum system voltage: 600V for residential, 1000V for commercial",
          "Grounding: All metallic frames and racking must be bonded",
          "Arc-fault protection required for rooftop systems (CEC 84-030)",
          "Rapid shutdown required: Conductors >1m from array must de-energize to ≤30V within 30 seconds",
          "Inverter must be CSA/UL listed and meet CEC standards",
          "Conduit: Use Schedule 40 PVC or EMT for exposed outdoor runs",
        ],
      },
      {
        id: "structural",
        category: "Structural Requirements (ABC/NBC)",
        items: [
          "Roof load capacity: Verify existing structure can support 15-25 kg/m² (panels + racking + snow)",
          "Wind load: Panels must withstand wind pressures per NBC 2020 climatic data",
          "Attachment: Penetrations through roof membrane must be flashed and sealed",
          "Racking: Must be engineered and stamped by P.Eng for arrays >10 kW",
          "Setbacks: Minimum 1m from roof edge for fire access (AHJ specific)",
        ],
      },
      {
        id: "permitting",
        category: "Permitting & Inspection",
        items: [
          "Electrical permit required for all PV installations",
          "Building permit required if structural modifications or roof penetrations",
          "Utility interconnection agreement required (EPCOR, ENMAX, etc.)",
          "Net metering application (if selling excess power back to grid)",
          "Final inspection by ESA (Electrical Safety Authority) or AHJ",
        ],
      },
    ],
    considerations: [
      "Optimal tilt angle in Alberta: 35-45° for year-round production",
      "South-facing orientation preferred; east/west acceptable with 10-15% loss",
      "Shading analysis required: Even partial shade reduces output significantly",
      "Micro-inverters vs. string inverters: Micro-inverters better for shaded roofs",
      "Battery storage: Requires separate electrical permit and fire safety plan",
      "Insurance: Notify home insurance provider; may increase premiums slightly",
    ],
  },
  {
    id: "ev-charging",
    title: "Electric Vehicle (EV) Charging Stations",
    icon: "zap",
    description: "Level 1, Level 2, and DC fast charging installations for residential and commercial properties.",
    codeReferences: [
      "CEC Rule 86 - Electric Vehicle Charging Systems",
      "ABC 9.34.3 - Garage Electrical Requirements",
      "CEC 8-200 - Branch Circuit Loading",
    ],
    requirements: [
      {
        id: "residential",
        category: "Residential Charging (Level 1 & 2)",
        items: [
          "Level 1 (120V, 15A): Uses standard outlet, no permit required",
          "Level 2 (240V, 40-80A): Requires dedicated 40A or 50A circuit",
          "GFCI protection required for all EV charging circuits (CEC 86-302)",
          "Disconnect switch required within sight of charging station",
          "Conduit: EMT or PVC Schedule 40 for outdoor/garage runs",
          "Receptacle: NEMA 14-50 (50A) or hardwired EVSE unit",
          "Load calculation: Add 40A (9.6 kW) to service load calculation",
        ],
      },
      {
        id: "commercial",
        category: "Commercial Charging Stations",
        items: [
          "Multiple chargers: Load management system required for >2 units",
          "Accessibility: Minimum 1 barrier-free stall per 20 EV spaces",
          "Signage: \"EV Charging Only\" signs required per municipal bylaw",
          "Metering: Separate meter or sub-meter for billing (if applicable)",
          "Network connectivity: Ethernet or cellular for payment processing",
          "Bollards or wheel stops to protect equipment from vehicle impact",
        ],
      },
      {
        id: "service-upgrade",
        category: "Service Panel Upgrades",
        items: [
          "Existing 100A service: May require upgrade to 200A for Level 2 charging",
          "Load calculation: Total connected load must not exceed 80% of panel rating",
          "Smart load management: Devices like \"Neurio\" can balance EV load with home demand",
          "Future-proofing: Install conduit stub for second charger even if not used immediately",
        ],
      },
    ],
    considerations: [
      "Charging speed: Level 2 adds ~40-50 km of range per hour",
      "Installation cost: $1,500-3,000 for Level 2 (including panel upgrade if needed)",
      "Rebates: Check for provincial/federal incentives (e.g., Canada Greener Homes Grant)",
      "Outdoor installations: Use weatherproof enclosure rated for -40°C",
      "Cord management: Wall-mounted holster or retractable reel recommended",
      "Smart chargers: Wi-Fi enabled units allow scheduling during off-peak hours",
    ],
  },
  {
    id: "tankless-heaters",
    title: "On-Demand (Tankless) Water Heaters",
    icon: "droplet",
    description: "Instantaneous water heating systems for residential and light commercial applications.",
    codeReferences: [
      "NPC 2.6.3 - Water Heaters",
      "CEC 26-700 - Fixed Electric Space Heating Equipment",
      "ABC 9.32.3 - Combustion Air",
      "ABC 9.32.4 - Venting of Appliances",
    ],
    requirements: [
      {
        id: "gas-tankless",
        category: "Gas-Fired Tankless Heaters",
        items: [
          "Gas line sizing: Typically requires 3/4\" or 1\" gas line (150,000-200,000 BTU/hr)",
          "Venting: Direct vent (sealed combustion) or power vent required",
          "Vent diameter: 3\" or 4\" PVC/CPVC for condensing models",
          "Combustion air: Sealed units draw air from outside (preferred)",
          "Clearances: Minimum 6\" from combustibles (check manufacturer specs)",
          "Condensate drain: Required for condensing models (pH neutralizer recommended)",
          "Gas permit required for all installations",
        ],
      },
      {
        id: "electric-tankless",
        category: "Electric Tankless Heaters",
        items: [
          "Whole-home units: Require 100-150A dedicated circuit (3-phase for large units)",
          "Point-of-use units: 20-40A circuit for single sink/shower",
          "Wire sizing: #6 AWG copper minimum for 40A, #3 AWG for 60A",
          "Breaker: Tandem breaker not permitted; must be dedicated circuit",
          "Service upgrade: Most homes need 200A service for whole-home electric tankless",
          "Cold climate limitation: Electric tankless less efficient in Alberta winters",
        ],
      },
      {
        id: "installation",
        category: "Installation Requirements",
        items: [
          "Location: Must be accessible for maintenance; not in attic or crawlspace",
          "Water pressure: Minimum 30 PSI required; pressure regulator if >80 PSI",
          "Inlet filter: Sediment filter required to protect heat exchanger",
          "Isolation valves: Ball valves on inlet and outlet for servicing",
          "Expansion tank: Required if check valve present on main water line",
          "Temperature setting: Maximum 49°C (120°F) to prevent scalding (ABC 7.6.2.2)",
        ],
      },
    ],
    considerations: [
      "Sizing: Calculate peak demand (GPM) for simultaneous fixtures (e.g., 2 showers + dishwasher = 6-8 GPM)",
      "Temperature rise: Alberta groundwater ~4°C; need 45°C rise to reach 49°C output",
      "Gas vs. Electric: Gas units more cost-effective for whole-home; electric better for point-of-use",
      "Maintenance: Annual descaling required in hard water areas (Calgary, Red Deer)",
      "Lifespan: 15-20 years vs. 8-12 years for tank heaters",
      "Energy savings: 20-30% reduction in water heating costs vs. tank heaters",
    ],
  },
  {
    id: "grid-integration",
    title: "Grid Integration & Net Metering",
    icon: "network",
    description: "Connecting renewable energy systems to the utility grid and selling excess power.",
    codeReferences: [
      "CEC Rule 84-030 - Utility-Interactive Inverters",
      "Alberta Micro-Generation Regulation",
      "EPCOR/ENMAX Interconnection Standards",
    ],
    requirements: [
      {
        id: "interconnection",
        category: "Utility Interconnection Process",
        items: [
          "Step 1: Submit interconnection application to utility (EPCOR, ENMAX, etc.)",
          "Step 2: Utility reviews system design and issues approval (2-4 weeks)",
          "Step 3: Install system and pass ESA electrical inspection",
          "Step 4: Utility installs bi-directional meter (net metering)",
          "Step 5: System activated; excess power credited to account",
          "System size limit: 5 MW for micro-generation in Alberta",
        ],
      },
      {
        id: "technical",
        category: "Technical Requirements",
        items: [
          "Inverter: Must be CSA certified for utility-interactive operation",
          "Anti-islanding protection: Inverter must disconnect if grid fails (CEC 84-030)",
          "Disconnect switch: Lockable AC disconnect visible from meter",
          "Grounding: System must be bonded to service ground",
          "Voltage regulation: Inverter output must match grid voltage ±5%",
          "Frequency: 60 Hz ±0.5 Hz synchronization required",
        ],
      },
      {
        id: "metering",
        category: "Net Metering & Billing",
        items: [
          "Credit rate: Excess power credited at retail rate (same as purchase rate)",
          "Annual reconciliation: Unused credits expire after 12 months",
          "Meter upgrade: Utility replaces standard meter with bi-directional meter (no cost)",
          "Monitoring: Real-time production data via inverter app or web portal",
          "System size: Must not exceed 110% of annual consumption for optimal credit use",
        ],
      },
    ],
    considerations: [
      "Payback period: Typical solar PV system in Alberta: 12-18 years",
      "Federal incentives: Canada Greener Homes Grant up to $5,000 for solar",
      "Provincial programs: Check for current Alberta rebates (vary by year)",
      "Property value: Solar systems can increase home resale value 3-4%",
      "Transferability: Net metering agreement transfers with property sale",
      "Insurance: Liability coverage required for grid-connected systems",
    ],
  },
  {
    id: "energy-efficiency",
    title: "Energy Efficiency Standards",
    icon: "leaf",
    description: "Building envelope, insulation, and HVAC requirements for energy-efficient construction.",
    codeReferences: [
      "ABC 9.36 - Energy Efficiency",
      "NBC 2020 Part 9.36 - Energy Efficiency",
      "EnerGuide Rating System",
    ],
    requirements: [
      {
        id: "envelope",
        category: "Building Envelope (ABC 9.36)",
        items: [
          "Ceiling insulation: R-50 minimum (blown-in or batt)",
          "Above-grade walls: R-22 minimum (2x6 framing with R-20 batt + R-2 foam)",
          "Below-grade walls: R-12 minimum (basement walls)",
          "Floors over unheated spaces: R-31 minimum",
          "Windows: U-factor ≤1.40, SHGC ≥0.25 (triple-pane recommended)",
          "Doors: U-factor ≤1.60 (insulated steel or fiberglass)",
          "Air barrier: Continuous air barrier required (poly, sealed drywall, or Tyvek)",
        ],
      },
      {
        id: "mechanical",
        category: "HVAC & Ventilation",
        items: [
          "Furnace efficiency: Minimum 95% AFUE for gas furnaces",
          "Air conditioner: Minimum SEER 14 (SEER 16+ recommended)",
          "Heat pump: Minimum HSPF 8.5 for cold climate models",
          "HRV/ERV: Required for homes with <0.60 ACH50 air leakage",
          "Ductwork: All ducts in unconditioned spaces must be insulated to R-12",
          "Programmable thermostat: Required for all forced-air systems",
        ],
      },
      {
        id: "testing",
        category: "Performance Testing",
        items: [
          "Blower door test: Maximum 2.50 ACH50 for new construction",
          "Duct leakage test: Maximum 10% leakage to outside",
          "EnerGuide rating: Required for new homes in some municipalities",
          "Thermal imaging: Recommended to identify insulation gaps",
        ],
      },
    ],
    considerations: [
      "Payback: High-efficiency upgrades typically pay back in 5-10 years",
      "Rebates: Efficiency Alberta offers rebates for insulation, windows, and HVAC",
      "Passive solar: South-facing windows can reduce heating costs 15-25%",
      "Thermal mass: Concrete or tile floors store heat from sun",
      "LED lighting: Use LED bulbs exclusively; 75% energy savings vs. incandescent",
      "Smart home: Programmable thermostats and smart plugs reduce phantom loads",
    ],
  },
];
