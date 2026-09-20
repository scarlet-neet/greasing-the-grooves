export interface Routine {
  id: string;
  name: string;
  achieved: number;
  goal: number;
}

const get = <T = any>(schemaName: string): T | null => {
  const stored = localStorage.getItem(schemaName);
  return stored ? JSON.parse(stored) : null
}

const set = (schemaName: string, value: any) => {
  localStorage.setItem(schemaName, JSON.stringify(value));
  return true
}

export const routines = {
  getAll: () => get<Routine[]>("routines"),
  store: (value: Routine) => {
    const stored = routines.getAll();
    set("routines", [...(stored ?? []), value]);
    return true;
  },
  update: (id: string, callback: (r: Routine) => Routine) => {
    const stored = routines.getAll();
    if (!stored) return false;
    const updated = stored.map(r => r.id === id ? callback(r) : r);
    set("routines", updated);
    return true;
  },
  delete: (id: string) => {
    const stored = routines.getAll();
    if (!stored) return false;
    const updated = stored.filter(r => r.id !== id);
    set("routines", updated);
    return true;
  },

}

export const db = {
  routines: routines,
}
