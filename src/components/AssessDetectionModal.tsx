import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { DEBRIS_CATALOGUE } from '../data/catalogue';
import {
  OBJECT_CONDITIONS,
  OBJECT_SIZES,
  VERIFICATION_STATUSES,
} from '../engine/riskEngine';
import type {
  ObjectCondition,
  ObjectSize,
  RawDetectionRecord,
  VerificationStatus,
} from '../types/anomasea';

interface AssessDetectionModalProps {
  isOpen: boolean;
  defaultCenter: { lat: number; lng: number };
  isLiveBackend: boolean;
  onClose: () => void;
  onSubmit: (record: RawDetectionRecord) => Promise<void>;
}

export function AssessDetectionModal({
  isOpen,
  defaultCenter,
  isLiveBackend,
  onClose,
  onSubmit,
}: AssessDetectionModalProps) {
  const [classId, setClassId] = useState(DEBRIS_CATALOGUE[0].id);
  const [latInput, setLatInput] = useState(defaultCenter.lat.toFixed(5));
  const [lngInput, setLngInput] = useState(defaultCenter.lng.toFixed(5));
  const [gpsUncertainty, setGpsUncertainty] = useState('9.5');
  const [aiConfidence, setAiConfidence] = useState('86.0');
  const [condition, setCondition] =
    useState<ObjectCondition>('Partially Degraded');
  const [size, setSize] = useState<ObjectSize>('Medium');
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>('Pending Review');
  const [surveyZone, setSurveyZone] = useState('Monterey Harbor Breakwater');
  const [depthMeters, setDepthMeters] = useState('15.0');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLatInput(defaultCenter.lat.toFixed(5));
      setLngInput(defaultCenter.lng.toFixed(5));
    }
  }, [isOpen, defaultCenter.lat, defaultCenter.lng]);

  if (!isOpen) return null;

  const selectedClass =
    DEBRIS_CATALOGUE.find((item) => item.id === classId) ?? DEBRIS_CATALOGUE[0];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const lat = Number(latInput);
    const lng = Number(lngInput);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    setSubmitting(true);
    try {
      await onSubmit({
        id: `OBS-${Date.now().toString().slice(-5)}`,
        catalogueClassId: selectedClass.id,
        objectName: selectedClass.objectName,
        category: selectedClass.category,
        lat,
        lng,
        gpsUncertaintyMeters: Math.max(1, Number(gpsUncertainty) || 10),
        aiConfidence: Math.min(100, Math.max(0, Number(aiConfidence) || 75)),
        condition,
        size,
        verificationStatus,
        observedAt: new Date().toISOString(),
        surveyZone: surveyZone.trim() || 'Coastal Survey Sector',
        depthMeters: depthMeters ? Number(depthMeters) : undefined,
        observationCount: 1,
        notes: notes.trim() || undefined,
        isSynthetic: !isLiveBackend,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1050] bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assess-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2
              id="assess-modal-title"
              className="text-base font-semibold text-slate-900"
            >
              Assess &amp; Log Underwater Detection
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isLiveBackend
                ? 'Submits to POST /api/risk/assess on connected FastAPI backend'
                : 'Runs local Environmental Risk Radar engine and updates Leaflet layers'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="p-5 space-y-4 max-h-[80vh] overflow-y-auto anomasea-scroll"
        >
          <div>
            <label
              htmlFor="assess-class"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              AnomaSea Catalogue Object Class
            </label>
            <select
              id="assess-class"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
            >
              {DEBRIS_CATALOGUE.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.objectName} ({item.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="assess-lat"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Latitude
              </label>
              <input
                id="assess-lat"
                type="number"
                step="0.00001"
                required
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>
            <div>
              <label
                htmlFor="assess-lng"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Longitude
              </label>
              <input
                id="assess-lng"
                type="number"
                step="0.00001"
                required
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>
            <div>
              <label
                htmlFor="assess-gps"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                GPS Uncertainty (±m)
              </label>
              <input
                id="assess-gps"
                type="number"
                min="1"
                max="200"
                step="0.5"
                required
                value={gpsUncertainty}
                onChange={(e) => setGpsUncertainty(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="assess-conf"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                AI Confidence (%)
              </label>
              <input
                id="assess-conf"
                type="number"
                min="1"
                max="100"
                step="0.1"
                required
                value={aiConfidence}
                onChange={(e) => setAiConfidence(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>
            <div>
              <label
                htmlFor="assess-cond"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Object Condition
              </label>
              <select
                id="assess-cond"
                value={condition}
                onChange={(e) =>
                  setCondition(e.target.value as ObjectCondition)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {OBJECT_CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="assess-size"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Object Size
              </label>
              <select
                id="assess-size"
                value={size}
                onChange={(e) => setSize(e.target.value as ObjectSize)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {OBJECT_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label
                htmlFor="assess-zone"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Survey Zone / Sector
              </label>
              <input
                id="assess-zone"
                type="text"
                value={surveyZone}
                onChange={(e) => setSurveyZone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="assess-depth"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Depth (m)
              </label>
              <input
                id="assess-depth"
                type="number"
                min="0"
                step="0.1"
                value={depthMeters}
                onChange={(e) => setDepthMeters(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="assess-status"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Initial Verification Status
            </label>
            <select
              id="assess-status"
              value={verificationStatus}
              onChange={(e) =>
                setVerificationStatus(e.target.value as VerificationStatus)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {VERIFICATION_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="assess-notes"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Field / ROV Notes (Optional)
            </label>
            <textarea
              id="assess-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Substrate contact, bio-fouling, sonar signature..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Assessing...' : 'Run Risk Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
