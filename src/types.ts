export type MineType = 'Underground' | 'Opencast' | 'Mixed';

export interface MineLocation {
  id: string;
  name: string;
  state: string;
  district: string;
  type: MineType;
  coordinates: {
    lat: number;
    lng: number;
  };
  latitude?: number;
  longitude?: number;
  manualReserveMt: number;
  aiPredictedReserveMt: number;
  monthlyPlannedTargetMt: number;
  currentActualMt: number;
  averageGradeMnPct: number;
  phosphorusGradePct: number;
  hostFormation: string;
  strikeAndDip: string;
  status: 'Normal' | 'Shortfall Risk' | 'Critical Discrepancy' | 'Weather Watch';
  activePitsStopes: number;
  depthMeters: number;
}

export interface SatelliteLayerData {
  ndviScore: number; // 0 to 1 (Vegetation index)
  lstCelsius: number; // Land surface temperature
  soilMoisturePct: number; // 0 to 100%
  rainfallMm24h: number; // Precipitation
  swirMineralRatio: number; // SWIR Band ratio (Mn gossan indicator)
  insarDeformationMm: number; // Millimeter ground displacement
  cloudCoverPct: number;
  satellitePassTime: string;
  sensor: 'Sentinel-2 Multispectral' | 'Landsat-9 OLI/TIRS' | 'Sentinel-1 InSAR' | 'GPM Core IMD';
}

export interface BoreholeCore {
  holeId: string;
  depthFrom: number;
  depthTo: number;
  thicknessMeters: number;
  mnGradePct: number;
  feGradePct: number;
  sio2Pct: number;
  pPct: number;
  lithology: 'Manganese Ore (Braunite/Pyrolusite)' | 'Munsar Mica-Schist' | 'Lohangi Calc-Silicate' | 'Sitasaongi Quartzite' | 'Gondite Horizon';
  ertResistivityOhmM: number;
  ipChargeabilityMvV: number;
  coreRecoveryPct: number;
  mineralizationConfidence: number; // percentage
}

export interface EquipmentFleetItem {
  id: string;
  unitCode: string;
  type: 'Excavator (Hydraulic)' | 'Articulated Dumper' | 'Underground LHD' | 'Mine Hoist/Winder' | 'Rotary Blast Drill' | 'Submersible Dewatering Pump';
  status: 'Operational' | 'Standby' | 'Maintenance' | 'Sub-optimal';
  availabilityPct: number;
  utilizationPct: number;
  mtbfHours: number;
  operatorShift: 'Shift A' | 'Shift B' | 'Shift C';
  fuelOrPowerDraw: string;
  alertNote?: string;
}

export interface ProductionTrendPoint {
  date: string;
  plannedMt: number;
  actualMt: number;
  shortfallMt: number;
  rainfallMm: number;
  equipmentAvailPct: number;
}

export interface CorrectiveActionItem {
  id: string;
  title: string;
  category: 'Shift Re-allocation' | 'Standby HEMM Dispatch' | 'Dynamic Rerouting' | 'Dewatering Surge' | 'Grade Blending';
  impactRecoveryMt: number;
  estimatedCostTier: 'Low' | 'Medium' | 'High';
  executionTimeHours: number;
  description: string;
  status: 'Pending' | 'Applied' | 'Simulated';
  priority: 'Immediate' | 'Recommended' | 'Discretionary';
}

export interface ShortfallPredictionResult {
  shortfallRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  predictedDeficitMt: number;
  probabilityPercent: number;
  primaryDrivers: string[];
  correctiveActions: string[];
  projectedRecoveryMt: number;
}

export interface OperationalAlert {
  id: string;
  mineId: string;
  mineName: string;
  severity: 'warning' | 'critical' | 'info';
  timestamp: string;
  category: 'Weather / Rain' | 'Equipment Breakdown' | 'Grade Variance' | 'Blasting Delay' | 'Subsurface Anomaly';
  message: string;
  resolved: boolean;
}
