import { useState } from 'react';
import { Sheet, Switch } from '@/components/ui';
import { useI18n } from '@/i18n';
import { BUDGET_BANDS, CATEGORIES, COLOUR_SWATCHES, ROOMS } from '@/api/mock/categories';
import { FINISH_LABEL, MATERIAL_LABEL } from '@/lib/format';
import type { ProductQuery } from '@/api/client';

export const SIZES = ['600x600', '800x800', '600x1200', '300x300', '300x600', '400x400', '600x900', '200x1200', 'Slab'];
const MATERIALS = ['marble', 'granite', 'vitrified', 'ceramic', 'other'];
const FINISHES = ['polished', 'honed', 'leather', 'matt', 'glossy', 'anti_skid', 'rustic'];

/**
 * PRD F-2.2 — filters live in one bottom sheet behind one button, never spread
 * across the screen. F-2.4 — colour is a swatch grid, not a list of words,
 * because nobody picks "beige" from a dropdown when choosing a floor.
 */
export function FilterSheet({
  open, onClose, query, onApply,
}: {
  open: boolean; onClose: () => void;
  query: ProductQuery; onApply: (q: ProductQuery) => void;
}) {
  const { t, lang } = useI18n();
  const [draft, setDraft] = useState<ProductQuery>(query);

  // Re-seed the draft each time the sheet opens so a cancelled edit is discarded.
  const [seen, setSeen] = useState(false);
  if (open && !seen) { setDraft(query); setSeen(true); }
  if (!open && seen) setSeen(false);

  const toggle = (key: keyof ProductQuery, value: string) => {
    setDraft((d) => {
      const list = (d[key] as string[] | undefined) ?? [];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...d, [key]: next.length ? next : undefined };
    });
  };

  const on = (key: keyof ProductQuery, value: string) =>
    ((draft[key] as string[] | undefined) ?? []).includes(value);

  const activeCount =
    (draft.colour?.length ?? 0) + (draft.material?.length ?? 0) + (draft.size?.length ?? 0) +
    (draft.finish?.length ?? 0) + (draft.application?.length ?? 0) +
    (draft.category ? 1 : 0) + (draft.inStockOnly ? 1 : 0) +
    (draft.rateMin || draft.rateMax ? 1 : 0);

  const clearAll = () =>
    setDraft({ sort: draft.sort, q: draft.q, pageSize: draft.pageSize });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('filters')}
      footer={
        <div className="flex gap-2">
          <button onClick={clearAll} className="btn-secondary flex-1">{t('clear')}</button>
          <button
            onClick={() => { onApply({ ...draft, page: 1 }); onClose(); }}
            className="btn-primary flex-[2]"
          >
            {t('apply')}{activeCount > 0 ? ' (' + activeCount + ')' : ''}
          </button>
        </div>
      }
    >
      <Group label={t('room')}>
        <div className="flex flex-wrap gap-2">
          {ROOMS.map((r) => (
            <button
              key={r.id}
              onClick={() => r.prefer && toggleRoom(r.id)}
              className={'chip ' + (draft.room === r.id ? 'chip-on' : '')}
            >
              {lang === 'bn' ? r.labelBn : r.labelEn}
            </button>
          ))}
        </div>
      </Group>

      <Group label={t('colour')}>
        <div className="grid grid-cols-4 gap-3">
          {COLOUR_SWATCHES.map((c) => (
            <button
              key={c.id}
              onClick={() => toggle('colour', c.id)}
              aria-pressed={on('colour', c.id)}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className={
                  'h-14 w-14 rounded-pill border-2 transition-all ' +
                  (on('colour', c.id)
                    ? 'border-accent ring-2 ring-accent/25'
                    : 'border-line')
                }
                style={{ background: c.hex }}
              />
              <span className="text-micro text-muted">
                {lang === 'bn' ? c.labelBn : c.labelEn}
              </span>
            </button>
          ))}
        </div>
      </Group>

      <Group label={t('material')}>
        <div className="flex flex-wrap gap-2">
          {MATERIALS.map((m) => (
            <button key={m} onClick={() => toggle('material', m)}
              className={'chip ' + (on('material', m) ? 'chip-on' : '')}>
              {MATERIAL_LABEL[m]}
            </button>
          ))}
        </div>
      </Group>

      <Group label={t('size')}>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button key={s} onClick={() => toggle('size', s)}
              className={'chip ' + (on('size', s) ? 'chip-on' : '')}>
              {s}
            </button>
          ))}
        </div>
      </Group>

      <Group label={t('finish')}>
        <div className="flex flex-wrap gap-2">
          {FINISHES.map((f) => (
            <button key={f} onClick={() => toggle('finish', f)}
              className={'chip ' + (on('finish', f) ? 'chip-on' : '')}>
              {FINISH_LABEL[f]}
            </button>
          ))}
        </div>
      </Group>

      <Group label={t('budget')}>
        <div className="flex flex-wrap gap-2">
          {BUDGET_BANDS.map((b) => {
            const active = draft.rateMin === b.min && (draft.rateMax ?? null) === b.max;
            return (
              <button
                key={b.id}
                onClick={() =>
                  setDraft((d) => (active
                    ? { ...d, rateMin: undefined, rateMax: undefined }
                    : { ...d, rateMin: b.min, rateMax: b.max ?? undefined }))
                }
                className={'chip ' + (active ? 'chip-on' : '')}
              >
                {lang === 'bn' ? b.labelBn : b.labelEn}
              </button>
            );
          })}
        </div>
      </Group>

      <Group label="Category">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setDraft((d) => ({ ...d, category: d.category === c.id ? undefined : c.id }))}
              className={'chip ' + (draft.category === c.id ? 'chip-on' : '')}
            >
              {lang === 'bn' ? c.nameBn : c.nameEn}
            </button>
          ))}
        </div>
      </Group>

      <div className="mt-3 list">
        <Switch
          label={t('inStockOnly')}
          checked={Boolean(draft.inStockOnly)}
          onChange={(v) => setDraft((d) => ({ ...d, inStockOnly: v || undefined }))}
        />
      </div>
    </Sheet>
  );

  function toggleRoom(id: string) {
    setDraft((d) => {
      if (d.room === id) return { ...d, room: undefined, application: undefined };
      const room = ROOMS.find((r) => r.id === id)!;
      return { ...d, room: id, application: room.applications };
    });
  }
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line py-4 last:border-0">
      <h3 className="eyebrow mb-3">{label}</h3>
      {children}
    </section>
  );
}
