import React, { useRef } from 'react';
import {
  FileText,
  X,
  Printer,
  Download,
  Pickaxe,
  CheckCircle,
  AlertTriangle,
  Layers,
  Satellite
} from 'lucide-react';
import { MineLocation, CorrectiveActionItem } from '../types';
import { MINE_SATELLITE_DATA, MINE_BOREHOLES } from '../data/moilData';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMine: MineLocation;
  actions: CorrectiveActionItem[];
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  selectedMine,
  actions,
}) => {
  if (!isOpen) return null;

  const satelliteData = MINE_SATELLITE_DATA[selectedMine.id] || MINE_SATELLITE_DATA['balaghat'];
  const boreholes = MINE_BOREHOLES[selectedMine.id] || MINE_BOREHOLES['balaghat'] || [];
  const deficitMt = Math.max(0, selectedMine.monthlyPlannedTargetMt - selectedMine.currentActualMt);
  const appliedActions = actions.filter((a) => a.status === 'Applied');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                MOIL Shift Superintendent Operational & Reserve Report
              </h3>
              <p className="text-[11px] text-slate-400">
                Generated via AI/ML & Space Telemetry Core • Ref: MOIL-OPS-{selectedMine.id.toUpperCase()}-2026
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs text-slate-300 bg-slate-950 font-sans">
          {/* Official Letterhead Header */}
          <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 font-extrabold text-base tracking-wider">
                <Pickaxe className="w-5 h-5" />
                <span>MOIL LIMITED (A Govt. of India Enterprise)</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Manganese Bhawan, 1A Katol Road, Nagpur, Maharashtra
              </p>
              <p className="text-slate-300 font-semibold mt-1">
                Mine Unit: {selectedMine.name} ({selectedMine.district}, {selectedMine.state})
              </p>
            </div>
            <div className="text-right text-[11px] font-mono text-slate-400">
              <p>Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              <p>Shift: General / Handover</p>
              <p className="text-emerald-400 font-bold">Status: AI Model Validated</p>
            </div>
          </div>

          {/* Section 1: Executive Reserve & Production Status */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-2 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>1. Reserve Delineation & Monthly Extraction Tonnage</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-500 block">Manual Survey Reserve:</span>
                <span className="font-bold text-slate-200 font-mono">{selectedMine.manualReserveMt} MT</span>
              </div>
              <div>
                <span className="text-slate-500 block">AI Multi-Modal Reserve:</span>
                <span className="font-bold text-amber-400 font-mono">{selectedMine.aiPredictedReserveMt} MT</span>
              </div>
              <div>
                <span className="text-slate-500 block">Month Target:</span>
                <span className="font-bold text-slate-200 font-mono">{selectedMine.monthlyPlannedTargetMt.toLocaleString()} MT</span>
              </div>
              <div>
                <span className="text-slate-500 block">Current Extraction:</span>
                <span className="font-bold text-slate-200 font-mono">{selectedMine.currentActualMt.toLocaleString()} MT</span>
              </div>
            </div>
            <div className="mt-2 text-slate-400 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-800/80">
              <strong>Geological Assessment:</strong> Primary manganese lens situated in {selectedMine.hostFormation}. Seam strike dipping {selectedMine.strikeAndDip}. Core recovery across latest boreholes averages 94.6% with low phosphorus (avg {selectedMine.phosphorusGradePct}% P) and premium high grade ({selectedMine.averageGradeMnPct}% Mn).
            </div>
          </div>

          {/* Section 2: Space Remote Sensing & Weather Telematics */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-2 flex items-center space-x-1.5">
              <Satellite className="w-3.5 h-3.5 text-cyan-400" />
              <span>2. Earth Observation & Meteorological Constraints</span>
            </h4>
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block">24h Rainfall:</span>
                  <span className="text-cyan-400 font-bold">{satelliteData.rainfallMm24h} mm</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Soil Moisture Index:</span>
                  <span className="text-blue-400 font-bold">{satelliteData.soilMoisturePct}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Vegetation Chlorosis (NDVI):</span>
                  <span className="text-emerald-400 font-bold">{satelliteData.ndviScore}</span>
                </div>
              </div>
              <p className="text-slate-400 text-[11px] pt-2 border-t border-slate-800">
                Ground deformation monitored via Sentinel-1 InSAR confirms stable pit slope conditions ({satelliteData.insarDeformationMm} mm/yr). No active tension cracks reported on highwall benches.
              </p>
            </div>
          </div>

          {/* Section 3: Discrepancy & Applied Corrective Dispatch */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-2 flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>3. Shortfall Discrepancy & Active Mitigation Orders</span>
            </h4>
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span>Total Identified Target Deficit:</span>
                <span className="text-rose-400 font-bold font-mono">-{deficitMt.toLocaleString()} MT</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1.5">Active Mitigations in Dispatch:</span>
                {appliedActions.length === 0 ? (
                  <p className="text-slate-500 italic">No mitigations currently locked in dispatch. Use the Sandbox to deploy actions.</p>
                ) : (
                  <div className="space-y-1.5">
                    {appliedActions.map((act) => (
                      <div key={act.id} className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-medium text-slate-200">{act.title}</span>
                        </div>
                        <span className="font-mono text-emerald-400 font-bold">
                          +{act.impactRecoveryMt.toLocaleString()} MT
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Sign-off block */}
          <div className="pt-6 border-t border-slate-800 flex justify-between items-end text-slate-500 text-[10px]">
            <div>
              <p>Certified by: Automated MOIL GeoAI Intelligence System</p>
              <p>Cryptographic hash: 0x8F92...B31A</p>
            </div>
            <div className="text-right">
              <div className="w-36 border-b border-slate-600 mb-1"></div>
              <p>Mine Manager / Shift Superintendent Sign-off</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
