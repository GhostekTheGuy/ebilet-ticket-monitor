export interface SectorData {
  id: string;
  name: string;
  zone: 'red' | 'yellow' | 'green' | 'ga';
  available: number;
}

export interface HistoryPoint {
  timestamp: number;
  totalAvailable: number;
}

export interface ZoneSummary {
  name: string;
  zone: 'red' | 'yellow' | 'green' | 'ga';
  totalAvailable: number;
  totalSectors: number;
  soldOutSectors: number;
  color: string;
}

export interface ApiResponse {
  sfc: Record<string, number>;
}

export interface TicketSnapshot {
  id: number;
  timestamp: string;
  total_available: number;
  raw_data: Record<string, number>;
}

export interface HistoryResponse {
  history: HistoryPoint[];
}

export const SECTORS: Record<string, { name: string; zone: 'red' | 'yellow' | 'green' | 'ga' }> = {
  "218143106950759092": { name: "D11", zone: "green" },
  "218143106950759093": { name: "D14", zone: "yellow" },
  "218143106950759094": { name: "D15", zone: "yellow" },
  "218143106950758960": { name: "PŁYTA - GA", zone: "ga" },
  "218143106950759095": { name: "D16", zone: "yellow" },
  "218143106950759096": { name: "D17", zone: "yellow" },
  "218143106950759097": { name: "D20", zone: "red" },
  "218143106950759098": { name: "V01", zone: "red" },
  "218143106950759099": { name: "V02", zone: "red" },
  "218143106950759100": { name: "V04", zone: "red" },
  "218143106950759101": { name: "V05", zone: "red" },
  "218143106950758982": { name: "V03", zone: "red" },
  "218143106950758983": { name: "G34", zone: "red" },
  "218143106950758984": { name: "G33", zone: "red" },
  "218143106950758985": { name: "G32", zone: "yellow" },
  "218143106950758986": { name: "G31", zone: "yellow" },
  "218143106950758987": { name: "G26", zone: "green" },
  "218143106950758988": { name: "G25", zone: "green" },
  "218143106950758989": { name: "G24", zone: "green" },
  "218143106950758990": { name: "G23", zone: "green" },
  "218143106950758995": { name: "G27", zone: "yellow" },
  "218143106950758996": { name: "G30", zone: "yellow" },
  "218143106950758997": { name: "G29", zone: "yellow" },
  "218143106950758998": { name: "G28", zone: "yellow" },
  "218143106950758999": { name: "D13", zone: "yellow" },
  "218143106950759000": { name: "D12", zone: "green" },
  "218143106950759001": { name: "D18", zone: "yellow" },
  "218143106950759002": { name: "D19", zone: "red" },
  "218143106950759006": { name: "K4", zone: "yellow" },
  "218143106950759074": { name: "G35", zone: "red" },
  "218143106950759075": { name: "G36", zone: "red" },
  "218143106950759076": { name: "G37", zone: "red" },
  "218143106950759077": { name: "G1", zone: "red" },
  "218143106950759078": { name: "G2", zone: "red" },
  "218143106950759079": { name: "G3", zone: "red" },
  "218143106950759081": { name: "G22", zone: "green" },
  "218143106950759082": { name: "G21", zone: "green" },
  "218143106950759083": { name: "G20", zone: "green" },
  "218143106950759085": { name: "G18", zone: "green" },
  "218143106950759086": { name: "G19", zone: "green" },
  "218143106950759088": { name: "C01", zone: "green" },
  "218143106950759089": { name: "C02", zone: "green" },
  "218143106950759090": { name: "C03", zone: "green" },
  "218143106950759091": { name: "C04", zone: "green" },
  "218143106950759021": { name: "K2", zone: "green" },
};

export const WATCHED_SECTORS = ['C01', 'C02', 'C03', 'C04', 'D15', 'D16', 'V05'];
