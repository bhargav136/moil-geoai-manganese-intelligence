import React from 'react';
import {
  Pickaxe,
  Satellite,
  Layers,
  TrendingDown,
  Cpu,
  Bot,
  FileText,
  Radio,
  MapPin,
  Sparkles,
  Key
} from 'lucide-react';
import { MOIL_MINES } from '../data/moilData';
import { MineLocation } from '../types';

interface NavbarProps {
  selectedMine: MineLocation;
  onSelectMine: (mine: MineLocation) => void;
  activeTab: 'overview' | 'satellite' | 'subsurface' | 'shortfall' | 'sandbox';
  setActiveTab: (tab: 'overview' | 'satellite' | 'subsurface' | 'shortfall' | 'sandbox') => void;
  onOpenAiAssistant: () => void;
  onOpenReportModal: () => void;
  onOpenApiKeyModal: () => void;
  hasCustomKey?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedMine,
  onSelectMine,
  activeTab,
  setActiveTab,
  onOpenAiAssistant,
  onOpenReportModal,
  onOpenApiKeyModal,
  hasCustomKey,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Pickaxe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-tight text-white text-lg">MOIL GeoAI</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Space & AI Mining Core
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Manganese Ore India Ltd • Reserve & Production Intelligence
              </p>
            </div>
          </div>

          {/* Mine Selector & Telemetry Status */}
          <div className="flex items-center space-x-3">
            {/* Live Space Telemetry Pill */}
            <div className="hidden lg:flex items-center space-x-2 text-xs bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-slate-400">ISRO / Sentinel-2 Feed:</span>
              <span className="text-emerald-400 font-medium">Active (10:42 IST)</span>
            </div>

            {/* Mine Switcher */}
            <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <select
                id="mine-selector"
                value={selectedMine.id}
                onChange={(e) => {
                  const found = MOIL_MINES.find((m) => m.id === e.target.value);
                  if (found) onSelectMine(found);
                }}
                className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer pr-1"
              >
                {MOIL_MINES.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-slate-100">
                    {m.name} ({m.type} • {m.state})
                  </option>
                ))}
              </select>
            </div>

            {/* API Key Config Button */}
            <button
              id="btn-open-api-key"
              onClick={onOpenApiKeyModal}
              className="flex items-center space-x-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold px-2.5 py-2 rounded-lg border border-slate-800 transition active:scale-95"
              title="Configure Gemini API Key"
            >
              <Key className={`w-3.5 h-3.5 ${hasCustomKey ? 'text-amber-400' : 'text-emerald-400'}`} />
              <span className="hidden xl:inline font-mono text-[11px]">
                {hasCustomKey ? 'Custom Key' : 'Gemini 3.6'}
              </span>
            </button>

            {/* AI Assistant Button */}
            <button
              id="btn-open-ai-chat"
              onClick={onOpenAiAssistant}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm shadow-cyan-900/30 transition active:scale-95"
            >
              <Bot className="w-4 h-4 text-cyan-200" />
              <span className="hidden sm:inline">GeoAI Assistant</span>
              <Sparkles className="w-3 h-3 text-cyan-200" />
            </button>

            {/* Report Export Button */}
            <button
              id="btn-open-report"
              onClick={onOpenReportModal}
              className="hidden md:flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 transition active:scale-95"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Shift Report</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-2 py-2 overflow-x-auto scrollbar-none border-t border-slate-800/60">
          <button
            id="tab-overview"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Pickaxe className="w-3.5 h-3.5" />
            <span>Overview & Risk KPIs</span>
          </button>

          <button
            id="tab-satellite"
            onClick={() => setActiveTab('satellite')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'satellite'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Space & Satellite Hub</span>
          </button>

          <button
            id="tab-subsurface"
            onClick={() => setActiveTab('subsurface')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'subsurface'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Subsurface Geology & Reserves</span>
          </button>

          <button
            id="tab-shortfall"
            onClick={() => setActiveTab('shortfall')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'shortfall'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Production Shortfall Predictor</span>
          </button>

          <button
            id="tab-sandbox"
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'sandbox'
                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Corrective Action Sandbox</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
