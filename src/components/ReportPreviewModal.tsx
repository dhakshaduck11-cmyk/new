import { useEffect, useState } from 'react';
import { CheckCircle2, Download, FileSpreadsheet, X } from 'lucide-react';
import { exportReportCsv, exportReportPdf } from '../services/reportService';
import { riskApi } from '../services/riskApi';
import type { SurveyReport } from '../types/anomasea';

interface ReportPreviewModalProps {
  isOpen: boolean;
  report: SurveyReport;
  isLiveBackend: boolean;
  onClose: () => void;
}

export function ReportPreviewModal({
  isOpen,
  report,
  isLiveBackend,
  onClose,
}: ReportPreviewModalProps) {
  const [archiving, setArchiving] = useState(false);
  const [archiveMessage, setArchiveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setArchiveMessage(null);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExportPdf = async () => {
    exportReportPdf(report);
    if (isLiveBackend) {
      setArchiving(true);
      try {
        const result = await riskApi.submitReport(report);
        if (result.sentToBackend) {
          setArchiveMessage('Survey report archived via POST /api/risk/report.');
        }
      } finally {
        setArchiving(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1100] bg-slate-950/55 backdrop-blur-[1px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-preview-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0B192C] text-white flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="report-preview-title" className="text-base font-semibold">
              Automatic Environmental Risk Survey Report
            </h2>
            <p className="text-xs text-sky-200 mt-0.5">
              {report.surveyOverview.datasetLabel} ·{' '}
              {new Date(report.generatedAt).toUTCString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportReportCsv(report)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-100 hover:bg-slate-700 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => void handleExportPdf()}
              disabled={archiving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 text-slate-950 text-xs font-semibold hover:bg-sky-400 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{archiving ? 'Archiving...' : 'Export PDF'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
              aria-label="Close report preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-6 anomasea-scroll text-xs">
          {archiveMessage && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-emerald-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{archiveMessage}</span>
            </div>
          )}

          {/* Section 1 */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-1.5">
              1. Survey Overview &amp; Detection Statistics
            </h3>
            <p className="text-slate-600">
              Active scope: {report.surveyOverview.activeFiltersSummary}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="text-[11px] text-slate-500">Total Detections</div>
                <div className="text-lg font-mono font-bold tabular-nums text-slate-900">
                  {report.analytics.totalDetections}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="text-[11px] text-slate-500">DBSCAN Hotspots</div>
                <div className="text-lg font-mono font-bold tabular-nums text-sky-700">
                  {report.analytics.totalHotspots}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="text-[11px] text-slate-500">
                  Mean Environmental Risk
                </div>
                <div className="text-lg font-mono font-bold tabular-nums text-slate-900">
                  {report.analytics.meanRiskScore} / 100
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="text-[11px] text-slate-500">
                  Mean AI Confidence
                </div>
                <div className="text-lg font-mono font-bold tabular-nums text-slate-900">
                  {report.analytics.meanAiConfidence}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  Risk Classification Summary
                </div>
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-100">
                    {report.analytics.severityDistribution.map((s) => (
                      <tr key={s.level}>
                        <td className="px-3 py-1.5 font-medium text-slate-800 flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          <span>{s.level}</span>
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                          {s.count} ({s.percentage}%)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  Debris Category Distribution
                </div>
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-100">
                    {report.analytics.categoryDistribution.map((c) => (
                      <tr key={c.category}>
                        <td className="px-3 py-1.5 text-slate-800 truncate max-w-[220px]">
                          {c.category}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono tabular-nums whitespace-nowrap">
                          {c.count} · avg {c.meanRisk}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-1.5">
              2. Geographical Hotspot Analysis (DBSCAN) &amp; Inspection Priorities
            </h3>

            {report.hotspots.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 px-4 py-5 text-center text-slate-500">
                No spatial clusters satisfied current DBSCAN parameters (ε ={' '}
                {report.configSnapshot.dbscan.epsilonMeters}m, minPts ={' '}
                {report.configSnapshot.dbscan.minPoints}).
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Hotspot</th>
                      <th className="px-3 py-2 font-semibold text-right">Det.</th>
                      <th className="px-3 py-2 font-semibold text-right">
                        Density
                      </th>
                      <th className="px-3 py-2 font-semibold text-right">
                        Accum. Risk
                      </th>
                      <th className="px-3 py-2 font-semibold">Severity</th>
                      <th className="px-3 py-2 font-semibold">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.hotspots.map((hs) => (
                      <tr key={hs.id}>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-slate-900">
                            {hs.id} · {hs.regionLabel}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {hs.centroid.lat.toFixed(4)}, {hs.centroid.lng.toFixed(4)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {hs.detectionCount}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {hs.detectionDensityPerKm2}/km²
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums font-semibold">
                          {hs.accumulatedRisk}
                        </td>
                        <td
                          className="px-3 py-2 font-semibold"
                          style={{ color: hs.severityColor }}
                        >
                          {hs.overallSeverity}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {hs.recommendedPriority}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                Recommended Inspection Priorities
              </div>
              <div className="divide-y divide-slate-100">
                {report.recommendedInspectionPriorities.map((tier) => (
                  <div
                    key={tier.priority}
                    className="px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">
                        {tier.priority}
                      </span>
                      <p className="text-slate-600 mt-0.5">{tier.actionGuidance}</p>
                    </div>
                    <span className="font-mono font-bold tabular-nums text-slate-900 shrink-0">
                      {tier.targetCount} targets
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 3: Data Uncertainty & UN SDG 14 */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2">
              <h3 className="text-xs font-semibold text-slate-900">
                Data Uncertainty &amp; Methodological Separation
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {report.dataUncertainty.methodologyNote}
              </p>
              <div className="text-[11px] font-mono text-slate-700 pt-1">
                Mean GPS ±{report.dataUncertainty.meanGpsUncertaintyMeters}m · Max ±
                {report.dataUncertainty.maxGpsUncertaintyMeters}m · Low Conf. (&lt;
                70%): {report.dataUncertainty.lowConfidenceDetectionsCount}
              </div>
            </div>

            <div className="rounded-lg bg-sky-50/60 border border-sky-200 p-4 space-y-2">
              <h3 className="text-xs font-semibold text-sky-950">
                UN SDG 14 (Life Below Water) Relevance
              </h3>
              <div className="space-y-2">
                {report.sdg14Relevance.map((sdg) => (
                  <div key={sdg.target}>
                    <div className="flex items-center justify-between font-medium text-sky-900">
                      <span>
                        {sdg.target} · {sdg.title}
                      </span>
                      <span className="font-mono tabular-nums">
                        {sdg.relevanceCount}
                      </span>
                    </div>
                    <p className="text-[11px] text-sky-800/90 mt-0.5">
                      {sdg.alignmentSummary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
