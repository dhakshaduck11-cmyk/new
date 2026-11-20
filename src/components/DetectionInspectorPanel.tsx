import { Calendar, Crosshair, ShieldAlert, X } from 'lucide-react';
import { VERIFICATION_STATUSES } from '../engine/riskEngine';
import type { AssessedDetection, VerificationStatus } from '../types/anomasea';

interface DetectionInspectorPanelProps {
  detection: AssessedDetection;
  onClose: () => void;
  onUpdateVerification: (id: string, status: VerificationStatus) => void;
  onFlyToDetection: (detection: AssessedDetection) => void;
  onInspectBreakdown: (id: string) => void;
}

export function DetectionInspectorPanel({
  detection,
  onClose,
  onUpdateVerification,
  onFlyToDetection,
  onInspectBreakdown,
}: DetectionInspectorPanelProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 flex items-start justify-between gap-3 bg-slate-50/70">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-mono text-slate-500">
            <span>{detection.id}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{detection.surveyZone}</span>
            {detection.isSynthetic && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-700 font-sans font-medium">
                  Synthetic Demo
                </span>
              </>
            )}
          </div>
          <h3 className="text-base font-semibold text-slate-900 mt-0.5 leading-snug">
            {detection.objectName}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">{detection.category}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors shrink-0 cursor-pointer"
          aria-label="Close detection details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 anomasea-scroll">
        {/* Dual Score Strip */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60">
            <div className="text-[11px] font-medium text-slate-500">
              Environmental Risk Score
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className="text-2xl font-mono font-bold tabular-nums"
                style={{ color: detection.riskColor }}
              >
                {detection.riskScore}
              </span>
              <span className="text-xs font-mono text-slate-400">/ 100</span>
            </div>
            <div
              className="mt-1 text-xs font-semibold"
              style={{ color: detection.riskColor }}
            >
              {detection.riskLevel} Severity
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-white">
            <div className="text-[11px] font-medium text-slate-500">
              AI Detection Confidence
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold tabular-nums text-slate-900">
                {detection.aiConfidence.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-slate-400">%</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Classifier certainty (separate metric)
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs border-y border-slate-100 py-3">
          <div>
            <span className="text-slate-500 block">Object Condition</span>
            <span className="font-medium text-slate-900">
              {detection.condition}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Estimated Size</span>
            <span className="font-medium text-slate-900">{detection.size}</span>
          </div>
          <div>
            <span className="text-slate-500 block">GPS Uncertainty</span>
            <span className="font-mono font-medium text-slate-900 tabular-nums">
              ±{detection.gpsUncertaintyMeters.toFixed(1)} m
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Bathymetric Depth</span>
            <span className="font-mono font-medium text-slate-900 tabular-nums">
              {detection.depthMeters !== undefined
                ? `${detection.depthMeters.toFixed(1)} m`
                : 'Not recorded'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Coordinates</span>
            <span className="font-mono font-medium text-slate-900 tabular-nums">
              {detection.lat.toFixed(5)}, {detection.lng.toFixed(5)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Recommended Priority</span>
            <span className="font-medium text-sky-700">
              {detection.recommendedPriority}
            </span>
          </div>
        </div>

        {/* Verification Status Control */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <label
            htmlFor="inspector-verification-status"
            className="text-slate-600 font-medium"
          >
            Verification Status
          </label>
          <select
            id="inspector-verification-status"
            value={detection.verificationStatus}
            onChange={(e) =>
              onUpdateVerification(
                detection.id,
                e.target.value as VerificationStatus,
              )
            }
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-sky-500 focus:outline-none"
          >
            {VERIFICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Assessment Rationale */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-700" />
            <span>Assessment Rationale</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {detection.explanation}
          </p>
          {detection.notes && (
            <p className="text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-200/70">
              Survey note: {detection.notes}
            </p>
          )}
        </div>

        {/* Contributing Risk Factors */}
        <div>
          <h4 className="text-xs font-semibold text-slate-900 mb-2">
            Contributing Risk Factors
          </h4>
          <div className="space-y-2.5">
            {detection.contributingFactors.map((factor) => {
              const isModifier = factor.weightPercent === 0;
              const widthPct = isModifier
                ? Math.min(100, Math.max(0, Math.abs(factor.rawScore) * 4))
                : Math.min(100, Math.max(0, factor.rawScore));
              return (
                <div key={factor.key} className="text-xs">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-medium text-slate-800 truncate">
                      {factor.label}
                    </span>
                    <span className="font-mono text-[11px] text-slate-600 tabular-nums shrink-0">
                      {isModifier
                        ? `${factor.weightedContribution >= 0 ? '+' : ''}${factor.weightedContribution} pts`
                        : `${factor.rawScore}/100 (${factor.weightPercent}% wt)`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-200"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: isModifier
                          ? factor.weightedContribution >= 0
                            ? '#0284C7'
                            : '#16A34A'
                          : detection.riskColor,
                      }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {factor.summary}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/70 space-y-2">
        <button
          type="button"
          onClick={() => onInspectBreakdown(detection.id)}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
          <span>Inspect Full Risk Breakdown</span>
        </button>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onFlyToDetection(detection)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-medium hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Center Map on Target</span>
          </button>

          <div className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 px-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{detection.observedAt.slice(0, 10)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
