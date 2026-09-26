import * as v from "valibot";

export interface Routine {
  id: string;
  name: string;
  achieved: number;
  goal: number;
  state: "active" | "maintain"
}

const RoutineSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty()),
  name: v.fallback(v.pipe(v.string(), v.nonEmpty()), "No Name"),
  achieved: v.fallback(v.pipe(v.number(), v.integer(), v.minValue(0)), 0),
  goal: v.fallback(v.pipe(v.number(), v.integer(), v.minValue(1)), 100),
  state: v.fallback(v.picklist(["active", "maintain"]), "active")
})
const parseRoutines = (raw: unknown): Routine[] => v.parse(v.fallback(v.array(v.unknown()), []), raw).flatMap((item) => {
  const result = v.safeParse(RoutineSchema, item);
  if (!result.success && import.meta.env.DEV) {
    console.warn("Dropped invalid routine", item, v.flatten(result.issues));
  }
  return result.success ? [result.output] : [];
})

const read = (key: string): unknown => {
  const stored = localStorage.getItem(key);
  if (stored === null) return undefined;
  try {
    return JSON.parse(stored);
  } catch {
    return undefined;
  }
}

const set = (schemaName: string, value: unknown) => {
  localStorage.setItem(schemaName, JSON.stringify(value));
  return true
}

export const routines = {
  getAll: () => parseRoutines(read("routines")),
  store: (value: Routine) => {
    const safe = v.safeParse(RoutineSchema, value)

    const stored = routines.getAll();
    set("routines", [...(stored ?? []), safe.output]);
    return true;
  },
  update: (id: string, callback: (r: Routine) => Routine) => {
    const stored = routines.getAll();
    if (!stored) return false;

    const updated = parseRoutines(stored.map(r => r.id === id ? callback(r) : r));
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
