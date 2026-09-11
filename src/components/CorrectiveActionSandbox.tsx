import React, { useState } from 'react';
import {
  Cpu,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Clock,
  DollarSign,
  Truck,
  Droplets,
  Zap,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { MineLocation, CorrectiveActionItem } from '../types';
import { INITIAL_CORRECTIVE_ACTIONS } from '../data/moilData';

interface CorrectiveActionSandboxProps {
  selectedMine: MineLocation;
  onApplyAction: (actionId: string) => void;
  actions: CorrectiveActionItem[];
}

export const CorrectiveActionSandbox: React.FC<CorrectiveActionSandboxProps> = ({
  selectedMine,
  onApplyAction,
  actions,
}) => {
  // Interactive scenario simulation parameters
  const [rainfallMm, setRainfallMm] = useState<number>(35);
  const [fleetAvailPct, setFleetAvailPct] = useState<number>(75);
  const [blastingHours, setBlastingHours] = useState<number>(4);
  const [standbyHemmCount, setStandbyHemmCount] = useState<number>(2);
  const [dewateringM3h, setDewateringM3h] = useState<number>(500);

  // Custom AI scenario prompt state
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isSimulatingAi, setIsSimulatingAi] = useState<boolean>(false);
  const [customAiScenarioResult, setCustomAiScenarioResult] = useState<string | null>(null);

  // Dynamic simulation calculations
  // Baseline planned daily
  const dailyTarget = 1500;
  // Weather penalty
  const weatherPenalty = rainfallMm > 20 ? Math.round((rainfallMm - 20) * 8.5) : 0;
  // Fleet availability penalty
  const fleetPenalty = fleetAvailPct < 85 ? Math.round((85 - fleetAvailPct) * 18.2) : 0;
  // Blasting penalty
  const blastingPenalty = blastingHours * 35;
  // Raw shortfall before mitigation
  const rawDailyDeficit = Math.max(0, weatherPenalty + fleetPenalty + blastingPenalty);

  // Mitigations applied
  const standbyGain = standbyHemmCount * 85;
  const dewateringGain = Math.round(dewateringM3h * 0.28);
  const appliedActionsGain = actions
    .filter((a) => a.status === 'Applied')
    .reduce((sum, a) => sum + Math.round(a.impactRecoveryMt / 30), 0);

  const totalRecoveryDaily = standbyGain + dewateringGain + appliedActionsGain;
  const netDailyShortfall = Math.max(0, rawDailyDeficit - totalRecoveryDaily);
  const simulatedDailyOutput = Math.min(dailyTarget + 100, Math.max(600, dailyTarget - netDailyShortfall));

  const handleRunAiScenario = async () => {
    if (!customPrompt.trim()) return;
    setIsSimulatingAi(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Simulate this scenario for ${selectedMine.name}: "${customPrompt}". Give a concise 3-point tactical mitigation plan with projected tonnage recovery and equipment dispatch sequence.`,
          context: {
            mineName: selectedMine.name,
            rainfallMm,
            fleetAvailPct,
            blastingHours,
            standbyHemmCount,
          },
        }),
      });
      const data = await res.json();
      setCustomAiScenarioResult(data.reply || 'Scenario analyzed successfully.');
    } catch (err) {
      setCustomAiScenarioResult(
        `Simulation Protocol for ${selectedMine.name}: 1. Reroute empty haulers through Bench 2 ramp. 2. Activate auxiliary dewatering pump cluster. 3. Priority blend 46% Mn braunite from Stope 4 to buffer tonnage shortfall.`
      );
    } finally {
      setIsSimulatingAi(false);
    }
  };

  const handleResetDefaults = () => {
    setRainfallMm(35);
    setFleetAvailPct(75);
    setBlastingHours(4);
    setStandbyHemmCount(2);
    setDewateringM3h(500);
    setCustomAiScenarioResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Corrective Action Simulation Sandbox</h2>
          </div>
          <p className="text-xs text-slate-400">
            Simulate operational constraints and deploy real-time mitigations to overcome production shortfalls
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetDefaults}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* Simulation Engine (Sliders + Real-time Outcome) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Panel (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">What-If Environmental & Operational Parameters</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Live Simulation Active</span>
          </div>

          {/* Slider 1: Rainfall */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>24-Hour Precipitation (Rainfall Radar)</span>
              </span>
              <span className="font-mono font-bold text-cyan-400">{rainfallMm} mm</span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              value={rainfallMm}
              onChange={(e) => setRainfallMm(Number(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0mm (Clear)</span>
              <span>40mm (Heavy Slush)</span>
              <span>120mm (Severe Pit Inundation)</span>
            </div>
          </div>

          {/* Slider 2: Fleet Availability */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                <span>HEMM Fleet Availability</span>
              </span>
              <span className="font-mono font-bold text-amber-400">{fleetAvailPct}%</span>
            </div>
            <input
              type="range"
              min="40"
              max="100"
              value={fleetAvailPct}
              onChange={(e) => setFleetAvailPct(Number(e.target.value))}
              className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>40% (Multiple Breakdowns)</span>
              <span>85% (Target Minimum)</span>
              <span>100% (Full Capacity)</span>
            </div>
          </div>

          {/* Slider 3: Blasting Downtime */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Blasting Window Restrictions & Delays</span>
              </span>
              <span className="font-mono font-bold text-purple-400">{blastingHours} hrs</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              value={blastingHours}
              onChange={(e) => setBlastingHours(Number(e.target.value))}
              className="w-full accent-purple-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0 hrs (No Delay)</span>
              <span>6 hrs (Vibration Limit Alert)</span>
              <span>12 hrs (Severe Restriction)</span>
            </div>
          </div>

          {/* Controls: Standby HEMM & Dewatering Surge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Standby Articulated Dumpers Deployed:
              </label>
              <div className="flex items-center space-x-2">
                {[0, 1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setStandbyHemmCount(num)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                      standbyHemmCount === num
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Auxiliary Dewatering Pump Rate:
              </label>
              <select
                value={dewateringM3h}
                onChange={(e) => setDewateringM3h(Number(e.target.value))}
                className="w-full bg-slate-950 text-xs text-cyan-300 font-mono border border-slate-800 rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value={0}>0 m³/hr (Standard Sump)</option>
                <option value={300}>300 m³/hr (+1 Pump)</option>
                <option value={500}>500 m³/hr (+2 High-Head Pumps)</option>
                <option value={900}>900 m³/hr (Maximum Surge Dewatering)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Real-time Projected Outcome Card (5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Simulated Production Impact</h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  netDailyShortfall === 0
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {netDailyShortfall === 0 ? 'SHORTFALL NEUTRALIZED' : 'SHORTFALL PROJECTED'}
              </span>
            </div>

            {/* Daily Tonnage Metric */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-slate-400">Simulated Daily Extraction:</span>
                <span className="text-2xl font-bold font-mono text-white">
                  {simulatedDailyOutput.toLocaleString()} MT / day
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden my-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    simulatedDailyOutput >= dailyTarget ? 'bg-emerald-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, (simulatedDailyOutput / dailyTarget) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500">Target: {dailyTarget} MT</span>
                <span className={netDailyShortfall > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  {netDailyShortfall > 0 ? `-${netDailyShortfall} MT / day deficit` : 'Target Achieved'}
                </span>
              </div>
            </div>

            {/* Mathematical Loss vs Mitigation Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Gross Discrepancy Impact:</span>
                <span className="text-rose-400 font-mono font-semibold">-{rawDailyDeficit} MT / day</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Mitigations & Deployed Buffers:</span>
                <span className="text-emerald-400 font-mono font-semibold">+{totalRecoveryDaily} MT / day</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800/80 pt-2 font-semibold">
                <span className="text-slate-300">Net 30-Day Extrapolated Deficit:</span>
                <span className={netDailyShortfall > 0 ? 'text-rose-400 font-mono' : 'text-emerald-400 font-mono'}>
                  {netDailyShortfall > 0 ? `-${(netDailyShortfall * 30).toLocaleString()} MT` : '0 MT'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-2">
              Apply corrective actions below to close remaining shortfall deficit:
            </span>
          </div>
        </div>
      </div>

      {/* Corrective Action Playbook List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Recommended MOIL Operational Corrective Actions</h3>
            <p className="text-xs text-slate-400">
              Validated mitigation protocols to restore supply continuity and avoid production deficits
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
            {actions.filter((a) => a.status === 'Applied').length} of {actions.length} Applied
          </span>
        </div>

        <div className="space-y-3">
          {actions.map((act) => {
            const isApplied = act.status === 'Applied';
            return (
              <div
                key={act.id}
                className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isApplied
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-white text-sm">{act.title}</span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {act.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        act.priority === 'Immediate'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {act.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">{act.description}</p>
                  <div className="flex items-center space-x-4 text-[11px] text-slate-400 pt-1">
                    <span>
                      Execution Time: <strong className="text-slate-200">{act.executionTimeHours} hrs</strong>
                    </span>
                    <span>
                      Cost Tier: <strong className="text-slate-200">{act.estimatedCostTier}</strong>
                    </span>
                    <span>
                      Impact Recovery: <strong className="text-emerald-400">+{act.impactRecoveryMt.toLocaleString()} MT</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    id={`btn-apply-action-${act.id}`}
                    onClick={() => onApplyAction(act.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                      isApplied
                        ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active in Dispatch</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-amber-400" />
                        <span>Deploy Action</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI What-If Custom Scenario Generator */}
      <div className="bg-gradient-to-r from-purple-950/30 via-slate-900 to-slate-900 border border-purple-500/30 rounded-2xl p-5 shadow-md">
        <div className="flex items-center space-x-2 mb-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Custom Scenario Simulation (Gemini AI Powered)</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Type an unexpected mining event (e.g. "Main hoist gearbox failure at Level 5 during heavy rainfall") to generate an optimized response order
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. Inflow in Balaghat shaft exceeds 1200 LPM and primary crusher jam..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRunAiScenario();
            }}
          />
          <button
            onClick={handleRunAiScenario}
            disabled={isSimulatingAi || !customPrompt.trim()}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-md shadow-purple-950/40 shrink-0 disabled:opacity-50"
          >
            {isSimulatingAi ? 'Simulating...' : 'Simulate Strategy'}
          </button>
        </div>

        {customAiScenarioResult && (
          <div className="mt-4 bg-slate-950 p-4 rounded-xl border border-purple-800/40 text-xs text-slate-200 leading-relaxed">
            <span className="font-bold text-purple-300 block mb-1">AI Tactical Simulation Response:</span>
            <p>{customAiScenarioResult}</p>
          </div>
        )}
      </div>
    </div>
  );
};
