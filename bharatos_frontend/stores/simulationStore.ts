'use client';
import { create } from 'zustand';
import { GridCellFeature, SimulationParams } from '../types/flood';

// Deterministic pseudo-random helper (same on server and client)
function seeded(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Realistic 250m grid across the Naini/Yamuna basin
export const generateNainiGridMesh = (rainfall: number, riverLevel: number): GeoJSON.FeatureCollection => {
  const features: any[] = [];
  const minLng = 81.844, maxLng = 81.896;
  const minLat = 25.398, maxLat = 25.438;
  const stepLng = 0.0035; // ~250m
  const stepLat = 0.0030;

  let cellIndex = 1;

  for (let lng = minLng; lng < maxLng; lng += stepLng) {
    for (let lat = minLat; lat < maxLat; lat += stepLat) {
      const distFromRiver = Math.max(0.08, Math.abs(lat - 25.434) * 111);
      const elevation = Number((60 + distFromRiver * 12 + Math.sin(lng * 80) * 2.5).toFixed(1));

      const rainFactor = (rainfall / 180) * 0.55;
      const riverFactor = (riverLevel / 8.0) * 0.45;
      const elevRisk = Math.max(0, (76 - elevation) / 18);
      const rawProb = (elevRisk * 0.72 + (1 / distFromRiver) * 0.12) * (rainFactor + riverFactor);
      const riskProbability = Math.min(0.98, Math.max(0.04, Number(rawProb.toFixed(2))));

      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (riskProbability >= 0.65) riskLevel = 'HIGH';
      else if (riskProbability >= 0.35) riskLevel = 'MEDIUM';

      const cellId = `PRY_GRID_${cellIndex.toString().padStart(3, '0')}`;
      const ward = lat > 25.422
        ? (lng < 81.870 ? 'Naini Lowland Riverbank' : 'Arail Sangam Confluence')
        : (lng < 81.870 ? 'Naini Central / Industrial' : 'Arail High Ridge');

      // Deterministic population calculation
      const deterministicPop = Math.floor(1400 + seeded(cellIndex * 41) * 2200);

      features.push({
        type: 'Feature',
        properties: {
          cellId,
          wardName: `${ward} [Cell ${cellIndex}]`,
          riskLevel,
          riskProbability,
          elevation,
          distanceToRiver: Number(distFromRiver.toFixed(2)),
          populationEst: cellIndex === 40 ? 1927 : deterministicPop,
          shapAttributions: {
            elevation: Number((0.35 + elevRisk * 0.18).toFixed(2)),
            distanceToRiver: Number((0.30 + (1 / distFromRiver) * 0.06).toFixed(2)),
            rainfall: Number((rainFactor * 0.4).toFixed(2)),
            soilMoisture: 0.15,
          },
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [lng, lat],
            [lng + stepLng * 0.94, lat],
            [lng + stepLng * 0.94, lat + stepLat * 0.94],
            [lng, lat + stepLat * 0.94],
            [lng, lat],
          ]],
        },
      });

      cellIndex++;
    }
  }

  return { type: 'FeatureCollection', features };
};

// Realistic 3D Buildings atop the terrain
export const generateNainiBuildings = (): GeoJSON.FeatureCollection => {
  const buildings: any[] = [];
  const minLng = 81.848, maxLng = 81.892;
  const minLat = 25.402, maxLat = 25.432;

  let bId = 1;
  for (let lng = minLng; lng < maxLng; lng += 0.00085) {
    for (let lat = minLat; lat < maxLat; lat += 0.00075) {
      const s = seeded(bId * 13);
      if (s > 0.15) {
        const bWidth = 0.00042 + seeded(bId * 17) * 0.00025;
        const bHeight = 0.00035 + seeded(bId * 23) * 0.00022;
        const stories = Math.floor(2 + seeded(bId * 31) * 7);
        const heightMeters = stories * 4.5;

        buildings.push({
          type: 'Feature',
          properties: {
            id: `BLD_${bId}`,
            height: heightMeters,
            base: 0,
            type: stories > 4 ? 'Commercial' : 'Residential',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [lng, lat],
              [lng + bWidth, lat],
              [lng + bWidth, lat + bHeight],
              [lng, lat + bHeight],
              [lng, lat],
            ]],
          },
        });
        bId++;
      }
    }
  }
  return { type: 'FeatureCollection', features: buildings };
};

interface SimulationStore {
  params: SimulationParams;
  isSimulating: boolean;
  progress: number;
  activeSimId: string | null;
  selectedCell: GridCellFeature | null;
  gridGeoJson: GeoJSON.FeatureCollection;
  buildingsGeoJson: GeoJSON.FeatureCollection;
  show3DBuildings: boolean;
  showRiskGrid: boolean;
  activeNav: string;
  setParams: (updates: Partial<SimulationParams>) => void;
  setSelectedCell: (cell: GridCellFeature | null) => void;
  toggle3DBuildings: () => void;
  toggleRiskGrid: () => void;
  setActiveNav: (nav: string) => void;
  triggerSimulation: (onComplete?: () => void) => void;
}

const initialGrid = generateNainiGridMesh(220, 8.6);
const initialBuildings = generateNainiBuildings();

export const useSimulationStore = create<SimulationStore>((set) => ({
  params: {
    rainfall24h: 220,
    rainfall72h: 410,
    riverLevel: 8.6,
    description: 'Naini-Sangam Inundation Scenario',
  },
  isSimulating: false,
  progress: 0,
  activeSimId: 'SIM-NAINI-8092',
  selectedCell: {
    cellId: 'PRY_GRID_040',
    wardName: 'Naini Lowland Riverbank [Cell 40]',
    riskLevel: 'HIGH',
    riskProbability: 0.87,
    elevation: 66.1,
    distanceToRiver: 0.33,
    populationEst: 1927,
    shapAttributions: {
      elevation: 0.45,
      distanceToRiver: 0.48,
      rainfall: 0.20,
      soilMoisture: 0.15,
    },
  },
  gridGeoJson: initialGrid,
  buildingsGeoJson: initialBuildings,
  show3DBuildings: true,
  showRiskGrid: true,
  activeNav: 'flood',
  setParams: (updates) => set((state) => ({ params: { ...state.params, ...updates } })),
  setSelectedCell: (selectedCell) => set({ selectedCell }),
  toggle3DBuildings: () => set((state) => ({ show3DBuildings: !state.show3DBuildings })),
  toggleRiskGrid: () => set((state) => ({ showRiskGrid: !state.showRiskGrid })),
  setActiveNav: (activeNav) => set({ activeNav }),
  triggerSimulation: (onComplete) => {
    set({ isSimulating: true, progress: 10 });
    const interval = setInterval(() => {
      set((state) => {
        if (state.progress >= 100) {
          clearInterval(interval);
          const updatedGrid = generateNainiGridMesh(state.params.rainfall24h, state.params.riverLevel);
          
          if (typeof onComplete === 'function') {
            try { onComplete(); } catch (e) {}
          }

          return {
            isSimulating: false,
            progress: 100,
            activeSimId: `SIM-NAINI-${Math.floor(1000 + seeded(Date.now()) * 9000)}`,
            gridGeoJson: updatedGrid,
            selectedCell: (updatedGrid.features[0]?.properties as any) || null,
          };
        }
        return { progress: state.progress + 25 };
      });
    }, 180);
  },
}));