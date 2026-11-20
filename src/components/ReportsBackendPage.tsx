import { useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileText,
  RefreshCw,
  Server,
  SlidersHorizontal,
} from 'lucide-react';
import { DEFAULT_RISK_CONFIG } from '../engine/riskEngine';
import {
  FASTAPI_ENDPOINTS,
  getApiBaseUrl,
  setApiBaseUrl,
} from '../services/riskApi';
import type {
  BackendConnectionStatus,
  RiskConfig,
  SourceMode,
} from '../types/anomasea';

interface ReportsBackendPageProps {
  sourceMode: SourceMode;
  connectionStatus: BackendConnectionStatus;
  riskConfig: RiskConfig;
  onUpdateRiskConfig: (config: RiskConfig) => void;
  onReconnectBackend: () => Promise<void>;
  onOpenReportModal: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
}

export function ReportsBackendPage({
  sourceMode,
  connectionStatus,
  riskConfig,
  onUpdateRiskConfig,
  onReconnectBackend,
  onOpenReportModal,
  onExportCsv,
  onExportPdf,
}: ReportsBackendPageProps) {
  const [urlInput, setUrlInput] = useState(() => getApiBaseUrl());
  const [testing, setTesting] = useState(false);

  const handleTestAndSync = async (event: React.FormEvent) => {
    event.preventDefault();
    setTesting(true);
    try {
      setApiBaseUrl(urlInput);
      await onReconnectBackend();
    } finally {
      setTesting(false);
    }
  };

  const handleClearBackend = async () => {
    setTesting(true);
    try {
      setUrlInput('');
      setApiBaseUrl('');
      await onReconnectBackend();
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Exports */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500">
            Compliance Reporting &amp; FastAPI Service Bridge
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mt-0.5">
            Reports, Risk Calibration &amp; FastAPI Backend
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Generate structured marine risk reports aligned with UN SDG 14, configure
            environmental risk classification thresholds, and bind AnomaSea to a
            live Python FastAPI risk engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenReportModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-sky-600" />
            <span>Preview Full Report</span>
          </button>
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* 2-Column Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* FastAPI Backend Bridge */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-sky-600" />
                <span>Python FastAPI Risk Engine Connection</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Active dataset source:{' '}
                <strong className="text-slate-800">
                  {sourceMode === 'live-api'
                    ? 'Live FastAPI Endpoint'
                    : sourceMode === 'imported-survey'
                      ? 'Imported GeoJSON Dataset'
                      : 'Local Demonstration Mode'}
                </strong>
              </p>
            </div>
          </div>

          <form onSubmit={(e) => void handleTestAndSync(e)} className="space-y-3">
            <div>
              <label
                htmlFor="fastapi-url"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Backend Base URL (or configure VITE_API_BASE_URL)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="fastapi-url"
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://api.example.org"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={testing}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`}
                  />
                  <span>{testing ? 'Syncing...' : 'Test & Sync'}</span>
                </button>
              </div>
            </div>

            {urlInput && (
              <button
                type="button"
                onClick={() => void handleClearBackend()}
                disabled={testing}
                className="text-xs text-slate-600 hover:text-slate-900 underline cursor-pointer"
              >
                Clear URL and revert to Local Demonstration Mode
              </button>
            )}
          </form>

          {/* Connection Status Readout */}
          <div
            className={`rounded-lg border px-3.5 py-2.5 text-xs ${
              connectionStatus.connected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2 font-medium">
              <span className="flex items-center gap-1.5">
                {connectionStatus.connected && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}
                <span>
                  {connectionStatus.connected
                    ? 'Backend Connected'
                    : 'Local Fallback Active'}
                </span>
              </span>
              {connectionStatus.latencyMs !== undefined && (
                <span className="font-mono tabular-nums text-[11px]">
                  {connectionStatus.latencyMs} ms
                </span>
              )}
            </div>
            <p className="text-[11px] mt-1 leading-relaxed">
              {connectionStatus.message}
            </p>
          </div>

          {/* Prepared FastAPI Endpoints */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 mb-2">
              Prepared FastAPI Integration Endpoints
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Method</th>
                    <th className="px-3 py-2 font-semibold">Endpoint Path</th>
                    <th className="px-3 py-2 font-semibold">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {FASTAPI_ENDPOINTS.map((ep) => (
                    <tr key={ep.path}>
                      <td className="px-3 py-2 font-mono font-semibold text-sky-700">
                        {ep.method}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-900">
                        {ep.path}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{ep.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Risk Classification Thresholds & Modifiers */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-sky-600" />
                <span>Risk Classification Thresholds &amp; Modifiers</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All KPI metrics, radar pins, and report tables recompute in real
                time.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onUpdateRiskConfig(DEFAULT_RISK_CONFIG)}
              className="text-xs font-medium text-sky-700 hover:underline whitespace-nowrap cursor-pointer"
            >
              Reset Defaults
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <label className="block">
              <span className="block text-[11px] font-medium text-slate-600 mb-1">
                Moderate Min
              </span>
              <input
                type="number"
                min={10}
                max={45}
                value={riskConfig.thresholds.moderateMin}
                onChange={(e) =>
                  onUpdateRiskConfig({
                    ...riskConfig,
                    thresholds: {
                      ...riskConfig.thresholds,
                      moderateMin: Number(e.target.value) || 25,
                    },
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono tabular-nums"
              />
            </label>

            <label className="block">
              <span className="block text-[11px] font-medium text-slate-600 mb-1">
                High Min
              </span>
              <input
                type="number"
                min={35}
                max={70}
                value={riskConfig.thresholds.highMin}
                onChange={(e) =>
                  onUpdateRiskConfig({
                    ...riskConfig,
                    thresholds: {
                      ...riskConfig.thresholds,
                      highMin: Number(e.target.value) || 50,
                    },
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono tabular-nums"
              />
            </label>

            <label className="block">
              <span className="block text-[11px] font-medium text-slate-600 mb-1">
                Critical Min
              </span>
              <input
                type="number"
                min={60}
                max={95}
                value={riskConfig.thresholds.criticalMin}
                onChange={(e) =>
                  onUpdateRiskConfig({
                    ...riskConfig,
                    thresholds: {
                      ...riskConfig.thresholds,
                      criticalMin: Number(e.target.value) || 75,
                    },
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono tabular-nums"
              />
            </label>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
            <label className="block">
              <div className="flex justify-between text-slate-700 mb-1">
                <span>Object Size Multiplier Impact</span>
                <span className="font-mono font-semibold tabular-nums">
                  {riskConfig.sizeMultiplierImpact.toFixed(1)}×
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={riskConfig.sizeMultiplierImpact}
                onChange={(e) =>
                  onUpdateRiskConfig({
                    ...riskConfig,
                    sizeMultiplierImpact: Number(e.target.value),
                  })
                }
                className="w-full accent-slate-900"
              />
            </label>

            <label className="block">
              <div className="flex justify-between text-slate-700 mb-1">
                <span>Degradation / Corrosion Condition Impact</span>
                <span className="font-mono font-semibold tabular-nums">
                  {riskConfig.conditionMultiplierImpact.toFixed(1)}×
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={riskConfig.conditionMultiplierImpact}
                onChange={(e) =>
                  onUpdateRiskConfig({
                    ...riskConfig,
                    conditionMultiplierImpact: Number(e.target.value),
                  })
                }
                className="w-full accent-slate-900"
              />
            </label>

            <label className="block">
              <div className="flex justify-between text-slate-700 mb-1">
                <span>Evidence &amp; GPS Uncertainty Penalty</span>
                <span className="font-mono font-semibold tabular-nums">
                  {riskConfig.evidenceUncertaintyPenalty.toFixed(1)}×
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={riskConfig.evidenceUncertaintyPenalty}
                onChange={(e) =>
                  onUpdateRiskConfig({
                    ...riskConfig,
                    evidenceUncertaintyPenalty: Number(e.target.value),
                  })
                }
                className="w-full accent-slate-900"
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
