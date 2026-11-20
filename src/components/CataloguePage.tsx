import { useMemo, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { DEBRIS_CATEGORIES, DEBRIS_CATALOGUE } from '../data/catalogue';
import type { DebrisCategory } from '../types/anomasea';

export function CataloguePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | DebrisCategory>(
    'all',
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return DEBRIS_CATALOGUE.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.objectName.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.materialComposition.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  const countsByCategory = useMemo(() => {
    const map = new Map<DebrisCategory, number>();
    for (const cat of DEBRIS_CATEGORIES) {
      map.set(cat, 0);
    }
    for (const item of DEBRIS_CATALOGUE) {
      map.set(item.category, (map.get(item.category) ?? 0) + 1);
    }
    return map;
  }, []);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <BookOpen className="w-3.5 h-3.5 text-sky-600" />
              <span>AnomaSea Reference Taxonomy</span>
              <span aria-hidden="true">·</span>
              <span>{DEBRIS_CATALOGUE.length} Structured Object Classes</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mt-0.5">
              Marine Debris Catalogue &amp; Baseline Hazard Profiles
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Baseline environmental persistence, entanglement, physical, chemical, and
              ecological hazard ratings used by the Environmental Risk Radar scoring
              engine across all 5 debris categories.
            </p>
          </div>

          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter object classes or materials..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            All Categories ({DEBRIS_CATALOGUE.length})
          </button>

          {DEBRIS_CATEGORIES.map((category) => {
            const count = countsByCategory.get(category) ?? 0;
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-sky-50 text-sky-900 border-sky-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Catalogue Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center text-sm text-slate-500">
          No debris catalogue classes match &ldquo;{searchQuery}&rdquo;.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const bp = item.baselineProfile;
            return (
              <article
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-4 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="text-[11px] text-slate-500 font-medium leading-snug">
                    {item.category}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      {item.objectName}
                    </h2>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      {item.id} · {item.materialComposition}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Est. Persistence</span>
                    <span className="font-mono font-medium text-slate-900">
                      {item.estimatedPersistenceYears}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    {(
                      [
                        { label: 'Persist', value: bp.persistence },
                        { label: 'Entang', value: bp.entanglement },
                        { label: 'Phys', value: bp.physicalHazard },
                        { label: 'Chem', value: bp.chemicalContamination },
                        { label: 'Ecol', value: bp.ecologicalImpact },
                      ] as const
                    ).map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded-lg bg-slate-50 border border-slate-200/70 py-1.5 px-1"
                      >
                        <div className="text-[10px] text-slate-500">
                          {metric.label}
                        </div>
                        <div className="text-xs font-mono font-bold tabular-nums text-slate-900 mt-0.5">
                          {metric.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between gap-2">
                    <span>SDG Alignment</span>
                    <span className="font-mono font-medium text-sky-800">
                      {item.sdg14Targets.join(' · ')}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
