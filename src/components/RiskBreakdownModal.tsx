import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react';
import { CATALOGUE_BY_ID } from '../data/catalogue';
import {
  assessDetection,
  computeMissingOrUncertainFields,
  PRIORITY_ACTION_GUIDANCE,
} from '../engine/riskEngine';
import { riskApi } from '../services/riskApi';
import type {
  AssessedDetection,
  RawDetectionRecord,
  RiskConfig,
} from '../types/anomasea';

interface RiskBreakdownModalProps {
  isOpen: boolean;
  detection: RawDetectionRecord | null;
  riskConfig: RiskConfig;
  isLiveBackend: boolean;
  onClose: () => void;
}

export function RiskBreakdownModal({
  isOpen,
  detection,
  riskConfig,
  isLiveBackend,
  onClose,
}: RiskBreakdownModalProps) {
  const [assessed, setAssessed] = useState<AssessedDetection | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backendBanner, setBackendBanner] = useState<string | null>(null);

  const computeBreakdown = useCallback(async () => {
    if (!isOpen) return;

    if (!detection) {
      setAssessed(null);
      setErrorMessage(
        'No detection record is currently selected or the record is no longer available under active filters.',
      );
      return;
    }

    if (
      Number.isNaN(detection.lat) ||
      Number.isNaN(detection.lng) ||
      !detection.objectName
    ) {
      setAssessed(null);
      setErrorMessage(
        'Unable to compute risk breakdown: detection record is missing valid coordinates or object classification.',
      );
      return;
    }

    setErrorMessage(null);
    setBackendBanner(null);

    if (isLiveBackend) {
      setLoading(true);
      try {
        const result = await riskApi.assessDetection(detection, riskConfig);
        setAssessed(result.assessed);
        setBackendBanner(
          result.fromBackend
            ? 'Assessed live via POST /api/risk/assess using current scoring configuration.'
            : 'Backend assessment endpoint unavailable; computed locally with configured scoring weights.',
        );
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Risk assessment failed.',
        );
        setAssessed(assessDetection(detection, riskConfig));
      } finally {
        setLoading(false);
      }
    } else {
      try {
        setAssessed(assessDetection(detection, riskConfig));
      } catch (err) {
        setAssessed(null);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Failed to calculate environmental risk breakdown.',
        );
      }
    }
  }, [isOpen, detection, riskConfig, isLiveBackend]);

  useEffect(() => {
    void computeBreakdown();
  }, [computeBreakdown]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const catalogueEntry = assessed
    ? CATALOGUE_BY_ID[assessed.catalogueClassId]
    : undefined;
  const weightedFactors = assessed
    ? assessed.contributingFactors.filter((f) => f.weightPercent > 0)
    : [];
  const modifierFactors = assessed
    ? assessed.contributingFactors.filter((f) => f.weightPercent === 0)
    : [];
  const baseTotal = weightedFactors.reduce(
    (sum, f) => sum + f.weightedContribution,
    0,
  );
  const modifierTotal = modifierFactors.reduce(
    (sum, f) => sum + f.weightedContribution,
    0,
  );
  const missingIssues = assessed ? computeMissingOrUncertainFields(assessed) : [];

  return (
    <div
      className="fixed inset-0 z-[1100] bg-slate-950/55 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="risk-breakdown-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-mono text-slate-500">
              <span>{assessed?.id ?? detection?.id ?? 'Unavailable'}</span>
              {assessed && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{assessed.surveyZone}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {assessed.lat.toFixed(5)}, {assessed.lng.toFixed(5)}
                  </span>
                </>
              )}
            </div>
            <h2
              id="risk-breakdown-title"
              className="text-base sm:text-lg font-semibold text-slate-900 mt-0.5 leading-snug"
            >
              {assessed?.objectName ??
                detection?.objectName ??
                'Full Environmental Risk Breakdown'}
            </h2>
            {assessed && (
              <p className="text-xs text-slate-600 mt-0.5">{assessed.category}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors shrink-0 cursor-pointer"
            aria-label="Close risk breakdown"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5 anomasea-scroll">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-600">
              <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
              <span>Retrieving environmental risk assessment...</span>
            </div>
          )}

          {!loading && errorMessage && (
            <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-xs text-red-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div>
                <div className="font-semibold">Risk Breakdown Warning</div>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {!loading && assessed && (
            <>
              {backendBanner && (
                <div className="px-3 py-2 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-900">
                  {backendBanner}
                </div>
              )}

              {/* 3-Card Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
                  <div className="text-[11px] font-medium text-slate-500">
                    Environmental Risk Score
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span
                      className="text-3xl font-mono font-bold tabular-nums"
                      style={{ color: assessed.riskColor }}
                    >
                      {assessed.riskScore}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      / 100
                    </span>
                  </div>
                  <div
                    className="mt-1 text-xs font-semibold"
                    style={{ color: assessed.riskColor }}
                  >
                    {assessed.riskLevel} Classification
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                  <div className="text-[11px] font-medium text-slate-500">
                    AI Detection Confidence (Separate)
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-3xl font-mono font-bold tabular-nums text-slate-900">
                      {assessed.aiConfidence.toFixed(1)}
                    </span>
                    <span className="text-xs font-mono text-slate-400">%</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Verification: {assessed.verificationStatus}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                  <div className="text-[11px] font-medium text-slate-500">
                    GPS Uncertainty &amp; Physical Metadata
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-mono font-bold tabular-nums text-slate-900">
                      ±{assessed.gpsUncertaintyMeters.toFixed(1)}
                    </span>
                    <span className="text-xs font-mono text-slate-500">m</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Size: <strong>{assessed.size}</strong> ·{' '}
                    <strong>{assessed.condition}</strong>
                  </div>
                </div>
              </div>

              {/* Weighted Factors */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-slate-900">
                    Contributing Risk Factors &amp; Weighted Scoring Breakdown
                  </h3>
                  <span className="text-[11px] font-mono text-slate-600 tabular-nums">
                    Base {baseTotal.toFixed(1)} + Modifiers{' '}
                    {modifierTotal >= 0 ? '+' : ''}
                    {modifierTotal.toFixed(1)} = {assessed.riskScore}/100
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  {weightedFactors.map((factor) => (
                    <div key={factor.key} className="text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <span className="font-medium text-slate-900">
                          {factor.label}
                        </span>
                        <span className="font-mono text-[11px] text-slate-700 tabular-nums">
                          Raw {factor.rawScore}/100 × {factor.weightPercent}% wt ={' '}
                          <strong className="text-slate-900">
                            +{factor.weightedContribution.toFixed(1)} pts
                          </strong>
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(0, factor.rawScore))}%`,
                            backgroundColor: assessed.riskColor,
                          }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {factor.summary}
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {modifierFactors.map((mod) => (
                      <div
                        key={mod.key}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-slate-800">
                            {mod.label}
                          </span>
                          <span className="font-mono font-semibold text-sky-700 tabular-nums">
                            {mod.weightedContribution >= 0 ? '+' : ''}
                            {mod.weightedContribution.toFixed(1)} pts
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {mod.summary}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calculation Methodology & Rationale */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                  <ShieldAlert className="w-4 h-4 text-slate-700" />
                  <span>Calculation Methodology &amp; Rationale</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {assessed.explanation}
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Thresholds applied: Low (0–{riskConfig.thresholds.moderateMin - 1}
                  ), Moderate ({riskConfig.thresholds.moderateMin}–
                  {riskConfig.thresholds.highMin - 1}), High (
                  {riskConfig.thresholds.highMin}–
                  {riskConfig.thresholds.criticalMin - 1}), Critical (
                  {riskConfig.thresholds.criticalMin}–100).
                  {catalogueEntry && (
                    <>
                      {' '}
                      Material profile:{' '}
                      <strong>{catalogueEntry.materialComposition}</strong> (est.{' '}
                      {catalogueEntry.estimatedPersistenceYears}).
                    </>
                  )}
                </p>
              </div>

              {/* Missing Info & Operational Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-3.5">
                  <h3 className="text-xs font-semibold text-slate-900 mb-2">
                    Missing or Uncertain Information
                  </h3>
                  {missingIssues.length === 0 ? (
                    <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                      <span>
                        All primary telemetry fields (depth, notes, verified
                        status, and high confidence/GPS precision) are present.
                      </span>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {missingIssues.map((issue) => (
                        <li key={issue.label} className="text-xs">
                          <div className="font-medium text-amber-900">
                            {issue.label}
                          </div>
                          <div className="text-[11px] text-slate-600">
                            {issue.detail}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="border border-slate-200 rounded-lg p-3.5 bg-sky-50/40">
                  <h3 className="text-xs font-semibold text-slate-900 mb-1.5">
                    Recommended Inspection Priority
                  </h3>
                  <div className="text-sm font-semibold text-sky-800">
                    {assessed.recommendedPriority}
                  </div>
                  <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                    {PRIORITY_ACTION_GUIDANCE[assessed.recommendedPriority]}
                  </p>
                  {assessed.notes && (
                    <p className="text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-200">
                      Field note: {assessed.notes}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => void computeBreakdown()}
            disabled={loading || !detection}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            <span>Recalculate</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
