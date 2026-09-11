import React from 'react';
import {
  TrendingDown,
  AlertTriangle,
  Truck,
  CloudRain,
  Flame,
  Clock,
  Sparkles,
  CheckCircle,
  ArrowRight,
  ShieldAlert,
  Wrench,
  Percent
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { MineLocation, EquipmentFleetItem } from '../types';
import { MINE_EQUIPMENT, MINE_SATELLITE_DATA } from '../data/moilData';

interface ShortfallForecasterProps {
  selectedMine: MineLocation;
  onTriggerShortfallAi: () => void;
  isAiPredicting: boolean;
  aiShortfallResult: any;
  onNavigateToSandbox: () => void;
}

export const ShortfallForecaster: React.FC<ShortfallForecasterProps> = ({
  selectedMine,
  onTriggerShortfallAi,
  isAiPredicting,
  aiShortfallResult,
  onNavigateToSandbox,
}) => {
  const equipmentFleet: EquipmentFleetItem[] =
    MINE_EQUIPMENT[selectedMine.id] || MINE_EQUIPMENT['balaghat'] || [];
  const satelliteData = MINE_SATELLITE_DATA[selectedMine.id] || MINE_SATELLITE_DATA['balaghat'];

  const deficitMt = Math.max(0, selectedMine.monthlyPlannedTargetMt - selectedMine.currentActualMt);

  // Root cause distribution pie chart data
  const rootCausesData = [
    { name: 'Weather / Haul Road Slush', value: satelliteData.rainfallMm24h > 40 ? 42 : 24, color: '#06b6d4' },
    { name: 'HEMM Equipment Downtime', value: 36, color: '#f43f5e' },
    { name: 'Blasting Schedule Delays', value: 14, color: '#fbbf24' },
    { name: 'Ore Grade Dilution', value: 8, color: '#a855f7' },
  ];

  // 30-Day predictive confidence envelope data (P10, P50, P90)
  const forecastEnvelopeData = [
    { day: 'Day 1', target: 1500, p90Best: 1540, p50Expected: 1470, p10Worst: 1390 },
    { day: 'Day 5', target: 1500, p90Best: 1510, p50Expected: 1420, p10Worst: 1300 },
    { day: 'Day 10', target: 1500, p90Best: 1490, p50Expected: 1360, p10Worst: 1210 },
    { day: 'Day 15', target: 1500, p90Best: 1470, p50Expected: 1310, p10Worst: 1140 },
    { day: 'Day 20', target: 1500, p90Best: 1480, p50Expected: 1280, p10Worst: 1080 },
    { day: 'Day 25', target: 1500, p90Best: 1500, p50Expected: 1290, p10Worst: 1050 },
    { day: 'Day 30', target: 1500, p90Best: 1520, p50Expected: 1320, p10Worst: 1070 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-bold text-white">Production Shortfall & Discrepancy Forecasting</h2>
          </div>
          <p className="text-xs text-slate-400">
            Machine learning early warning system predicting mismatches between planned targets and actual pit extraction
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="btn-run-ai-shortfall"
            onClick={onTriggerShortfallAi}
            disabled={isAiPredicting}
            className="flex items-center space-x-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm shadow-rose-950/40 transition active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-rose-200" />
            <span>{isAiPredicting ? 'Forecasting with AI...' : 'Run Shortfall AI Diagnosis'}</span>
          </button>
        </div>
      </div>

      {/* AI Diagnosis Result Callout */}
      {aiShortfallResult && (
        <div className="bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-900 border border-rose-500/40 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-bold text-rose-300">
                Gemini AI Production Shortfall Analysis
              </h3>
            </div>
            <span className="text-xs font-mono bg-rose-950 text-rose-300 px-2.5 py-1 rounded-full border border-rose-800 font-bold">
              Risk: {aiShortfallResult.shortfallRiskLevel || 'HIGH'} ({aiShortfallResult.probabilityPercent || 82}%)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Primary Root Causes */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <h4 className="font-bold text-slate-200 mb-2 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Primary Operational Drivers:</span>
              </h4>
              <ul className="space-y-1.5 text-slate-300">
                {aiShortfallResult.primaryDrivers?.map((driver: string, i: number) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{driver}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Recommended Mitigations */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-200 mb-2 flex items-center space-x-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Immediate Corrective Actions:</span>
                </h4>
                <ul className="space-y-1.5 text-slate-300">
                  {aiShortfallResult.correctiveActions?.map((act: string, i: number) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold">&rarr;</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Projected Recovery:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  +{aiShortfallResult.projectedRecoveryMt?.toLocaleString()} MT
                </span>
                <button
                  onClick={onNavigateToSandbox}
                  className="text-purple-400 hover:text-purple-300 font-bold flex items-center space-x-1"
                >
                  <span>Simulate in Sandbox</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discrepancy Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block mb-1">Month-to-Date Discrepancy</span>
          <div className="text-2xl font-bold text-rose-400 font-mono">-{deficitMt.toLocaleString()} MT</div>
          <span className="text-[11px] text-slate-400">Actual vs Planned baseline</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block mb-1">Rainfall Delay Impact</span>
          <div className="text-2xl font-bold text-cyan-400 font-mono">
            {satelliteData.rainfallMm24h > 40 ? 'High (74mm)' : 'Nominal'}
          </div>
          <span className="text-[11px] text-slate-400">Sump ponding in Pit Level 4</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block mb-1">Fleet Availability Rate</span>
          <div className="text-2xl font-bold text-amber-400 font-mono">74.2%</div>
          <span className="text-[11px] text-slate-400">Benchmark target: &ge;85.0%</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block mb-1">Blasting Delays (MTD)</span>
          <div className="text-2xl font-bold text-purple-400 font-mono">18.5 hrs</div>
          <span className="text-[11px] text-slate-400">Due to seismic vibration alerts</span>
        </div>
      </div>

      {/* 30-Day Forecast Confidence Chart & Root Cause Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forecast Confidence Fan Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">30-Day Predictive Extraction Envelope (P90 / P50 / P10)</h3>
              <p className="text-xs text-slate-400">Probabilistic machine learning forecast under current weather & fleet conditions</p>
            </div>
            <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
              Daily Target: 1,500 MT
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastEnvelopeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[800, 1700]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const orderMap: Record<string, number> = { p90Best: 1, p50Expected: 2, p10Worst: 3 };
                      const sortedPayload = [...payload].sort(
                        (a, b) => (orderMap[a.dataKey as string] || 99) - (orderMap[b.dataKey as string] || 99)
                      );
                      return (
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs shadow-xl space-y-1.5 font-sans">
                          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1">{label}</p>
                          {sortedPayload.map((entry: any) => (
                            <div key={entry.dataKey} className="flex items-center justify-between space-x-4">
                              <span style={{ color: entry.color }} className="font-semibold">
                                {entry.name} :
                              </span>
                              <span className="font-mono font-bold" style={{ color: entry.color }}>
                                {entry.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Area type="monotone" dataKey="p90Best" name="P90 Best Case (MT)" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                <Area type="monotone" dataKey="p50Expected" name="P50 Expected (MT)" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.2} />
                <Area type="monotone" dataKey="p10Worst" name="P10 Worst Case (MT)" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Root Cause Distribution Pie Chart (1 Col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Discrepancy Attribution</h3>
            <p className="text-xs text-slate-400 mb-3">AI decomposition of shortfall contributors</p>

            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rootCausesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {rootCausesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 text-xs">
              {rootCausesData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="truncate max-w-[150px]">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Heavy Earth Moving Machinery (HEMM) Fleet Telematics Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">HEMM Heavy Mining Fleet Telematics</h3>
            <p className="text-xs text-slate-400">
              Live status, MTBF, availability, and alerts for excavators, dumpers, winders, and dewatering units
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">{equipmentFleet.length} units deployed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Unit Code</th>
                <th className="pb-3 font-semibold">Equipment Type</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Availability</th>
                <th className="pb-3 font-semibold">Utilization</th>
                <th className="pb-3 font-semibold">MTBF</th>
                <th className="pb-3 font-semibold">Power / Fuel</th>
                <th className="pb-3 font-semibold">Operational Telemetry Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {equipmentFleet.map((eq) => (
                <tr key={eq.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 font-bold font-mono text-white">{eq.unitCode}</td>
                  <td className="py-3 text-slate-300">{eq.type}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        eq.status === 'Operational'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : eq.status === 'Sub-optimal'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {eq.status}
                    </span>
                  </td>
                  <td className="py-3 font-mono font-semibold">
                    <span className={eq.availabilityPct < 75 ? 'text-rose-400' : 'text-emerald-400'}>
                      {eq.availabilityPct}%
                    </span>
                  </td>
                  <td className="py-3 font-mono">{eq.utilizationPct}%</td>
                  <td className="py-3 font-mono">{eq.mtbfHours} hrs</td>
                  <td className="py-3 text-slate-400">{eq.fuelOrPowerDraw}</td>
                  <td className="py-3 text-slate-400 max-w-xs truncate">
                    {eq.alertNote || <span className="text-slate-600">Nominal telemetry</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
