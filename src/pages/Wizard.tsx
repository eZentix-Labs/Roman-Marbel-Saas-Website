import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '@/components/layout/AppShell';
import { ActionBar, BarSpacer, Callout, Icon, NumberField, Segmented } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useApp } from '@/state/AppState';
import { BUDGET_BANDS, COLOUR_SWATCHES, ROOMS } from '@/api/mock/categories';
import { ftIn, metresToFt } from '@/lib/calc';
import { track } from '@/lib/analytics';
import { imageUrl } from '@/lib/texture';

/**
 * PRD §5 Door B — four steps, one question per screen, back always available,
 * every step skippable. F-3.5 is the important one: skipping widens the result
 * set rather than blocking it, so a customer who does not know their budget
 * still reaches a shortlist.
 *
 * The output is not a filtered list. It is a shortlist where the quantity is
 * already worked out per product (F-3.6) — that is the wow moment and the
 * reason the enquiry gets sent.
 */

export interface WizardAnswers {
  room?: string;
  areas: { label: string; length: string; width: string }[];
  unit: 'ftin' | 'ft' | 'm';
  lengthIn: string[];
  widthIn: string[];
  colours: string[];
  budget?: string;
}

const EMPTY: WizardAnswers = {
  areas: [{ label: 'Area 1', length: '', width: '' }],
  unit: 'ftin',
  lengthIn: [''],
  widthIn: [''],
  colours: [],
};

export default function Wizard() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { house } = useApp();
  const [step, setStep] = useState(0);
  const [a, setA] = useState<WizardAnswers>(EMPTY);

  useEffect(() => { track('wizard_start'); }, []);
  useEffect(() => { track('wizard_step', { step: step + 1 }); }, [step]);

  const set = (patch: Partial<WizardAnswers>) => setA((prev) => ({ ...prev, ...patch }));

  /** Converts whatever the customer typed into decimal feet (F-3.2). */
  const areaSqft = useMemo(() => {
    return a.areas.reduce((sum, row, i) => {
      const L = parseFloat(row.length || '0');
      const W = parseFloat(row.width || '0');
      if (!L || !W) return sum;
      if (a.unit === 'm') return sum + metresToFt(L) * metresToFt(W);
      if (a.unit === 'ft') return sum + L * W;
      return sum + ftIn(L, parseFloat(a.lengthIn[i] || '0')) * ftIn(W, parseFloat(a.widthIn[i] || '0'));
    }, 0);
  }, [a]);

  const steps = [t('stepRoom'), t('stepSize'), t('stepColour'), t('stepBudget')];
  const canAdvance = step === 1 ? areaSqft > 0 : true;

  function finish() {
    track('wizard_complete', { room: a.room ?? 'any', sqft: Math.round(areaSqft) });
    const q = new URLSearchParams();
    if (a.room) q.set('room', a.room);
    if (a.colours.length) q.set('colour', a.colours.join(','));
    if (a.budget) q.set('budget', a.budget);
    q.set('sqft', areaSqft.toFixed(2));
    q.set('areas', JSON.stringify(a.areas.map((row, i) => ({
      label: row.label,
      l: a.unit === 'm' ? metresToFt(parseFloat(row.length || '0'))
        : a.unit === 'ft' ? parseFloat(row.length || '0')
        : ftIn(parseFloat(row.length || '0'), parseFloat(a.lengthIn[i] || '0')),
      w: a.unit === 'm' ? metresToFt(parseFloat(row.width || '0'))
        : a.unit === 'ft' ? parseFloat(row.width || '0')
        : ftIn(parseFloat(row.width || '0'), parseFloat(a.widthIn[i] || '0')),
    }))));
    navigate('/shortlist?' + q.toString());
  }

  return (
    <>
      <TopBar back title={t('wizardTitle')} subtitle={'Step ' + (step + 1) + ' of 4'} />

      {/* Progress */}
      <div className="flex gap-1.5 px-4 pb-1 pt-2" aria-hidden>
        {steps.map((_, i) => (
          <span
            key={i}
            className={'h-1 flex-1 rounded-pill transition-colors ' + (i <= step ? 'bg-accent' : 'bg-line')}
          />
        ))}
      </div>

      <main className="px-4 pt-5">
        <h1 className="font-display text-h1">{steps[step]}</h1>

        {/* ── Step 1 — room ─────────────────────────────────────────────── */}
        {step === 0 && (
          <>
            <p className="mt-2 text-small text-muted">
              In plain words. We will translate it into the right material.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {ROOMS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { set({ room: r.id }); setStep(1); }}
                  className={
                    'card overflow-hidden text-left transition-colors ' +
                    (a.room === r.id ? 'border-accent ring-2 ring-accent/20' : '')
                  }
                >
                  <div className="aspect-[5/3] bg-raised">
                    <img
                      src={imageUrl({
                        seed: 'wiz-' + r.id,
                        material: r.preview.material,
                        hex: r.preview.hex,
                        type: 'context',
                      }, 'thumb')}
                      alt="" width={160} height={96} loading="lazy" decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="p-3 text-small font-semibold leading-snug">
                    {lang === 'bn' ? r.labelBn : r.labelEn}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Step 2 — dimensions ───────────────────────────────────────── */}
        {step === 1 && (
          <>
            <p className="mt-2 text-small text-muted">
              Measure at floor level. Do not round — 12 ft 6 in is 12 ft 6 in.
            </p>

            <div className="mt-4">
              <Segmented
                ariaLabel="Units"
                value={a.unit}
                onChange={(u) => set({ unit: u })}
                options={[
                  { id: 'ftin' as const, label: 'ft + in' },
                  { id: 'ft' as const, label: 'feet' },
                  { id: 'm' as const, label: 'metres' },
                ]}
              />
            </div>

            <div className="mt-5 space-y-4">
              {a.areas.map((row, i) => (
                <div key={i} className="card p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <input
                      value={row.label}
                      onChange={(e) => {
                        const areas = [...a.areas];
                        areas[i] = { ...areas[i], label: e.target.value };
                        set({ areas });
                      }}
                      aria-label="Area name"
                      className="min-w-0 flex-1 border-0 bg-transparent p-0 font-display text-h3 focus:outline-none"
                    />
                    {a.areas.length > 1 && (
                      <button
                        onClick={() => {
                          set({
                            areas: a.areas.filter((_, x) => x !== i),
                            lengthIn: a.lengthIn.filter((_, x) => x !== i),
                            widthIn: a.widthIn.filter((_, x) => x !== i),
                          });
                        }}
                        aria-label={t('removeArea')}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-pill text-muted active:bg-raised"
                        style={{ minHeight: 36, minWidth: 36 }}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <NumberField
                      label={t('length')}
                      suffix={a.unit === 'm' ? 'm' : 'ft'}
                      value={row.length}
                      onChange={(v) => {
                        const areas = [...a.areas];
                        areas[i] = { ...areas[i], length: v };
                        set({ areas });
                      }}
                      placeholder="14"
                    />
                    <NumberField
                      label={t('width')}
                      suffix={a.unit === 'm' ? 'm' : 'ft'}
                      value={row.width}
                      onChange={(v) => {
                        const areas = [...a.areas];
                        areas[i] = { ...areas[i], width: v };
                        set({ areas });
                      }}
                      placeholder="12"
                    />
                    {a.unit === 'ftin' && (
                      <>
                        <NumberField
                          label="+ inches" suffix="in" max={11}
                          value={a.lengthIn[i] ?? ''}
                          onChange={(v) => {
                            const li = [...a.lengthIn]; li[i] = v; set({ lengthIn: li });
                          }}
                          placeholder="0"
                        />
                        <NumberField
                          label="+ inches" suffix="in" max={11}
                          value={a.widthIn[i] ?? ''}
                          onChange={(v) => {
                            const wi = [...a.widthIn]; wi[i] = v; set({ widthIn: wi });
                          }}
                          placeholder="0"
                        />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => set({
                areas: [...a.areas, { label: 'Area ' + (a.areas.length + 1), length: '', width: '' }],
                lengthIn: [...a.lengthIn, ''],
                widthIn: [...a.widthIn, ''],
              })}
              className="btn-secondary mt-3 w-full"
            >
              <Icon name="plus" size={18} /> {t('addAnotherArea')}
            </button>

            <p className="mt-2 text-micro text-muted">{t('lShaped')}</p>

            {areaSqft > 0 && (
              <div className="mt-5 rounded border border-line bg-surface p-4 text-center">
                <p className="eyebrow">{t('floorArea')}</p>
                <p className="mt-1 font-display text-figure">{areaSqft.toFixed(2)}</p>
                <p className="text-small text-muted">square feet</p>
              </div>
            )}
          </>
        )}

        {/* ── Step 3 — colour ───────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <p className="mt-2 text-small text-muted">
              Pick as many as you like, or skip to see everything.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-4">
              {COLOUR_SWATCHES.map((c) => {
                const on = a.colours.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => set({
                      colours: on ? a.colours.filter((x) => x !== c.id) : [...a.colours, c.id],
                    })}
                    aria-pressed={on}
                    className="flex flex-col items-center gap-2"
                  >
                    <span
                      className={
                        'relative grid h-20 w-20 place-items-center rounded-lg border-2 transition-all ' +
                        (on ? 'border-accent ring-2 ring-accent/25' : 'border-line')
                      }
                      style={{ background: c.hex }}
                    >
                      {on && (
                        <span className="grid h-6 w-6 place-items-center rounded-pill bg-accent text-white">
                          <Icon name="check" size={14} />
                        </span>
                      )}
                    </span>
                    <span className="text-small">{lang === 'bn' ? c.labelBn : c.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── Step 4 — budget ───────────────────────────────────────────── */}
        {step === 3 && (
          <>
            <p className="mt-2 text-small text-muted">
              Material only. Delivery, GST and laying are separate.
            </p>
            <div className="mt-5 space-y-2">
              {BUDGET_BANDS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { set({ budget: b.id }); }}
                  className={
                    'flex w-full items-center justify-between rounded border px-4 py-4 text-left transition-colors ' +
                    (a.budget === b.id
                      ? 'border-accent bg-accent/5'
                      : 'border-line bg-surface')
                  }
                >
                  <span className="font-display text-h3">
                    {lang === 'bn' ? b.labelBn : b.labelEn}
                  </span>
                  {a.budget === b.id && <Icon name="check" className="text-accent" />}
                </button>
              ))}
            </div>

            {areaSqft > 0 && (
              <Callout tone="neutral">
                <span className="font-medium">{areaSqft.toFixed(2)} sq ft</span> across{' '}
                {a.areas.length === 1 ? 'one area' : a.areas.length + ' areas'}. We will
                work out the boxes for each option on the next screen.
              </Callout>
            )}
          </>
        )}

        {house.length > 0 && step === 0 && (
          <button
            onClick={() => navigate('/my-house')}
            className="mt-6 flex w-full items-center gap-3 rounded border border-line bg-surface p-4 text-left"
          >
            <Icon name="home" className="text-accent" />
            <div className="min-w-0 flex-1">
              <p className="text-small font-semibold">{t('myHouse')}</p>
              <p className="text-micro text-muted">
                {house.length} {house.length === 1 ? 'area' : 'areas'} saved
              </p>
            </div>
            <Icon name="chevronRight" className="text-muted" />
          </button>
        )}

        <BarSpacer />
      </main>

      <ActionBar>
        <div className="flex gap-2">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="btn-secondary px-5">
              <Icon name="arrowLeft" size={18} />
            </button>
          )}
          {/* F-3.5 — every step is skippable, and skipping widens results. */}
          {step < 3 && (
            <button onClick={() => setStep(step + 1)} className="btn-ghost px-4 text-muted">
              {t('skip')}
            </button>
          )}
          <button
            onClick={() => (step === 3 ? finish() : setStep(step + 1))}
            disabled={!canAdvance}
            className="btn-primary flex-1"
          >
            {step === 3 ? t('showMatches') : t('next')}
          </button>
        </div>
      </ActionBar>
    </>
  );
}
