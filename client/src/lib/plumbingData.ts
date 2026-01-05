export interface PlumbingChecklistItem {
  id: string;
  label: string;
  codeRef: string;
  description: string;
}

export interface RoomPlumbingChecklist {
  id: string;
  name: string;
  items: PlumbingChecklistItem[];
}

export const plumbingChecklists: RoomPlumbingChecklist[] = [
  {
    id: "kitchen",
    name: "Kitchen",
    items: [
      {
        id: "pk-1",
        label: "Dishwasher Drainage",
        codeRef: "NPC 2.4.2.1",
        description: "Discharge hose must be looped as high as possible (air break) or connected to a separate trap."
      },
      {
        id: "pk-2",
        label: "Trap Arm Length",
        codeRef: "NPC 2.5.6.3",
        description: "Maximum length of trap arm for 1.5\" pipe is 1.8m (6ft). Minimum slope 1:50."
      },
      {
        id: "pk-3",
        label: "Cleanouts",
        codeRef: "NPC 2.4.7.1",
        description: "Cleanout required at the base of every stack and at changes of direction > 45 degrees."
      },
      {
        id: "pk-4",
        label: "Shut-off Valves",
        codeRef: "NPC 2.6.1.3",
        description: "Individual shut-off valves required for every fixture (hot and cold)."
      }
    ]
  },
  {
    id: "bathroom",
    name: "Bathroom",
    items: [
      {
        id: "pb-1",
        label: "Toilet Clearance",
        codeRef: "NPC 2.4.9.2",
        description: "Minimum 380mm (15\") from center of WC to side wall or vanity."
      },
      {
        id: "pb-2",
        label: "Shower Base",
        codeRef: "NPC 2.4.9.1",
        description: "Minimum 900mm x 900mm finished area for shower compartment."
      },
      {
        id: "pb-3",
        label: "Venting",
        codeRef: "NPC 2.5.8",
        description: "Every trap must be protected by a vent. Wet venting permitted for bathroom groups."
      },
      {
        id: "pb-4",
        label: "Safety Glass",
        codeRef: "NBC 9.6.1.4",
        description: "Glass used in shower doors or enclosures must be safety glass (tempered/laminated)."
      }
    ]
  },
  {
    id: "general",
    name: "General / Utility",
    items: [
      {
        id: "pg-1",
        label: "Backwater Valve",
        codeRef: "NPC 2.4.6.4",
        description: "Required on sanitary building drains where fixtures are below the upstream manhole cover."
      },
      {
        id: "pg-2",
        label: "Floor Drains",
        codeRef: "NPC 2.4.10.3",
        description: "Required in basements/service rooms near furnace or hot water tank."
      },
      {
        id: "pg-3",
        label: "Water Hammer Arrestors",
        codeRef: "NPC 2.6.1.9",
        description: "Required on supply lines to quick-closing valves (e.g., washing machines, dishwashers)."
      }
    ]
  }
];
