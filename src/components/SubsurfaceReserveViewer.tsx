import React, { useState, useRef } from 'react';
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
  Database,
  Sliders,
  Eye,
  Crosshair,
  Compass,
  Info
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
} from 'recharts';
import { MineLocation, BoreholeCore } from '../types';
import { MINE_BOREHOLES } from '../data/moilData';

interface SubsurfaceReserveViewerProps {
  selectedMine: MineLocation;
  onTriggerAiReserveCheck: () => void;
  isAiAnalyzing: boolean;
  aiReserveResult: any;
}

interface FormationDetail {
  name: string;
  code: string;
  lithology: string;
  depthRange: string;
  density: string;
  rmr: string;
  gradeMn: string;
  description: string;
  color: string;
}

export const SubsurfaceReserveViewer: React.FC<SubsurfaceReserveViewerProps> = ({
  selectedMine,
  onTriggerAiReserveCheck,
  isAiAnalyzing,
  aiReserveResult,
}) => {
  const boreholes: BoreholeCore[] = MINE_BOREHOLES[selectedMine.id] || MINE_BOREHOLES['balaghat'] || [];
  const [selectedBorehole, setSelectedBorehole] = useState<BoreholeCore>(boreholes[0] || {} as BoreholeCore);

  // Interactive controls state
  const [seamDipAngle, setSeamDipAngle] = useState<number>(65);
  const [faultOffset, setFaultOffset] = useState<number>(14);
  const [activeOverlay, setActiveOverlay] = useState<'stratigraphy' | 'ert' | 'grade'>('stratigraphy');
  const [hoveredFormation, setHoveredFormation] = useState<FormationDetail | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; gridX: number; depthRl: number } | null>(null);
  
  // Layer visibility state
  const [layerVisibility, setLayerVisibility] = useState({
    overburden: true,
    hangingWall: true,
    mnSeam: true,
    gondite: true,
    footwall: true,
    drillholes: true,
    faultLines: true,
  });

  const toggleLayer = (key: keyof typeof layerVisibility) => {
    setLayerVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Formation details data for interactive inspection
  const formationDetails: Record<string, FormationDetail> = {
    overburden: {
      name: 'Weathered Overburden / Soil',
      code: 'SOIL-WB',
      lithology: 'Alluvium & Lateritic Soil',
      depthRange: '0m to 35m',
      density: '1.95 t/m³',
      rmr: '32 (Poor)',
      gradeMn: '< 2.5% Mn',
      description: 'Unconsolidated surface overburden requiring gentle bench slope geometry (45° max).',
      color: '#d97706',
    },
    hangingWall: {
      name: 'Munsar Formation (Mica-Schist)',
      code: 'MS-HW',
      lithology: 'Muscovite-Biotite Quartz Schist',
      depthRange: '35m to 145m',
      density: '2.72 t/m³',
      rmr: '64 (Good)',
      gradeMn: '3.0% – 6.5% Mn',
      description: 'Hanging wall host series of Sausar Group. Displays minor chlorite alterations near ore contact.',
      color: '#94a3b8',
    },
    mnSeam: {
      name: 'Primary Manganese Ore Seam',
      code: 'MN-ORE-01',
      lithology: 'Braunite, Pyrolusite & Psilomelane Massive Ore',
      depthRange: '135m to 310m',
      density: '4.35 t/m³',
      rmr: '78 (Very Good)',
      gradeMn: `${selectedMine.averageGradeMnPct}% Mn`,
      description: 'High-grade syngenetic sedimentary manganese bed. High electrical conductivity (<12 Ohm-m).',
      color: '#c084fc',
    },
    gondite: {
      name: 'Gondite Horizon',
      code: 'GND-SEAM',
      lithology: 'Spessartine-Rhodonite Manganese Silicate Rock',
      depthRange: '280m to 330m',
      density: '3.60 t/m³',
      rmr: '71 (Good)',
      gradeMn: '18% – 26% Mn',
      description: 'Metamorphosed manganiferous silicate horizon forming secondary lower lens boundary.',
      color: '#a855f7',
    },
    footwall: {
      name: 'Sitasaongi Quartzite / Tirodi Gneiss',
      code: 'QTZ-FW',
      lithology: 'Microcline Quartzite & Biotite Gneiss',
      depthRange: '> 310m',
      density: '2.85 t/m³',
      rmr: '85 (Excellent)',
      gradeMn: '< 0.5% Mn',
      description: 'Competent metamorphic footwall providing excellent footing stability for underground haulage stopes.',
      color: '#64748b',
    },
  };

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

  // Dynamic geometry calculations based on Dip Angle & Fault Offset
  const dipRad = (seamDipAngle * Math.PI) / 180;
  const dipSlope = Math.tan(dipRad);

  // Calculate SVG seam path dynamically
  const startX = 120;
  const startY = 135;
  const lengthX = 400;
  const endYNormal = startY + lengthX * 0.4 * (dipSlope / 2.14); // normalized dip

  // Fault line split at X=340
  const faultX = 340;
  const seamYAtFault = startY + (faultX - startX) * 0.4 * (dipSlope / 2.14);
  const offsetPx = faultOffset * 1.8;

  // SVG Mouse position handler for interactive crosshair depth reader
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert canvas coordinates (600x320)
    const svgX = (x / rect.width) * 600;
    const svgY = (y / rect.height) * 320;
    
    const gridX = Math.round((svgX / 600) * 500); // 0 to 500m strike distance
    const depthRl = Math.round(340 - (svgY / 320) * 450); // RL +340m down to RL -110m

    setCursorPos({ x: svgX, y: svgY, gridX, depthRl });
  };

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

      {/* Interactive Toolbar for Cross-Section Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Dip Angle & Fault Controls */}
        <div className="flex flex-wrap items-center gap-5">
          {/* Dip Angle Slider */}
          <div className="flex items-center space-x-2.5">
            <Compass className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300 font-medium">Seam Dip Angle:</span>
            <input
              type="range"
              min="35"
              max="80"
              value={seamDipAngle}
              onChange={(e) => setSeamDipAngle(Number(e.target.value))}
              className="w-24 accent-amber-500 cursor-pointer"
            />
            <span className="font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {seamDipAngle}° S
            </span>
          </div>

          {/* Fault Offset Slider */}
          <div className="flex items-center space-x-2.5">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span className="text-slate-300 font-medium">Fault Downthrow:</span>
            <input
              type="range"
              min="0"
              max="30"
              value={faultOffset}
              onChange={(e) => setFaultOffset(Number(e.target.value))}
              className="w-24 accent-purple-500 cursor-pointer"
            />
            <span className="font-mono font-bold text-purple-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {faultOffset}m
            </span>
          </div>
        </div>

        {/* View Mode Mode Toggles */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 mr-1 flex items-center space-x-1">
            <Eye className="w-3.5 h-3.5" />
            <span>Overlay:</span>
          </span>
          <button
            onClick={() => setActiveOverlay('stratigraphy')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              activeOverlay === 'stratigraphy'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Stratigraphy
          </button>
          <button
            onClick={() => setActiveOverlay('ert')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              activeOverlay === 'ert'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            ERT Resistivity
          </button>
          <button
            onClick={() => setActiveOverlay('grade')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              activeOverlay === 'grade'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Grade Distribution
          </button>
        </div>
      </div>

      {/* Layer Toggle Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium mr-1">Toggle Layers:</span>
        <button
          onClick={() => toggleLayer('overburden')}
          className={`px-2.5 py-1 rounded-full border text-[11px] transition ${
            layerVisibility.overburden
              ? 'bg-amber-950/60 border-amber-700 text-amber-300'
              : 'bg-slate-950 border-slate-800 text-slate-600 line-through'
          }`}
        >
          Soil & Overburden
        </button>
        <button
          onClick={() => toggleLayer('hangingWall')}
          className={`px-2.5 py-1 rounded-full border text-[11px] transition ${
            layerVisibility.hangingWall
              ? 'bg-slate-800 border-slate-600 text-slate-200'
              : 'bg-slate-950 border-slate-800 text-slate-600 line-through'
          }`}
        >
          Hanging Wall Schist
        </button>
        <button
          onClick={() => toggleLayer('mnSeam')}
          className={`px-2.5 py-1 rounded-full border text-[11px] transition ${
            layerVisibility.mnSeam
              ? 'bg-purple-950/60 border-purple-500 text-purple-200 font-bold'
              : 'bg-slate-950 border-slate-800 text-slate-600 line-through'
          }`}
        >
          Mn Ore Seam ({selectedMine.averageGradeMnPct}% Mn)
        </button>
        <button
          onClick={() => toggleLayer('gondite')}
          className={`px-2.5 py-1 rounded-full border text-[11px] transition ${
            layerVisibility.gondite
              ? 'bg-purple-900/40 border-purple-700 text-purple-300'
              : 'bg-slate-950 border-slate-800 text-slate-600 line-through'
          }`}
        >
          Gondite Horizon
        </button>
        <button
          onClick={() => toggleLayer('footwall')}
          className={`px-2.5 py-1 rounded-full border text-[11px] transition ${
            layerVisibility.footwall
              ? 'bg-slate-900 border-slate-700 text-slate-300'
              : 'bg-slate-950 border-slate-800 text-slate-600 line-through'
          }`}
        >
          Footwall Quartzite
        </button>
        <button
          onClick={() => toggleLayer('drillholes')}
          className={`px-2.5 py-1 rounded-full border text-[11px] transition ${
            layerVisibility.drillholes
              ? 'bg-sky-950/60 border-sky-600 text-sky-300 font-semibold'
              : 'bg-slate-950 border-slate-800 text-slate-600 line-through'
          }`}
        >
          Drillholes ({boreholes.length})
        </button>
        <button
          onClick={() => toggleLayer('faultLines')}
          className={`px-2.5 py-1 rounded-full border text-[11px] transition ${
            layerVisibility.faultLines
              ? 'bg-rose-950/60 border-rose-600 text-rose-300 font-semibold'
              : 'bg-slate-950 border-slate-800 text-slate-600 line-through'
          }`}
        >
          Fault Line (Block 4-E)
        </button>
      </div>

      {/* Geological Cross Section & Core Drill Log Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 2D Interactive Stratigraphic Cross Section Canvas (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Geological Cross-Section & Ore Seam Geometry</span>
                  <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800 font-mono">
                    Interactive
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Strike: {selectedMine.strikeAndDip} • Dynamic Dip Angle: {seamDipAngle}° • Fault Displacement: {faultOffset}m
                </p>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded font-mono">
                Scale 1:2000
              </span>
            </div>

            {/* Interactive Cross Section SVG Canvas */}
            <div className="relative w-full h-80 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 select-none">
              <svg
                viewBox="0 0 600 320"
                className="w-full h-full cursor-crosshair"
                xmlns="http://www.w3.org/2000/svg"
                onMouseMove={handleSvgMouseMove}
                onMouseLeave={() => setCursorPos(null)}
              >
                <defs>
                  {/* ERT Resistivity Glow Gradient */}
                  <linearGradient id="ertResistivityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#7e22ce" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.7" />
                  </linearGradient>

                  {/* Grade Heatmap Gradient */}
                  <linearGradient id="gradeHeatmapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#a855f7" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0.85" />
                  </linearGradient>

                  {/* Fault line dash filter */}
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Grid Lines */}
                <g stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3">
                  <line x1="0" y1="85" x2="600" y2="85" />
                  <line x1="0" y1="160" x2="600" y2="160" />
                  <line x1="0" y1="235" x2="600" y2="235" />
                  <line x1="150" y1="0" x2="150" y2="320" />
                  <line x1="300" y1="0" x2="300" y2="320" />
                  <line x1="450" y1="0" x2="450" y2="320" />
                </g>

                {/* Surface line */}
                <path d="M 0,50 Q 150,45 300,55 T 600,48" stroke="#10b981" strokeWidth="2" fill="none" />
                <text x="10" y="42" fill="#6ee7b7" fontSize="10" fontWeight="bold">
                  Surface Topography (RL +340m)
                </text>

                {/* Overburden Layer */}
                {layerVisibility.overburden && (
                  <path
                    d="M 0,50 L 600,48 L 600,85 L 0,85 Z"
                    fill="#78350f"
                    fillOpacity="0.25"
                    className="transition-all hover:fill-opacity-40 cursor-pointer"
                    onMouseEnter={() => setHoveredFormation(formationDetails.overburden)}
                    onMouseLeave={() => setHoveredFormation(null)}
                  />
                )}
                {layerVisibility.overburden && (
                  <text x="20" y="75" fill="#d97706" fontSize="9" pointerEvents="none">
                    Weathered Overburden / Laterite
                  </text>
                )}

                {/* Hanging Wall: Munsar Mica-Schist */}
                {layerVisibility.hangingWall && (
                  <path
                    d={`M 0,85 L 600,85 L 600,${145 + offsetPx * 0.5} L 0,165 Z`}
                    fill="#334155"
                    fillOpacity="0.6"
                    className="transition-all hover:fill-opacity-75 cursor-pointer"
                    onMouseEnter={() => setHoveredFormation(formationDetails.hangingWall)}
                    onMouseLeave={() => setHoveredFormation(null)}
                  />
                )}
                {layerVisibility.hangingWall && (
                  <text x="30" y="125" fill="#cbd5e1" fontSize="10" fontWeight="500" pointerEvents="none">
                    Munsar Formation (Mica-Schist Hanging Wall)
                  </text>
                )}

                {/* Manganese Ore Seam (Dynamic Dip & Fault Offset) */}
                {layerVisibility.mnSeam && (
                  <g>
                    {/* Block A (Upthrown Side before Fault X=340) */}
                    <path
                      d={`M 120,135 L ${faultX},${seamYAtFault} L ${faultX},${seamYAtFault + 45} L 120,180 Z`}
                      fill={
                        activeOverlay === 'ert'
                          ? 'url(#ertResistivityGradient)'
                          : activeOverlay === 'grade'
                          ? 'url(#gradeHeatmapGradient)'
                          : '#7e22ce'
                      }
                      fillOpacity={activeOverlay === 'stratigraphy' ? 0.85 : 0.95}
                      stroke="#c084fc"
                      strokeWidth="2"
                      className="transition-all hover:brightness-125 cursor-pointer"
                      onMouseEnter={() => setHoveredFormation(formationDetails.mnSeam)}
                      onMouseLeave={() => setHoveredFormation(null)}
                    />

                    {/* Block B (Downthrown Side after Fault X=340 offset by faultOffset) */}
                    <path
                      d={`M ${faultX},${seamYAtFault + offsetPx} L 550,${endYNormal + offsetPx} L 550,${endYNormal + 45 + offsetPx} L ${faultX},${seamYAtFault + 45 + offsetPx} Z`}
                      fill={
                        activeOverlay === 'ert'
                          ? 'url(#ertResistivityGradient)'
                          : activeOverlay === 'grade'
                          ? 'url(#gradeHeatmapGradient)'
                          : '#7e22ce'
                      }
                      fillOpacity={activeOverlay === 'stratigraphy' ? 0.85 : 0.95}
                      stroke="#c084fc"
                      strokeWidth="2"
                      className="transition-all hover:brightness-125 cursor-pointer"
                      onMouseEnter={() => setHoveredFormation(formationDetails.mnSeam)}
                      onMouseLeave={() => setHoveredFormation(null)}
                    />

                    <text
                      x="160"
                      y={startY + 25}
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                      pointerEvents="none"
                    >
                      Manganese Ore Seam ({selectedMine.averageGradeMnPct}% Mn)
                    </text>
                  </g>
                )}

                {/* Gondite Horizon */}
                {layerVisibility.gondite && (
                  <path
                    d={`M ${faultX},${seamYAtFault + 45 + offsetPx} L 580,${endYNormal + 50 + offsetPx} L 580,${endYNormal + 75 + offsetPx} L ${faultX},${seamYAtFault + 65 + offsetPx} Z`}
                    fill="#a855f7"
                    fillOpacity="0.35"
                    stroke="#a855f7"
                    strokeDasharray="4 2"
                    className="transition-all hover:fill-opacity-60 cursor-pointer"
                    onMouseEnter={() => setHoveredFormation(formationDetails.gondite)}
                    onMouseLeave={() => setHoveredFormation(null)}
                  />
                )}
                {layerVisibility.gondite && (
                  <text x="430" y="240" fill="#e9d5ff" fontSize="9" pointerEvents="none">
                    Gondite Horizon
                  </text>
                )}

                {/* Footwall: Sitasaongi Quartzite */}
                {layerVisibility.footwall && (
                  <path
                    d={`M 0,165 L 120,180 L 600,310 L 0,320 Z`}
                    fill="#1e293b"
                    fillOpacity="0.9"
                    className="transition-all hover:fill-opacity-100 cursor-pointer"
                    onMouseEnter={() => setHoveredFormation(formationDetails.footwall)}
                    onMouseLeave={() => setHoveredFormation(null)}
                  />
                )}
                {layerVisibility.footwall && (
                  <text x="40" y="250" fill="#94a3b8" fontSize="10" fontWeight="500" pointerEvents="none">
                    Sitasaongi Quartzite (Competent Footwall)
                  </text>
                )}

                {/* Fault Line Indicator */}
                {layerVisibility.faultLines && (
                  <g filter="url(#glow)">
                    <line
                      x1={faultX}
                      y1="45"
                      x2={faultX + 20}
                      y2="310"
                      stroke="#f43f5e"
                      strokeWidth="2"
                      strokeDasharray="6 3"
                    />
                    <text x={faultX - 55} y="70" fill="#f43f5e" fontSize="9" fontWeight="bold">
                      Block 4-E Fault
                    </text>
                    <text x={faultX - 55} y="82" fill="#fb7185" fontSize="8">
                      ↓ {faultOffset}m Downthrow
                    </text>
                  </g>
                )}

                {/* Interactive Drillhole Trajectories */}
                {layerVisibility.drillholes &&
                  boreholes.map((bh, idx) => {
                    const startX = 90 + idx * 105;
                    const endX = startX + 65;
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
                          y2="285"
                          stroke={isSelected ? '#f59e0b' : '#38bdf8'}
                          strokeWidth={isSelected ? '3.5' : '1.8'}
                          strokeDasharray={isSelected ? 'none' : '4 2'}
                        />
                        <circle cx={startX} cy="50" r={isSelected ? '5' : '3.5'} fill="#f59e0b" />
                        <text
                          x={startX - 15}
                          y="36"
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
                  <text x="548" y="53" fill="#64748b" fontSize="8">
                    +340m
                  </text>
                  <line x1="580" y1="140" x2="590" y2="140" />
                  <text x="548" y="143" fill="#64748b" fontSize="8">
                    +180m
                  </text>
                  <line x1="580" y1="230" x2="590" y2="230" />
                  <text x="548" y="233" fill="#64748b" fontSize="8">
                    +20m
                  </text>
                  <line x1="580" y1="300" x2="590" y2="300" />
                  <text x="548" y="303" fill="#64748b" fontSize="8">
                    -110m
                  </text>
                </g>

                {/* Dynamic Crosshair Depth Tracker Cursor */}
                {cursorPos && (
                  <g pointerEvents="none">
                    <line
                      x1={cursorPos.x}
                      y1="0"
                      x2={cursorPos.x}
                      y2="320"
                      stroke="#38bdf8"
                      strokeWidth="0.8"
                      strokeDasharray="2 2"
                    />
                    <line
                      x1="0"
                      y1={cursorPos.y}
                      x2="600"
                      y2={cursorPos.y}
                      stroke="#38bdf8"
                      strokeWidth="0.8"
                      strokeDasharray="2 2"
                    />
                    <circle cx={cursorPos.x} cy={cursorPos.y} r="4" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                  </g>
                )}
              </svg>

              {/* Dynamic Coordinate Badge on Hover */}
              {cursorPos && (
                <div className="absolute top-2 right-2 bg-slate-950/90 border border-slate-700 text-white px-2.5 py-1 rounded-md text-[10px] font-mono shadow-md flex items-center space-x-2 pointer-events-none">
                  <span className="text-slate-400">Grid:</span>
                  <span className="text-amber-400 font-bold">East {cursorPos.gridX}m</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">RL Depth:</span>
                  <span className="text-emerald-400 font-bold">{cursorPos.depthRl}m</span>
                </div>
              )}
            </div>
          </div>

          {/* Hovered Geological Formation Popover Card */}
          {hoveredFormation ? (
            <div className="mt-3 bg-slate-900 border border-amber-500/40 rounded-xl p-3 text-xs space-y-1 transition-all shadow-lg animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 flex items-center space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>{hoveredFormation.name} ({hoveredFormation.code})</span>
                </span>
                <span className="font-mono text-[10px] text-slate-400">Lithology: {hoveredFormation.lithology}</span>
              </div>
              <p className="text-[11px] text-slate-300">{hoveredFormation.description}</p>
              <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-[10px]">
                <div><span className="text-slate-500 block">Density:</span> <span className="text-slate-200 font-bold">{hoveredFormation.density}</span></div>
                <div><span className="text-slate-500 block">Rock Rating:</span> <span className="text-slate-200 font-bold">{hoveredFormation.rmr}</span></div>
                <div><span className="text-slate-500 block">Mn Grade:</span> <span className="text-amber-400 font-bold">{hoveredFormation.gradeMn}</span></div>
                <div><span className="text-slate-500 block">Depth Interval:</span> <span className="text-slate-200 font-bold">{hoveredFormation.depthRange}</span></div>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
              <span>Click any drillhole collar to inspect core assays or hover over rock units for details</span>
              <span className="text-amber-400 font-medium">Selected: {selectedBorehole.holeId || 'BH-BG-104'}</span>
            </div>
          )}
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
                  <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${selectedBorehole.mnGradePct * 1.5}%` }}></div>
                </div>
              </div>

              {/* Iron Content */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">Iron Content (Fe %)</span>
                  <span className="text-cyan-400 font-bold font-mono">{selectedBorehole.feGradePct}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: `${selectedBorehole.feGradePct * 5}%` }}></div>
                </div>
              </div>

              {/* Silica */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">Silica Content (SiO2 %)</span>
                  <span className="text-slate-300 font-bold font-mono">{selectedBorehole.sio2Pct}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-slate-500 h-full rounded-full transition-all duration-500" style={{ width: `${selectedBorehole.sio2Pct * 3}%` }}></div>
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
                    className={`h-full rounded-full transition-all duration-500 ${selectedBorehole.pPct > 0.15 ? 'bg-rose-400' : 'bg-emerald-400'}`}
                    style={{ width: `${selectedBorehole.pPct * 300}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Lithology: <strong className="text-slate-200">{selectedBorehole.lithology}</strong></span>
            <span className="font-mono text-cyan-400">ERT: {selectedBorehole.ertResistivityOhmM} Ωm</span>
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
