export interface GridCellFeature {
  cellId: string;
  wardName: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskProbability: number;
  elevation: number;
  distanceToRiver: number;
  populationEst: number;
  shapAttributions: {
    elevation: number;
    distanceToRiver: number;
    rainfall: number;
    soilMoisture: number;
  };
}

export interface SimulationParams {
  rainfall24h: number;
  rainfall72h: number;
  riverLevel: number;
  description: string;
}