import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Category, Supplier, Manufacturer, Season, Size, Color } from './types';

interface Catalog {
  categories: Category[];
  suppliers: Supplier[];
  manufacturers: Manufacturer[];
  seasons: Season[];
  sizes: Size[];
  colors: Color[];
  loading: boolean;
}

let cache: Catalog | null = null;
const listeners = new Set<(c: Catalog) => void>();

async function fetchAndUpdateCache() {
  const loading: Catalog = {
    categories: [],
    suppliers: [],
    manufacturers: [],
    seasons: [],
    sizes: [],
    colors: [],
    loading: true,
  };
  listeners.forEach((l) => l(loading));

  const [cat, sup, man, sea, siz, col] = await Promise.all([
    supabase.from('categories').select('*').order('name').then((r) => r.data ?? []),
    supabase.from('suppliers').select('*').order('name').then((r) => r.data ?? []),
    supabase.from('manufacturers').select('*').order('name').then((r) => r.data ?? []),
    supabase.from('seasons').select('*').order('name').then((r) => r.data ?? []),
    supabase.from('sizes').select('*').order('sort_order').then((r) => r.data ?? []),
    supabase.from('colors').select('*').order('name').then((r) => r.data ?? []),
  ]);
  cache = {
    categories: cat as Category[],
    suppliers: sup as Supplier[],
    manufacturers: man as Manufacturer[],
    seasons: sea as Season[],
    sizes: siz as Size[],
    colors: col as Color[],
    loading: false,
  };
  listeners.forEach((l) => l(cache!));
}

export function useCatalog(): Catalog {
  const [state, setState] = useState<Catalog>(
    cache ?? {
      categories: [],
      suppliers: [],
      manufacturers: [],
      seasons: [],
      sizes: [],
      colors: [],
      loading: true,
    }
  );

  useEffect(() => {
    listeners.add(setState);
    if (cache) {
      setState(cache);
      return () => { listeners.delete(setState); };
    }
    fetchAndUpdateCache();
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return state;
}

/** Clear the cache and immediately re-fetch for all mounted useCatalog() hooks. */
export function clearCatalogCache() {
  cache = null;
  fetchAndUpdateCache();
}

export function categoryName(id: string | null, list: Category[]): string {
  if (!id) return '—';
  return list.find((c) => c.id === id)?.name_ar ?? list.find((c) => c.id === id)?.name ?? '—';
}

export function supplierName(id: string | null, list: Supplier[]): string {
  if (!id) return '—';
  return list.find((s) => s.id === id)?.name ?? '—';
}

export function manufacturerName(id: string | null, list: Manufacturer[]): string {
  if (!id) return '—';
  return list.find((m) => m.id === id)?.name ?? '—';
}

export function seasonName(id: string | null, list: Season[]): string {
  if (!id) return '—';
  return list.find((s) => s.id === id)?.name_ar ?? list.find((s) => s.id === id)?.name ?? '—';
}

export function sizeName(id: string | null, list: Size[]): string {
  if (!id) return '—';
  return list.find((s) => s.id === id)?.name_ar ?? list.find((s) => s.id === id)?.name ?? '—';
}

export function colorName(id: string | null, list: Color[]): string {
  if (!id) return '—';
  return list.find((c) => c.id === id)?.name_ar ?? list.find((c) => c.id === id)?.name ?? '—';
}
