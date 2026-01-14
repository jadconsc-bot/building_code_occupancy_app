declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';
  
  interface AutoTableOptions {
    startY?: number;
    head?: any[][];
    body?: any[][];
    theme?: 'plain' | 'grid' | 'striped';
    headStyles?: any;
    styles?: any;
    margin?: { left?: number; right?: number; top?: number; bottom?: number };
    [key: string]: any;
  }

  export function autoTable(doc: jsPDF, options: AutoTableOptions): void;
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}
