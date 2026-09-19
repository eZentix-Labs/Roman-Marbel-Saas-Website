import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import { KEYS, read, write } from '@/lib/storage';
import type { AreaInput, CalcItemInput } from '@/types';

/**
 * Everything the customer builds up before they identify themselves. PRD §5 is
 * explicit that we never ask for an account before showing anything, so all of
 * this lives in the browser and only becomes a server record at enquiry time.
 */

/** One room in the My House list (PRD F-5.5). */
export interface HouseArea {
  id: string;
  label: string;
  productId: string;
  variantId?: string;
  areas: AreaInput[];
  wastagePct?: number;
  includeSkirting: boolean;
  includeAdhesive: boolean;
  includeGrout: boolean;
  includeCutting: boolean;
}

interface AppState {
  pin: string;
  setPin: (p: string) => void;

  house: HouseArea[];
  addToHouse: (a: Omit<HouseArea, 'id'>) => string;
  updateHouseArea: (id: string, patch: Partial<HouseArea>) => void;
  removeHouseArea: (id: string) => void;
  clearHouse: () => void;

  compare: string[];
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;

  recent: string[];
  noteView: (productId: string) => void;
}

const Ctx = createContext<AppState | null>(null);

const uid = () => 'a-' + Math.random().toString(36).slice(2, 9);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [pin, setPinState] = useState(() => read<string>(KEYS.pin, ''));
  const [house, setHouse] = useState<HouseArea[]>(() => read<HouseArea[]>(KEYS.myHouse, []));
  const [compare, setCompare] = useState<string[]>(() => read<string[]>(KEYS.compare, []));
  const [recent, setRecent] = useState<string[]>(() => read<string[]>(KEYS.recent, []));

  useEffect(() => { write(KEYS.myHouse, house); }, [house]);
  useEffect(() => { write(KEYS.compare, compare); }, [compare]);
  useEffect(() => { write(KEYS.recent, recent); }, [recent]);

  const setPin = useCallback((p: string) => {
    setPinState(p);
    write(KEYS.pin, p);
  }, []);

  const addToHouse = useCallback((a: Omit<HouseArea, 'id'>) => {
    const id = uid();
    setHouse((h) => [...h, { ...a, id }]);
    return id;
  }, []);

  const updateHouseArea = useCallback((id: string, patch: Partial<HouseArea>) => {
    setHouse((h) => h.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const removeHouseArea = useCallback((id: string) => {
    setHouse((h) => h.filter((a) => a.id !== id));
  }, []);

  const clearHouse = useCallback(() => setHouse([]), []);

  const toggleCompare = useCallback((productId: string) => {
    setCompare((c) =>
      c.includes(productId)
        ? c.filter((x) => x !== productId)
        // PRD F-2.6 — up to 3. Beyond that the table stops being readable on a phone.
        : c.length >= 3 ? c : [...c, productId],
    );
  }, []);

  const clearCompare = useCallback(() => setCompare([]), []);

  const noteView = useCallback((productId: string) => {
    setRecent((r) => [productId, ...r.filter((x) => x !== productId)].slice(0, 12));
  }, []);

  const value = useMemo<AppState>(() => ({
    pin, setPin,
    house, addToHouse, updateHouseArea, removeHouseArea, clearHouse,
    compare, toggleCompare, clearCompare,
    recent, noteView,
  }), [
    pin, setPin, house, addToHouse, updateHouseArea, removeHouseArea, clearHouse,
    compare, toggleCompare, clearCompare, recent, noteView,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside AppStateProvider');
  return ctx;
}

/** Turns a My House row into the calculator's item shape. */
export const houseAreaToCalcItem = (a: HouseArea): CalcItemInput => ({
  productId: a.productId,
  variantId: a.variantId,
  areas: a.areas,
  wastagePctOverride: a.wastagePct,
  includeSkirting: a.includeSkirting,
  includeAdhesive: a.includeAdhesive,
  includeGrout: a.includeGrout,
  includeCutting: a.includeCutting,
});
