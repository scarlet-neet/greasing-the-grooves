import * as v from "valibot";

const RoutineSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty()),
  name: v.fallback(v.pipe(v.string(), v.nonEmpty()), "No Name"),
  achieved: v.fallback(v.pipe(v.number(), v.integer(), v.minValue(0)), 0),
  goal: v.fallback(v.pipe(v.number(), v.integer(), v.minValue(1)), 100),
  state: v.fallback(v.picklist(["active", "maintain"]), "active"),
  lastSet: v.nullish(v.pipe(v.string(), v.isoDateTimeSecond()), undefined),
});

// The schema is the single source of truth for the shape of a routine.
export type Routine = v.InferOutput<typeof RoutineSchema>;

const parseRoutines = (raw: unknown): Routine[] =>
  v.parse(v.fallback(v.array(v.unknown()), []), raw).flatMap((item) => {
    const result = v.safeParse(RoutineSchema, item);
    if (!result.success && import.meta.env.DEV) {
      console.warn("Dropped invalid routine", item, v.flatten(result.issues));
    }
    return result.success ? [result.output] : [];
  });

const read = (key: string): unknown => {
  const stored = localStorage.getItem(key);
  if (stored === null) return undefined;
  try {
    return JSON.parse(stored);
  } catch {
    return undefined;
  }
};

const set = (schemaName: string, value: unknown) => {
  localStorage.setItem(schemaName, JSON.stringify(value));
  return true;
};

export const routines = {
  getAll: () => parseRoutines(read("routines")),
  store: (value: Routine) => {
    const safe = v.safeParse(RoutineSchema, value);
    if (!safe.success) return false;

    set("routines", [...routines.getAll(), safe.output]);
    return true;
  },
  /** Returns the updated routine, or `undefined` if it was not found or failed validation. */
  update: (
    id: string,
    callback: (r: Routine) => Routine,
  ): Routine | undefined => {
    const updated = parseRoutines(
      routines.getAll().map((r) => (r.id === id ? callback(r) : r)),
    );
    set("routines", updated);
    return updated.find((r) => r.id === id);
  },
  delete: (id: string) => {
    set(
      "routines",
      routines.getAll().filter((r) => r.id !== id),
    );
    return true;
  },
};

export const db = {
  routines: routines,
};

export const doneMaintainRoutine = (routine: Routine) => {
  routines.update(routine.id, (draft) => {
    draft.achieved += 1;
    draft.lastSet = new Date().toISOString().slice(0, 19);
    return draft
  })

  return { status: "success", message: `${routine.name} maintain is done for today, back tomorrow.` }
}
