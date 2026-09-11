import React from 'react';
import {
  TrendingDown,
  Layers,
  AlertTriangle,
  CloudRain,
  CheckCircle2,
  Gauge,
  Sparkles,
  ArrowUpRight,
  Truck,
  Mountain,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { MineLocation, OperationalAlert } from '../types';
import { MOIL_MINES, MINE_SATELLITE_DATA, PRODUCTION_TRENDS } from '../data/moilData';

interface DashboardOverviewProps {
  selectedMine: MineLocation;
  onSelectMine: (mine: MineLocation) => void;
  onNavigateToTab: (tab: 'overview' | 'satellite' | 'subsurface' | 'shortfall' | 'sandbox') => void;
  alerts: OperationalAlert[];
  onDismissAlert: (id: string) => void;
  onTriggerAiReserveCheck: () => void;
  isAiAnalyzing: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  selectedMine,
  onSelectMine,
  onNavigateToTab,
  alerts,
  onDismissAlert,
  onTriggerAiReserveCheck,
  isAiAnalyzing,
}) => {
  const satelliteData = MINE_SATELLITE_DATA[selectedMine.id] || MINE_SATELLITE_DATA['balaghat'];
  const trendData = PRODUCTION_TRENDS[selectedMine.id] || PRODUCTION_TRENDS['balaghat'];

  const deficitMt = Math.max(0, selectedMine.monthlyPlannedTargetMt - selectedMine.currentActualMt);
  const completionPct = Math.round((selectedMine.currentActualMt / selectedMine.monthlyPlannedTargetMt) * 100);
  const reserveIncreasePct = (
    ((selectedMine.aiPredictedReserveMt - selectedMine.manualReserveMt) / selectedMine.manualReserveMt) *
    100
  ).toFixed(1);

  // Status badge styling
  const getStatusBadge = (status: MineLocation['status']) => {
    switch (status) {
      case 'Normal':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Shortfall Risk':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Critical Discrepancy':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Weather Watch':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Mine Identity */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-2xl font-bold text-white tracking-tight">{selectedMine.name}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${getStatusBadge(selectedMine.status)}`}>
                {selectedMine.status}
              </span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                {selectedMine.type} Mining
              </span>
            </div>
            <p className="text-sm text-slate-400">
              {selectedMine.district}, {selectedMine.state} • Stratigraphy: <span className="text-slate-300 font-medium">{selectedMine.hostFormation}</span> • Dip: <span className="text-slate-300 font-medium">{selectedMine.strikeAndDip}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-run-ai-geology"
              onClick={onTriggerAiReserveCheck}
              disabled={isAiAnalyzing}
              className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-amber-950/40 active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAiAnalyzing ? 'AI Model Running...' : 'Recalibrate AI Reserves'}</span>
            </button>
            <button
              id="btn-view-space-hub"
              onClick={() => onNavigateToTab('satellite')}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-700 transition"
            >
              <span>Space Sensors</span>
              <ArrowUpRight className="w-4 h-4 text-cyan-400" />
            </button>
            <button
              id="btn-view-sandbox"
              onClick={() => onNavigateToTab('sandbox')}
              className="flex items-center space-x-1.5 bg-purple-900/30 hover:bg-purple-900/50 text-purple-200 text-xs font-semibold px-3 py-2.5 rounded-xl border border-purple-700/50 transition"
            >
              <span>Mitigation Sandbox</span>
              <ChevronRight className="w-4 h-4 text-purple-300" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Reserves */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Manganese Reserves (UNFC)</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white tracking-tight">{selectedMine.aiPredictedReserveMt} MT</span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              +{reserveIncreasePct}% AI Gain
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex justify-between items-center border-t border-slate-800/80 pt-2">
            <span>Manual Survey: {selectedMine.manualReserveMt} MT</span>
            <span className="text-amber-400 font-medium">{selectedMine.averageGradeMnPct}% Mn Grade</span>
          </div>
        </div>

        {/* Card 2: Production vs Monthly Target */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Monthly Target vs Actual</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white tracking-tight">{selectedMine.currentActualMt.toLocaleString()} MT</span>
            <span className="text-xs text-slate-400">/ {selectedMine.monthlyPlannedTargetMt.toLocaleString()} MT</span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${completionPct < 75 ? 'bg-rose-500' : completionPct < 90 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, completionPct)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
              <span>{completionPct}% of Month Target</span>
              <span className="text-rose-400 font-medium">-{deficitMt.toLocaleString()} MT Shortfall</span>
            </div>
          </div>
        </div>

        {/* Card 3: Shortfall Risk Meter */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">AI Shortfall Risk Index</span>
            <Gauge className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-white tracking-tight">
              {deficitMt > 10000 ? 'HIGH' : deficitMt > 4000 ? 'MODERATE' : 'LOW'}
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
              84% Confidence
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 border-t border-slate-800/80 pt-2 flex justify-between">
            <span>Primary Driver:</span>
            <span className="text-slate-300 font-medium truncate max-w-[140px]">
              {satelliteData.rainfallMm24h > 40 ? 'Rain & Waterlogging' : 'HEMM Fleet Availability'}
            </span>
          </div>
        </div>

        {/* Card 4: Satellite & Space Weather */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Space & Weather Telemetry</span>
            <CloudRain className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white tracking-tight">{satelliteData.rainfallMm24h} mm</span>
            <span className="text-xs text-slate-400">24h Radar Rain</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 border-t border-slate-800/80 pt-2 flex justify-between">
            <span>Soil Moisture: {satelliteData.soilMoisturePct}%</span>
            <span className="text-cyan-400 font-medium">NDVI: {satelliteData.ndviScore}</span>
          </div>
        </div>
      </div>

      {/* Main Production Forecast Chart & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Trajectory Chart (2 Columns) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Daily Extraction vs Planned Target with AI Shortfall Projection</h2>
              <p className="text-xs text-slate-400">Comparing target baseline against actual daily extraction and AI mitigated path</p>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-400">
              <span className="flex items-center space-x-1">
                <span className="w-3 h-0.5 bg-amber-400 inline-block"></span>
                <span>Target Plan</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-3 h-0.5 bg-cyan-400 inline-block"></span>
                <span>Actual / AI Proj</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-3 h-0.5 bg-emerald-400 inline-block"></span>
                <span>Mitigated Path</span>
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[400, 1800]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="shortfallMt" name="Shortfall Deficit (MT)" fill="#f43f5e" fillOpacity={0.15} stroke="#f43f5e" />
                <Line type="monotone" dataKey="plannedMt" name="Planned Target (MT)" stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="actualMt" name="Actual / Projected (MT)" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 3, fill: '#38bdf8' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                AI Forecast predicts <span className="text-rose-400 font-semibold">{deficitMt.toLocaleString()} MT shortfall</span> by month end without dispatch schedule re-alignment.
              </span>
            </div>
            <button
              id="btn-goto-shortfall"
              onClick={() => onNavigateToTab('shortfall')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1 shrink-0 ml-2"
            >
              <span>Explore Root Causes</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Operational Alerts Feed */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Live Discrepancy & Alert Feed</h3>
              </div>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                {alerts.filter((a) => !a.resolved).length} active
              </span>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No active alerts recorded.</p>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-xl border text-xs transition ${
                      alert.resolved
                        ? 'bg-slate-950/40 border-slate-800/40 opacity-50'
                        : alert.severity === 'critical'
                        ? 'bg-rose-950/20 border-rose-800/40 text-slate-200'
                        : alert.severity === 'warning'
                        ? 'bg-amber-950/20 border-amber-800/40 text-slate-200'
                        : 'bg-cyan-950/20 border-cyan-800/40 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1.5 font-semibold">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            alert.severity === 'critical'
                              ? 'bg-rose-400'
                              : alert.severity === 'warning'
                              ? 'bg-amber-400'
                              : 'bg-cyan-400'
                          }`}
                        ></span>
                        <span className="text-white">{alert.mineName}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({alert.category})</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{alert.timestamp}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">{alert.message}</p>
                    <div className="mt-2 flex justify-end">
                      {!alert.resolved && (
                        <button
                          onClick={() => onDismissAlert(alert.id)}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Acknowledged</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Automated sensor refresh: 300s</span>
            <button
              onClick={() => onNavigateToTab('sandbox')}
              className="text-purple-400 hover:text-purple-300 font-semibold"
            >
              Test Solutions in Sandbox &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* MOIL Mines Portfolio Quick Overview */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">MOIL Key Mining Operations Portfolio</h3>
            <p className="text-xs text-slate-400">Comparing reserve capacity, extraction status, and manganese grade across India</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">6 Core Leases Monitored</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {MOIL_MINES.map((mine) => (
            <div
              key={mine.id}
              onClick={() => onSelectMine(mine)}
              className={`p-3.5 rounded-xl border cursor-pointer transition ${
                selectedMine.id === mine.id
                  ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white text-sm">{mine.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getStatusBadge(mine.status)}`}>
                  {mine.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-800/80 pt-2 text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-400 block">AI Reserve</span>
                  <span className="font-semibold text-amber-400">{mine.aiPredictedReserveMt} MT</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Target / Mo</span>
                  <span className="font-semibold">{mine.monthlyPlannedTargetMt / 1000}k MT</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Avg Grade</span>
                  <span className="font-semibold text-emerald-400">{mine.averageGradeMnPct}% Mn</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
