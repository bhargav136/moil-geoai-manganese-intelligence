import React, { useState } from 'react';
import { Key, X, CheckCircle2, AlertTriangle, Sparkles, RefreshCw, ShieldCheck } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
}) => {
  if (!isOpen) return null;

  const [inputKey, setInputKey] = useState<string>(apiKey);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  const handleTestKey = async () => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch('/api/ai/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: inputKey.trim() }),
      });
      const data = await res.json();

      if (data.valid) {
        setValidationResult({
          valid: true,
          message: 'Success: Gemini 3.6 Flash connected & verified!',
        });
      } else {
        setValidationResult({
          valid: false,
          message: data.message || 'Key validation failed. Please check the key.',
        });
      }
    } catch (err: any) {
      setValidationResult({
        valid: false,
        message: 'Network error communicating with validation service.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = () => {
    onSaveApiKey(inputKey.trim());
    onClose();
  };

  const handleResetToSystem = () => {
    setInputKey('');
    onSaveApiKey('');
    setValidationResult({
      valid: true,
      message: 'Reverted to container environment default key.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-bold">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Gemini AI Configuration</h3>
              <p className="text-[11px] text-slate-400">Manage your Google AI Studio Gemini API Key</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-slate-300">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Active Connection Status</span>
              </span>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              The platform is powered by <strong>Gemini 3.6 Flash</strong> on Express backend. You can either use the built-in system environment key or paste your custom key below.
            </p>
          </div>

          <div>
            <label className="block font-medium text-slate-200 mb-1">
              Custom Gemini API Key:
            </label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setValidationResult(null);
              }}
              placeholder="Paste AIzaSy... (optional, leave blank for system key)"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          {validationResult && (
            <div
              className={`p-3 rounded-xl border flex items-center space-x-2 ${
                validationResult.valid
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              }`}
            >
              {validationResult.valid ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span className="text-[11px]">{validationResult.message}</span>
            </div>
          )}

          <div className="flex items-center space-x-2 pt-2">
            <button
              onClick={handleTestKey}
              disabled={isValidating}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 rounded-xl border border-slate-700 transition flex items-center justify-center space-x-1.5"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test Connection</span>
                </>
              )}
            </button>

            <button
              onClick={handleSave}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl transition flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save & Apply</span>
            </button>
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={handleResetToSystem}
              className="text-[11px] text-slate-500 hover:text-slate-300 underline"
            >
              Reset to container environment default
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
