export interface ElectricalChecklistItem {
  id: string;
  label: string;
  codeRef: string;
  description: string;
}

export interface RoomChecklist {
  id: string;
  name: string;
  items: ElectricalChecklistItem[];
}

export const electricalChecklists: RoomChecklist[] = [
  {
    id: "kitchen",
    name: "Kitchen",
    items: [
      {
        id: "k-1",
        label: "Countertop Receptacles",
        codeRef: "CEC 26-712(d)(iii)",
        description: "Receptacles required at each counter space 300mm or wider. No point along wall line > 900mm from a receptacle."
      },
      {
        id: "k-2",
        label: "GFCI Protection",
        codeRef: "CEC 26-700(11)",
        description: "All receptacles within 1.5m of a sink must be GFCI protected."
      },
      {
        id: "k-3",
        label: "Fridge Circuit",
        codeRef: "CEC 26-722",
        description: "Dedicated circuit required for refrigerator."
      },
      {
        id: "k-4",
        label: "Island/Peninsula",
        codeRef: "CEC 26-712(d)(iv)",
        description: "At least one receptacle required for each fixed island or peninsula counter."
      }
    ]
  },
  {
    id: "bedroom",
    name: "Bedroom / Living",
    items: [
      {
        id: "b-1",
        label: "AFCI Protection",
        codeRef: "CEC 26-656",
        description: "Arc-Fault Circuit Interrupter protection required for all receptacles."
      },
      {
        id: "b-2",
        label: "Receptacle Spacing",
        codeRef: "CEC 26-712(a)",
        description: "No point along floor line > 1.8m from a receptacle (12ft rule)."
      },
      {
        id: "b-3",
        label: "Smoke/CO Alarms",
        codeRef: "NBC 9.10.19",
        description: "Hardwired and interconnected smoke/CO alarms required on each level and outside sleeping areas."
      }
    ]
  },
  {
    id: "bathroom",
    name: "Bathroom",
    items: [
      {
        id: "ba-1",
        label: "GFCI Protection",
        codeRef: "CEC 26-700(11)",
        description: "Receptacle within 1.5m of washbasin must be GFCI protected."
      },
      {
        id: "ba-2",
        label: "Receptacle Location",
        codeRef: "CEC 26-710(f)",
        description: "At least one receptacle required within 1m of washbasin."
      },
      {
        id: "ba-3",
        label: "Bonding",
        codeRef: "CEC 10-700",
        description: "Ensure proper bonding of metal piping systems."
      }
    ]
  }
];
