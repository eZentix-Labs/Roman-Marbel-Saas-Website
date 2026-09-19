import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { TopBar, Footer, LargeTitle } from '@/components/layout/AppShell';
import { ProductCard, ProductRow } from '@/components/catalogue/ProductCard';
import { FilterSheet } from '@/components/catalogue/FilterSheet';
import { GridSkeleton, Icon, Segmented, Sheet } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useApp } from '@/state/AppState';
import { getProducts, type ProductQuery } from '@/api/client';
import { ROOMS } from '@/api/mock/categories';
import { track } from '@/lib/analytics';
import type { Product } from '@/types';

const PAGE = 12;

/**
 * PRD F-2.1/F-2.7 — 2-column image-dominant grid, infinite scroll with skeleton
 * placeholders, no pagination. P2 (the contractor) gets a dense list view
 * instead: PRD §4 is explicit that he is a minority of users and a majority of
 * volume, so the power-user path must not be optimised away.
 */
export default function Catalogue() {
  const { t, lang } = useI18n();
  const { compare, toggleCompare, clearCompare } = useApp();
  const [params, setParams] = useSearchParams();

  const [query, setQuery] = useState<ProductQuery>(() => ({
    room: params.get('room') ?? undefined,
    application: params.get('room')
      ? ROOMS.find((r) => r.id === params.get('room'))?.applications
      : undefined,
    category: params.get('category') ?? undefined,
    q: params.get('q') ?? undefined,
    sort: 'relevance',
    pageSize: PAGE,
  }));

  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [searchOpen, setSearchOpen] = useState(Boolean(params.get('q')));

  const sentinel = useRef<HTMLDivElement>(null);

  const load = useCallback(async (q: ProductQuery, p: number, replace: boolean) => {
    setLoading(true);
    const r = await getProducts({ ...q, page: p, pageSize: PAGE });
    if (r.data) {
      setItems((prev) => (replace ? r.data!.items : [...prev, ...r.data!.items]));
      setTotal(r.data.total);
      setHasMore(r.data.hasMore);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setPage(1);
    load(query, 1, true);
  }, [query, load]);

  // Infinite scroll. The sentinel sits one screen below the fold so the next
  // page is already in flight by the time the customer reaches it.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || loading) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const next = page + 1;
        setPage(next);
        load(query, next, false);
      }
    }, { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, page, query, load]);

  const applyQuery = (q: ProductQuery) => {
    setQuery(q);
    const next = new URLSearchParams();
    if (q.room) next.set('room', q.room);
    if (q.category) next.set('category', q.category);
    if (q.q) next.set('q', q.q);
    setParams(next, { replace: true });
    track('filter_applied', {
      colour: q.colour?.join(',') ?? '', material: q.material?.join(',') ?? '',
      room: q.room ?? '', inStockOnly: Boolean(q.inStockOnly),
    });
  };

  const activeCount = useMemo(() =>
    (query.colour?.length ?? 0) + (query.material?.length ?? 0) + (query.size?.length ?? 0) +
    (query.finish?.length ?? 0) + (query.category ? 1 : 0) + (query.room ? 1 : 0) +
    (query.inStockOnly ? 1 : 0) + (query.rateMin || query.rateMax ? 1 : 0),
  [query]);

  const room = ROOMS.find((r) => r.id === query.room);

  return (
    <>
      <TopBar
        back
        large
        title={room ? room.labelEn : t('catalogue')}
        subtitle={loading && !items.length ? undefined : total + ' products'}
        right={
          <button
            onClick={() => setSearchOpen((s) => !s)}
            aria-label={t('search')}
            aria-expanded={searchOpen}
            className="grid h-11 w-11 place-items-center rounded-pill text-hi active:bg-raised"
          >
            <Icon name="search" />
          </button>
        }
      />

      <LargeTitle sub={loading && !items.length ? undefined : total + ' products'}>
        {room ? (lang === 'bn' ? room.labelBn : room.labelEn) : t('catalogue')}
      </LargeTitle>

      {searchOpen && (
        <div className="glass sticky top-[44px] z-20 px-4 py-3">
          <form
            onSubmit={(e) => { e.preventDefault(); applyQuery({ ...query, q: search || undefined }); track('search', { q: search }); }}
          >
            <div className="relative">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="field pl-10 pr-10"
                aria-label={t('search')}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); applyQuery({ ...query, q: undefined }); }}
                  aria-label={t('clear')}
                  className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center text-muted"
                  style={{ minHeight: 36, minWidth: 36 }}
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
          </form>
          <p className="mt-1.5 text-micro text-muted">
            Bengali and Banglish both work — try <em>marbel</em>, <em>kalo</em>, <em>bathrum tils</em>.
          </p>
        </div>
      )}

      {/* Filter / sort / view bar */}
      <div className="glass sticky z-10 flex items-center gap-2 px-4 py-2"
           style={{ top: searchOpen ? 116 : 44 }}>
        <button
          onClick={() => setFiltersOpen(true)}
          className={'chip shrink-0 ' + (activeCount ? 'chip-on' : '')}
        >
          <Icon name="filter" size={16} />
          {t('filters')}{activeCount ? ' · ' + activeCount : ''}
        </button>
        <button onClick={() => setSortOpen(true)} className="chip shrink-0">
          {t('sort')}
        </button>
        <div className="ml-auto shrink-0">
          <Segmented
            ariaLabel="View"
            value={view}
            onChange={setView}
            options={[{ id: 'grid' as const, label: '▦' }, { id: 'list' as const, label: '☰' }]}
          />
        </div>
      </div>

      {room && (
        <p className="mx-4 mb-3 rounded-sm border border-line bg-surface px-3 py-2 text-micro leading-relaxed text-muted">
          <Icon name="info" size={13} className="mr-1 inline align-[-2px] text-accent" />
          {room.prefer.note}
        </p>
      )}

      <main className="px-4">
        {loading && items.length === 0 ? (
          <GridSkeleton />
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-display text-h3">{t('noResults')}</p>
            <p className="mx-auto mt-2 max-w-[28ch] text-small text-muted">{t('noResultsHelp')}</p>
            <button
              onClick={() => applyQuery({ sort: query.sort, pageSize: PAGE })}
              className="btn-secondary mt-5"
            >
              {t('clear')}
            </button>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 gap-3">
            {items.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                eager={i < 4}
                onCompare={toggleCompare}
                comparing={compare.includes(p.id)}
              />
            ))}
          </div>
        ) : (
          <div className="-mx-4 overflow-hidden border-y border-line">
            {items.map((p) => <ProductRow key={p.id} product={p} />)}
          </div>
        )}

        {loading && items.length > 0 && <div className="mt-3"><GridSkeleton count={2} /></div>}
        <div ref={sentinel} aria-hidden />

        {!hasMore && items.length > 0 && (
          <p className="py-8 text-center text-micro text-muted">
            That is everything in this selection.
          </p>
        )}
      </main>

      <Footer />

      {/* Compare tray — F-2.6 */}
      {compare.length > 0 && (
        <div
          className="fixed inset-x-0 z-30 mx-auto w-full max-w-app px-4"
          style={{ bottom: 'calc(72px + var(--sab))' }}
        >
          <div className="flex items-center gap-3 rounded-pill bg-deep px-4 py-2 text-hi shadow-card">
            <span className="text-small">{compare.length} to compare</span>
            <button onClick={clearCompare} className="ml-auto text-micro text-hi/60 underline">
              {t('clear')}
            </button>
            <Link
              to="/compare"
              onClick={() => track('compare_open', { count: compare.length })}
              className="rounded-pill bg-ink px-4 py-1.5 text-small font-semibold text-hi"
              style={{ minHeight: 36 }}
            >
              {t('compare')}
            </Link>
          </div>
        </div>
      )}

      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        query={query}
        onApply={applyQuery}
      />

      <Sheet open={sortOpen} onClose={() => setSortOpen(false)} title={t('sort')}>
        <ul className="divide-y divide-line">
          {([
            ['relevance', t('sortRelevance')],
            ['rate_asc', t('sortRateAsc')],
            ['rate_desc', t('sortRateDesc')],
            ['newest', t('sortNewest')],
          ] as const).map(([id, label]) => (
            <li key={id}>
              <button
                onClick={() => { applyQuery({ ...query, sort: id }); setSortOpen(false); }}
                className="flex w-full items-center justify-between py-4 text-left"
              >
                <span className={query.sort === id ? 'font-semibold' : ''}>{label}</span>
                {query.sort === id && <Icon name="check" className="text-accent" />}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}
