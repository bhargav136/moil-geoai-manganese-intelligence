import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Search,
  Activity,
  Drill,
  ShieldCheck,
  Zap,
  TrendingUp,
  FileCheck2,
  ChevronRight,
  Database
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import { MineLocation, BoreholeCore } from '../types';
import { MINE_BOREHOLES } from '../data/moilData';

interface SubsurfaceReserveViewerProps {
  selectedMine: MineLocation;
  onTriggerAiReserveCheck: () => void;
  isAiAnalyzing: boolean;
  aiReserveResult: any;
}

export const SubsurfaceReserveViewer: React.FC<SubsurfaceReserveViewerProps> = ({
  selectedMine,
  onTriggerAiReserveCheck,
  isAiAnalyzing,
  aiReserveResult,
}) => {
  const boreholes: BoreholeCore[] = MINE_BOREHOLES[selectedMine.id] || MINE_BOREHOLES['balaghat'] || [];
  const [selectedBorehole, setSelectedBorehole] = useState<BoreholeCore>(boreholes[0] || {} as BoreholeCore);

  // Geophysical profile data derived from boreholes
  const geophysicsData = boreholes.map((bh) => ({
    name: bh.holeId,
    depth: bh.depthFrom,
    mnGrade: bh.mnGradePct,
    ertResistivity: bh.ertResistivityOhmM,
    ipChargeability: bh.ipChargeabilityMvV,
  }));

  // UNFC reserve categories
  const proved111 = (selectedMine.aiPredictedReserveMt * 0.62).toFixed(2);
  const probable122 = (selectedMine.aiPredictedReserveMt * 0.28).toFixed(2);
  const inferred333 = (selectedMine.aiPredictedReserveMt * 0.10).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Top Banner with AI Re-estimation CTA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Subsurface Geology, Borehole Assays & UNFC Reserve Mapping</h2>
          </div>
          <p className="text-xs text-slate-400">
            Fusing diamond drill core assays, electrical resistivity (ERT), and space indicators to delineate high-grade manganese ore
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">Host Series: </span>
            <span className="text-emerald-400 font-semibold">{selectedMine.hostFormation}</span>
          </div>
          <button
            id="btn-recalibrate-reserves"
            onClick={onTriggerAiReserveCheck}
            disabled={isAiAnalyzing}
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm shadow-emerald-950/40 transition active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>{isAiAnalyzing ? 'Synthesizing with Gemini...' : 'Recalibrate with AI Model'}</span>
          </button>
        </div>
      </div>

      {/* AI Reserve Assessment Callout if Available */}
      {aiReserveResult && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-emerald-300">
                Gemini AI Geological Reserve Estimation Assessment
              </h3>
            </div>
            <span className="text-xs font-mono bg-emerald-950 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-700 font-semibold">
              Confidence: {aiReserveResult.confidenceScore || 94}%
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed mb-3">
            {aiReserveResult.aiInterpretation}
          </p>
          {aiReserveResult.keyAnomalies && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {aiReserveResult.keyAnomalies.map((anom: string, i: number) => (
                <div key={i} className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></div>
                  <span>{anom}</span>
                </div>
              ))}
            </div>
          )}
          {aiReserveResult.explorationRecommendation && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300 flex items-center justify-between">
              <span className="text-slate-400 font-medium">Recommended Exploration Next Step:</span>
              <span className="text-amber-400 font-semibold">{aiReserveResult.explorationRecommendation}</span>
            </div>
          )}
        </div>
      )}

      {/* UNFC Reserve Hierarchy & Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block mb-1">Manual Baseline Reserve</span>
          <div className="text-xl font-bold text-slate-300">{selectedMine.manualReserveMt} MT</div>
          <span className="text-[11px] text-slate-500">Based on historical 50m grid spacing</span>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4 bg-emerald-950/10">
          <span className="text-xs text-emerald-400 font-medium block mb-1">UNFC 111 (Proved Reserves)</span>
          <div className="text-xl font-bold text-white">{proved111} MT</div>
          <span className="text-[11px] text-emerald-300/80">Drilled & 3D assayed, 95%+ confidence</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block mb-1">UNFC 122 (Probable Reserves)</span>
          <div className="text-xl font-bold text-white">{probable122} MT</div>
          <span className="text-[11px] text-slate-400">ERT geophysics + surface gossan match</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block mb-1">UNFC 333 (Inferred Resources)</span>
          <div className="text-xl font-bold text-white">{inferred333} MT</div>
          <span className="text-[11px] text-slate-400">Down-dip extension via AI multi-spectral</span>
        </div>
      </div>

      {/* Geological Cross Section & Core Drill Log Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 2D Stratigraphic Cross Section Canvas (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Geological Cross-Section & Ore Seam Geometry</h3>
                <p className="text-xs text-slate-400">
                  Strike: {selectedMine.strikeAndDip} • Stratigraphic dip profile across Sausar Group
                </p>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded font-mono">
                Scale 1:2000
              </span>
            </div>

            {/* Cross Section SVG */}
            <div className="relative w-full h-72 bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
              <svg viewBox="0 0 600 320" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                {/* Surface line */}
                <path d="M 0,50 Q 150,45 300,55 T 600,48" stroke="#10b981" strokeWidth="2" fill="none" />
                <text x="10" y="42" fill="#6ee7b7" fontSize="10" fontWeight="bold">
                  Surface Topography (RL +340m)
                </text>

                {/* Overburden Layer (Alluvium & Weathered Zone) */}
                <path d="M 0,50 L 600,48 L 600,85 L 0,85 Z" fill="#78350f" fillOpacity="0.25" />
                <text x="20" y="75" fill="#d97706" fontSize="9">
                  Weathered Overburden / Laterite
                </text>

                {/* Hanging Wall: Munsar Mica-Schist */}
                <path d="M 0,85 L 600,85 L 600,145 L 0,165 Z" fill="#334155" fillOpacity="0.6" />
                <text x="30" y="125" fill="#cbd5e1" fontSize="10" fontWeight="500">
                  Munsar Formation (Mica-Schist Hanging Wall)
                </text>

                {/* Manganese Ore Seam (Braunite & Pyrolusite lens, dipping 65 deg South) */}
                <path
                  d="M 120,135 L 280,130 L 520,290 L 360,300 Z"
                  fill="#7e22ce"
                  fillOpacity="0.85"
                  stroke="#c084fc"
                  strokeWidth="2"
                />
                <text x="270" y="210" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  Manganese Ore Seam (44.5% Mn)
                </text>

                {/* Gondite Horizon (Manganese silicate lens) */}
                <path
                  d="M 280,130 L 330,128 L 570,285 L 520,290 Z"
                  fill="#a855f7"
                  fillOpacity="0.35"
                  stroke="#a855f7"
                  strokeDasharray="4 2"
                />
                <text x="430" y="195" fill="#e9d5ff" fontSize="9">
                  Gondite
                </text>

                {/* Footwall: Sitasaongi Quartzite / Tirodi Gneiss */}
                <path d="M 0,165 L 120,135 L 360,300 L 0,320 Z" fill="#1e293b" fillOpacity="0.9" />
                <text x="40" y="250" fill="#94a3b8" fontSize="10" fontWeight="500">
                  Sitasaongi Quartzite (Competent Footwall)
                </text>

                {/* Drillhole trajectories */}
                {boreholes.map((bh, idx) => {
                  const startX = 80 + idx * 110;
                  const endX = startX + 70;
                  const isSelected = selectedBorehole.holeId === bh.holeId;
                  return (
                    <g
                      key={bh.holeId}
                      className="cursor-pointer group"
                      onClick={() => setSelectedBorehole(bh)}
                    >
                      <line
                        x1={startX}
                        y1="50"
                        x2={endX}
                        y2="280"
                        stroke={isSelected ? '#f59e0b' : '#38bdf8'}
                        strokeWidth={isSelected ? '3' : '1.5'}
                        strokeDasharray={isSelected ? 'none' : '4 2'}
                      />
                      <circle cx={startX} cy="50" r="4" fill="#f59e0b" />
                      <text
                        x={startX - 15}
                        y="35"
                        fill={isSelected ? '#fbbf24' : '#cbd5e1'}
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {bh.holeId}
                      </text>
                    </g>
                  );
                })}

                {/* Depth scale on right */}
                <g stroke="#475569" strokeWidth="0.5">
                  <line x1="580" y1="50" x2="590" y2="50" />
                  <text x="550" y="53" fill="#64748b" fontSize="8">
                    0m
                  </text>
                  <line x1="580" y1="140" x2="590" y2="140" />
                  <text x="540" y="143" fill="#64748b" fontSize="8">
                    -150m
                  </text>
                  <line x1="580" y1="230" x2="590" y2="230" />
                  <text x="540" y="233" fill="#64748b" fontSize="8">
                    -300m
                  </text>
                  <line x1="580" y1="300" x2="590" y2="300" />
                  <text x="540" y="303" fill="#64748b" fontSize="8">
                    -435m
                  </text>
                </g>
              </svg>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Click any borehole collar on the cross-section to inspect core assays</span>
            <span className="text-amber-400 font-medium">Selected: {selectedBorehole.holeId || 'BH-BG-104'}</span>
          </div>
        </div>

        {/* Selected Core Assay Inspector (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Drill className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Diamond Drill Core Assay</h3>
              </div>
              <span className="text-xs bg-amber-500/10 text-amber-400 font-mono font-bold px-2 py-0.5 rounded border border-amber-500/30">
                {selectedBorehole.holeId}
              </span>
            </div>

            {/* Core Specs Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Interception Depth</span>
                <span className="text-white font-bold font-mono">
                  {selectedBorehole.depthFrom}m – {selectedBorehole.depthTo}m
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Seam True Thickness</span>
                <span className="text-emerald-400 font-bold font-mono">{selectedBorehole.thicknessMeters} meters</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Core Recovery</span>
                <span className="text-white font-bold font-mono">{selectedBorehole.coreRecoveryPct}%</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Mineral Confidence</span>
                <span className="text-cyan-400 font-bold font-mono">{selectedBorehole.mineralizationConfidence}%</span>
              </div>
            </div>

            {/* Chemical Assays Progress Bars */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-300 block mb-1">Core Chemical Assay Breakdown</span>

              {/* Manganese Grade */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">Manganese Content (Mn %)</span>
                  <span className="text-amber-400 font-bold font-mono">{selectedBorehole.mnGradePct}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: `${selectedBorehole.mnGradePct * 1.5}%` }}></div>
                </div>
              </div>

              {/* Iron Content */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">Iron Content (Fe %)</span>
                  <span className="text-cyan-400 font-bold font-mono">{selectedBorehole.feGradePct}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${selectedBorehole.feGradePct * 5}%` }}></div>
                </div>
              </div>

              {/* Silica */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">Silica Content (SiO2 %)</span>
                  <span className="text-slate-300 font-bold font-mono">{selectedBorehole.sio2Pct}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-slate-500 h-full rounded-full" style={{ width: `${selectedBorehole.sio2Pct * 3}%` }}></div>
                </div>
              </div>

              {/* Phosphorus Penalty */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">Phosphorus Penalty (P %)</span>
                  <span className={`font-bold font-mono ${selectedBorehole.pPct > 0.15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedBorehole.pPct}% {selectedBorehole.pPct < 0.1 ? '(Low P Grade)' : '(Standard)'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${selectedBorehole.pPct > 0.15 ? 'bg-rose-400' : 'bg-emerald-400'}`}
                    style={{ width: `${selectedBorehole.pPct * 300}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Lithology: <strong className="text-slate-200">{selectedBorehole.lithology}</strong></span>
          </div>
        </div>
      </div>

      {/* Geophysical ERT & IP Chargeability Profile Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-white">Geophysical Signature: ERT Resistivity vs IP Chargeability</h3>
            </div>
            <p className="text-xs text-slate-400">
              Low electrical resistivity (&lt;15 Ohm-m) paired with high chargeability (&gt;50 mV/V) marks pyrolusite & braunite conductors
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <span className="flex items-center space-x-1">
              <span className="w-3 h-0.5 bg-amber-400 inline-block"></span>
              <span>Mn Grade %</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-0.5 bg-rose-400 inline-block"></span>
              <span>ERT Resistivity (Ohm-m)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block"></span>
              <span>IP Chargeability (mV/V)</span>
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={geophysicsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Bar dataKey="mnGrade" name="Mn Grade (%)" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ertResistivity" name="ERT Resistivity (Ohm-m)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ipChargeability" name="IP Chargeability (mV/V)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
