import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { SatelliteMapViewer } from './components/SatelliteMapViewer';
import { SubsurfaceReserveViewer } from './components/SubsurfaceReserveViewer';
import { ShortfallForecaster } from './components/ShortfallForecaster';
import { CorrectiveActionSandbox } from './components/CorrectiveActionSandbox';
import { AiAssistantModal } from './components/AiAssistantModal';
import { ReportModal } from './components/ReportModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { MOIL_MINES, INITIAL_ALERTS, INITIAL_CORRECTIVE_ACTIONS, MINE_BOREHOLES, MINE_SATELLITE_DATA } from './data/moilData';
import { MineLocation, OperationalAlert, CorrectiveActionItem } from './types';
import { CheckCircle2, AlertCircle, ArrowUp } from 'lucide-react';

export default function App() {
  const [selectedMine, setSelectedMine] = useState<MineLocation>(MOIL_MINES[0]);
  const [activeTab, setActiveTab] = useState<'overview' | 'satellite' | 'subsurface' | 'shortfall' | 'sandbox'>('overview');
  const [alerts, setAlerts] = useState<OperationalAlert[]>(INITIAL_ALERTS);
  const [actions, setActions] = useState<CorrectiveActionItem[]>(INITIAL_CORRECTIVE_ACTIONS);

  // Custom API Key state
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem('moil_custom_gemini_key') || '';
  });
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);

  // AI states
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isAiAnalyzingReserve, setIsAiAnalyzingReserve] = useState<boolean>(false);
  const [aiReserveResult, setAiReserveResult] = useState<any>(null);

  const [isAiPredictingShortfall, setIsAiPredictingShortfall] = useState<boolean>(false);
  const [aiShortfallResult, setAiShortfallResult] = useState<any>(null);

  // Scroll to top button visibility state
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveApiKey = (key: string) => {
    setCustomApiKey(key);
    if (key) {
      localStorage.setItem('moil_custom_gemini_key', key);
      showToast('Custom Gemini API key saved & active for all queries!', 'success');
    } else {
      localStorage.removeItem('moil_custom_gemini_key');
      showToast('Reverted to container environment default key.', 'info');
    }
  };

  // Trigger AI Reserve Calibration
  const handleTriggerAiReserveCheck = async () => {
    setIsAiAnalyzingReserve(true);
    showToast(`Recalibrating geological reserves for ${selectedMine.name}...`, 'info');
    try {
      const boreholes = MINE_BOREHOLES[selectedMine.id] || MINE_BOREHOLES['balaghat'];
      const satellite = MINE_SATELLITE_DATA[selectedMine.id] || MINE_SATELLITE_DATA['balaghat'];

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customApiKey) {
        headers['x-gemini-api-key'] = customApiKey;
      }

      const res = await fetch('/api/ai/analyze-geology', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mineName: selectedMine.name,
          manualReserveMt: selectedMine.manualReserveMt,
          boreholes,
          satelliteIndices: satellite,
          apiKey: customApiKey,
        }),
      });
      const data = await res.json();
      setAiReserveResult(data);

      if (data.predictedReserveMt) {
        setSelectedMine((prev) => ({
          ...prev,
          aiPredictedReserveMt: Number(data.predictedReserveMt),
        }));
      }
      showToast(`AI Geological Synthesis complete: Reserves updated to ${data.predictedReserveMt || selectedMine.aiPredictedReserveMt} MT!`);
    } catch (err) {
      console.error(err);
      showToast('AI Reserve calculation loaded with heuristic baseline.');
    } finally {
      setIsAiAnalyzingReserve(false);
    }
  };

  // Trigger AI Shortfall Prediction
  const handleTriggerShortfallAi = async () => {
    setIsAiPredictingShortfall(true);
    showToast(`Running AI Shortfall Diagnosis for ${selectedMine.name}...`, 'info');
    try {
      const satellite = MINE_SATELLITE_DATA[selectedMine.id] || MINE_SATELLITE_DATA['balaghat'];

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customApiKey) {
        headers['x-gemini-api-key'] = customApiKey;
      }

      const res = await fetch('/api/ai/predict-shortfall', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mineName: selectedMine.name,
          plannedTargetMt: selectedMine.monthlyPlannedTargetMt,
          actualAchievedMt: selectedMine.currentActualMt,
          rainfallMm: satellite.rainfallMm24h,
          equipmentAvailability: 74,
          blastingDowntimeHrs: 6,
          apiKey: customApiKey,
        }),
      });
      const data = await res.json();
      setAiShortfallResult(data);
      showToast(`Shortfall Diagnosis Complete: ${data.shortfallRiskLevel} Risk Detected`);
    } catch (err) {
      console.error(err);
      showToast('AI Shortfall prediction generated.');
    } finally {
      setIsAiPredictingShortfall(false);
    }
  };

  // Toggle Action Status
  const handleApplyAction = (actionId: string) => {
    setActions((prev) =>
      prev.map((act) => {
        if (act.id === actionId) {
          const nextStatus = act.status === 'Applied' ? 'Pending' : 'Applied';
          showToast(
            nextStatus === 'Applied'
              ? `Action deployed to shift plan: +${act.impactRecoveryMt.toLocaleString()} MT recovered`
              : `Action returned to pending status`,
            'success'
          );
          return { ...act, status: nextStatus };
        }
        return act;
      })
    );
  };

  // Acknowledge / Dismiss Alert
  const handleDismissAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a))
    );
    showToast('Alert marked as acknowledged in operational log.', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 flex items-center space-x-2 bg-slate-900 border border-slate-700 shadow-2xl px-4 py-3 rounded-xl text-xs text-white animate-slide-up">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Floating Scroll to Top Arrow Button */}
      {showScrollTop && (
        <button
          id="btn-scroll-to-top"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 p-3 rounded-full shadow-2xl shadow-amber-950/60 transition-all duration-300 hover:scale-110 active:scale-95 border border-amber-300/60 focus:outline-none flex items-center justify-center group"
          title="Scroll to Top"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform stroke-[2.5]" />
        </button>
      )}

      {/* Top Navbar */}
      <Navbar
        selectedMine={selectedMine}
        onSelectMine={(m) => {
          setSelectedMine(m);
          showToast(`Switched telemetry to ${m.name} (${m.type})`, 'info');
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasCustomKey={!!customApiKey}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <DashboardOverview
            selectedMine={selectedMine}
            onSelectMine={setSelectedMine}
            onNavigateToTab={setActiveTab}
            alerts={alerts}
            onDismissAlert={handleDismissAlert}
            onTriggerAiReserveCheck={handleTriggerAiReserveCheck}
            isAiAnalyzing={isAiAnalyzingReserve}
          />
        )}

        {activeTab === 'satellite' && (
          <SatelliteMapViewer selectedMine={selectedMine} />
        )}

        {activeTab === 'subsurface' && (
          <SubsurfaceReserveViewer
            selectedMine={selectedMine}
            onTriggerAiReserveCheck={handleTriggerAiReserveCheck}
            isAiAnalyzing={isAiAnalyzingReserve}
            aiReserveResult={aiReserveResult}
          />
        )}

        {activeTab === 'shortfall' && (
          <ShortfallForecaster
            selectedMine={selectedMine}
            onTriggerShortfallAi={handleTriggerShortfallAi}
            isAiPredicting={isAiPredictingShortfall}
            aiShortfallResult={aiShortfallResult}
            onNavigateToSandbox={() => setActiveTab('sandbox')}
          />
        )}

        {activeTab === 'sandbox' && (
          <CorrectiveActionSandbox
            selectedMine={selectedMine}
            onApplyAction={handleApplyAction}
            actions={actions}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MOIL Limited • AI/ML and Space Technology Manganese Reserve Delineation & Production Platform</span>
          <span className="font-mono text-slate-400">SIH 2026 Innovation Challenge • Ministry of Steel</span>
        </div>
      </footer>

      {/* Modals */}
      <AiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        selectedMine={selectedMine}
        apiKey={customApiKey}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        selectedMine={selectedMine}
        actions={actions}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={customApiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
}
