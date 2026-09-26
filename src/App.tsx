import {
  createMemo,
  createProjection,
  createSignal,
  createStore,
  For,
  onSettled,
  refresh,
  Show,
} from "solid-js";
import * as v from "valibot";
import "./App.css";
import { db, doneMaintainRoutine, type Routine } from "./db";
import { notify, Toaster } from "./context/Toaster";

// Field names match the `name` attributes of the routine form inputs.
const RoutineFormSchema = v.object({
  "update-id": v.string(),
  name: v.pipe(v.string(), v.trim(), v.nonEmpty("Routine name is required")),
  "achieved-sets": v.pipe(
    v.string(),
    v.toNumber("Achieved sets must be a number"),
    v.integer("Achieved sets must be a whole number"),
    v.minValue(0, "Achieved sets cannot be negative"),
  ),
  "goal-sets": v.pipe(
    v.string(),
    v.toNumber("Goal must be a number"),
    v.integer("Goal must be a whole number"),
    v.minValue(1, "Goal must be a positive number"),
  ),
});

/**
 *
 * @param {Date} date1 Date object to compare, prefrelaby before the date2 param
 * @param {Date} date2 Date object to compare, prefrelaby after the date1 param
 *
 * @returns {number} days different between date1 and date2
 *
 * @example
 * ```
 *    const difference = daysBetweenDate(new Date(2000, 1, 3), new Date(2000, 1, 9));
 *
 *    console.log(difference) // expected result : 6
 * ```
 *
 * Utilities function to get the days difference between 2 date object
 *
 */
const daysBetweenDate = (date1: Date, date2: Date): number => {
  const date1Time = date1.getTime();
  const date2Time = date2.getTime();
  return Math.round((date2Time - date1Time) / 84_400_000);
}

export default function App() {
  const routines = createMemo(() => db.routines.getAll());

  let newRoutineRef!: HTMLDialogElement;
  let formRef!: HTMLFormElement;

  const [validation, setValidation] = createStore({
    name: "",
    achieved: "",
    goal: "",
  });
  const [updating, setUpdating] = createSignal(false);

  const handleRoutineFormSubmit = (e: Event) => {
    e.preventDefault();
    const result = v.safeParse(
      RoutineFormSchema,
      Object.fromEntries(new FormData(formRef)),
    );
    const errors = result.success
      ? undefined
      : v.flatten<typeof RoutineFormSchema>(result.issues).nested;

    setValidation((d) => {
      d.name = errors?.name?.[0] ?? "";
      d.achieved = errors?.["achieved-sets"]?.[0] ?? "";
      d.goal = errors?.["goal-sets"]?.[0] ?? "";
      return d;
    });

    if (!result.success) return;
    const {
      "update-id": updateId,
      name,
      "achieved-sets": achieved,
      "goal-sets": goal,
    } = result.output;

    if (updating()) {
      db.routines.update(updateId, (r) => {
        r.name = name;
        r.achieved = achieved;
        r.goal = goal;
        return r;
      });
      setUpdating(false);
    } else {
      db.routines.store({
        name,
        achieved,
        goal,
        id: crypto.randomUUID(),
        state: "active",
      });
    }
    formRef.reset();
    newRoutineRef.close();
    void refresh(routines);
  };

  let confirmPromise: ((confirmed: boolean) => void) | undefined;
  const logSet = async (routine: Routine) => {
    const updated = db.routines.update(routine.id, (r) => {
      r.achieved += 1;
      r.lastSet = new Date().toISOString().slice(0,19)
      return r;
    });

    void refresh(routines);

    if (updated === undefined || updated.achieved < updated.goal) return;

    const { promise, resolve } = Promise.withResolvers<boolean>();
    confirmPromise = resolve;
    setGoalSetMetId(routine.id);
    goalSetMetDialog.showModal();

    const confirmed = await promise;
    confirmPromise = undefined;
    if (!confirmed) return;

    db.routines.update(routine.id, (r) => {
      r.state = "maintain";
      return r;
    });

    void refresh(routines);
  };
  const removeRoutine = (id: string) => {
    db.routines.delete(id);
    void refresh(routines);
  };

  const setFormInput = (name: string, value: string) => {
    const input = formRef.elements.namedItem(name);
    if (input instanceof HTMLInputElement) input.value = value;
  };

  const updateRoutine = (routine: Routine) => {
    formRef.reset();
    setFormInput("name", routine.name);
    setFormInput("goal-sets", routine.goal.toString());
    setFormInput("achieved-sets", routine.achieved.toString());
    setFormInput("update-id", routine.id);

    setUpdating(true);
    newRoutineRef.showModal();
  };

  let goalSetMetDialog!: HTMLDialogElement;
  const [goalSetMetId, setGoalSetMetId] = createSignal("");
  const routineGoalMet = () =>
    routines().find((routine) => routine.id === goalSetMetId());

  const activeRoutines = createProjection(
    () => routines().filter((routine) => routine.state === "active"),
    [],
  );
  const maintainRoutines = createProjection(
    () => routines().filter((routine) => routine.state === "maintain"),
    [],
  );

  return (
    <>
      <Toaster />
      <main class="p-4 flex flex-col gap-4">
        <h1 class="text-xl font-bold">YOUR ROUTINE</h1>
        <For
          each={activeRoutines}
          fallback={
            <>
              <article class="card bg-base-100 shadow border border-base-300">
                <div class="card-body">
                  <header style={{ margin: "0" }}>
                    <p class="text-center">You Currently Have No Routines</p>
                  </header>
                </div>
              </article>
            </>
          }
        >
          {(routine) => (
            <>
              <article
                class="card bg-base-200 shadow border border-base-300 cursor-pointer hover:bg-base-100 overflow-hidden"
                style={{ "anchor-name": `--anchor-${routine.id}` }}
                onClick={() =>
                  document
                    .getElementById(`popover-${routine.id}`)
                    ?.showPopover()
                }
              >
                <div class="card-body flex-row p-0 divide-x divide-base-300">
                  <h2 class="grow p-(--card-p,1.5rem) font-bold">
                    {routine.name}
                  </h2>
                  <div class="grow  p-(--card-p,1.5rem)">
                    <p style={{ margin: "0" }}>
                      Achieved : {routine.achieved} Sets
                    </p>
                    <p style={{ margin: "0" }}>Goal : {routine.goal} Sets</p>
                    <progress
                      class="progress progress-secondary h-1"
                      value={(routine.achieved / routine.goal) * 100}
                      max="100"
                    />
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void logSet(routine);
                  }}
                  class="btn btn-primary w-full rounded-t-none"
                >
                  LOG SET
                </button>
              </article>
              <ul
                class="dropdown bg-base-200 shadow menu dropdown-end w-52"
                popover
                id={`popover-${routine.id}`}
                // oxlint-disable-next-line solid/style-prop
                style={{ "position-anchor": `--anchor-${routine.id}` }}
              >
                <li>
                  <button onClick={() => updateRoutine(routine)}>Edit</button>
                </li>
                <li>
                  <button onClick={() => removeRoutine(routine.id)}>
                    Delete
                  </button>
                </li>
              </ul>
            </>
          )}
        </For>
        <div class="fab">
          <button
            class="btn btn-primary btn-circle"
            onClick={() => {
              formRef.reset();
              setUpdating(false);
              newRoutineRef.showModal();
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z" />
            </svg>
          </button>
        </div>
        <Show when={maintainRoutines.length}>
          <>
            <h2 class="text-xl font-bold">
              MAINTAIN{" "}
              <span class="badge badge-neutral ms-4 badge-sm align-middle">
                ONCE PER DAY
              </span>
            </h2>
            <For each={maintainRoutines}>
              {(routine) => {
                const doneToday = (): boolean => {
                  if (!routine.lastSet) return false
                  return routine.lastSet.slice(0, 10) === new Date().toISOString().slice(0, 10);
                };
                const lastDone = (): string => {
                  if (!routine.lastSet) return ""
                  const difference = daysBetweenDate(new Date(routine.lastSet), new Date());
                  if (difference === 0) return "Last done today.";
                  if (difference === 1) return "Last done yesterday.";
                  return `Last done ${difference} ago.`
                }
                return (
                  <>
                    <article
                      class={["card bg-base-200 shadow border border-base-300 cursor-pointer overflow-hidden", !doneToday() && "hover:bg-base-100"]}
                      style={{ "anchor-name": `--anchor-${routine.id}` }}
                      onClick={() =>
                        document
                          .getElementById(`popover-${routine.id}`)
                          ?.showPopover()
                      }
                    >
                      <div class="card-body flex-row p-0 divide-x divide-base-300">
                        <div class="grow p-(--card-p,1.5rem)">
                          <h2 class="font-bold">
                            {routine.name}
                          </h2>
                          <p class="text-xs text-success font-medium mt-2">{doneToday() ? "✓ Done Today" : "Due Today"}</p>
                        </div>
                        <div class="grow  p-(--card-p,1.5rem)">
                          <p style={{ margin: "0" }}>
                            Achieved : {routine.achieved} Sets
                          </p>
                          <p style={{ margin: "0" }}>Goal : {routine.goal} Sets</p>
                          <progress
                            class="progress progress-secondary h-1"
                            value={(routine.achieved / routine.goal) * 100}
                            max="100"
                          />
                          <p class="text-xs text-current/70 mt-4">{lastDone()}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const result = doneMaintainRoutine(routine);
                          notify(result.message);
                          refresh(routines);
                        }}
                        disabled={doneToday()}
                        class="btn btn-success w-full rounded-t-none"
                      >
                        {doneToday() ? "✓ " : ""}DONE TODAY
                      </button>
                    </article>
                    <ul
                      class="dropdown bg-base-200 shadow menu dropdown-end w-52"
                      popover
                      id={`popover-${routine.id}`}
                      // oxlint-disable-next-line
                      style={{ "position-anchor": `--anchor-${routine.id}` }}
                    >
                      <li>
                        <button onClick={() => updateRoutine(routine)}>Edit</button>
                      </li>
                      <li>
                        <button onClick={() => removeRoutine(routine.id)}>
                          Delete
                        </button>
                      </li>
                    </ul>
                  </>
                )
              }}
            </For>
          </>
        </Show>
      </main>
      <div>
        <dialog ref={newRoutineRef} class="modal">
          <article class="modal-box">
            <header class="mb-6">
              <a
                style={{ cursor: "pointer" }}
                aria-label="Close"
                rel="prev"
                onClick={() => newRoutineRef.close()}
                />
              <p>
                <strong>Add New Workout Routine</strong>
              </p>
            </header>
            <form
              ref={formRef}
              onSubmit={handleRoutineFormSubmit}
              class="flex flex-col gap-4"
            >
              <input type="hidden" name="update-id" />
              <input
                type="text"
                name="name"
                placeholder="Routine Name"
                aria-label="Routine Name"
                required
                aria-invalid={validation.name !== "" ? "true" : "false"}
                class="input"
              />
              <input
                type="number"
                name="achieved-sets"
                placeholder="Achieved Sets"
                aria-label="Achieved Sets"
                min="0"
                aria-invalid={validation.achieved !== "" ? "true" : "false"}
                class="input"
              />
              <Show when={validation.achieved}>
                {(text) => <p class="text-sm text-error">{text()}</p>}
              </Show>
              <input
                type="number"
                name="goal-sets"
                placeholder="Goal Sets"
                aria-label="Goal Sets"
                min="1"
                required
                aria-invalid={validation.goal !== "" ? "true" : "false"}
                class="input"
              />
              <Show when={validation.goal}>
                {(text) => <p class="text-sm text-error">{text()}</p>}
              </Show>
              <footer class="modal-action">
                <button
                  type="button"
                  onClick={() => newRoutineRef.close()}
                  class="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary">
                  Confirm
                </button>
              </footer>
            </form>
          </article>
        </dialog>
        <dialog
          ref={goalSetMetDialog}
          class="modal"
          onClose={() => confirmPromise?.(false)}
        >
          <div class="modal-box">
            <span class="icon-[ph--check-circle-duotone] text-success size-20 block mx-auto" />
            <p class="text-xl font-bold text-center mt-2">Goal Reached</p>
            <p class="text-center text-current/70 text-sm mt-2">
              {routineGoalMet()?.name} hit {routineGoalMet()?.achieved} out of{" "}
              {routineGoalMet()?.goal} sets. It moved to Maintain · now it only
              needs one set a day to keep the groove.
            </p>
            <div class="modal-action justify-center">
              <button
                class="btn btn-secondary"
                onClick={() => goalSetMetDialog.close()}
              >
                Keep In Routine
              </button>
              <button
                class="btn btn-primary"
                onClick={() => {
                  confirmPromise?.(true);
                  goalSetMetDialog.close();
                }}
              >
                Got It
              </button>
            </div>
          </div>
        </dialog>
      </div>
    </>
  );
}
