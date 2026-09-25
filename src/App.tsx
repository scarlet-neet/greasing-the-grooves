import {
  createMemo,
  createProjection,
  createSignal,
  createStore,
  For,
  refresh,
  Show,
} from "solid-js";
import "./App.css";
import { db, Routine } from "./db";

export default function App() {
  const routines = createMemo(() => db.routines.getAll());

  let newRoutineRef!: HTMLDialogElement;
  let formRef!: HTMLFormElement;

  const [validation, setValidation] = createStore({ name: "", goal: "" });
  const [updating, setUpdating] = createSignal(false);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const formData = new FormData(formRef);
    const name = (formData.get("name") as string).trim();
    const achieved = Number(formData.get("achieved-sets") as string) ?? 0;
    const goal = Number(formData.get("goal-sets") as string) ?? 0;

    let invalide = false;
    if (!name) {
      setValidation((d) => {
        d.name = "Routine name is required";
        return d;
      });
      invalide = true;
    }
    if (goal <= 0) {
      setValidation((d) => {
        d.goal = "Goal must be a positive number";
        return d;
      });
      invalide = true;
    }

    if (invalide) return;

    if (updating()) {
      const updateId = (formData.get("update-id") as string) ?? "";
      db.routines.update(updateId, (r) => {
        r.name = name;
        r.achieved = achieved;
        r.goal = goal;
        return r;
      });
      setUpdating(false);
    } else {
      db.routines.store({ name, achieved, goal, id: crypto.randomUUID() });
    }
    formRef.reset();
    newRoutineRef.close();
    refresh(routines);
  };
  const logSet = (id: string) => {
    db.routines.update(id, (r) => {
      r.achieved += 1;
      return r;
    });
    refresh(routines);
  };
  const removeRoutine = (id: string) => {
    db.routines.delete(id);
    refresh(routines);
  };

  const updateRoutine = (routine: Routine) => {
    formRef.reset();
    const inputs = formRef.elements;
    (inputs.namedItem("name") as HTMLInputElement).value = routine.name;
    (inputs.namedItem("goal-sets") as HTMLInputElement).value =
      routine.goal.toString();
    (inputs.namedItem("achieved-sets") as HTMLInputElement).value =
      routine.achieved.toString();
    (inputs.namedItem("update-id") as HTMLInputElement).value = routine.id;

    setUpdating(true);
    newRoutineRef.showModal();
  };

  let goalSetMetDialog!: HTMLDialogElement

  return (
    <>
      <main class="p-4 flex flex-col gap-4">
        <h1 class="text-xl font-bold">YOUR ROUTINE</h1>
        <For
          each={routines()}
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
                class="card bg-base-200 shadow border border-base-300 card-sm cursor-pointer hover:bg-base-100 overflow-hidden"
                style={{ "anchor-name": `--anchor-${routine.id}` }}
                onClick={() =>
                  document
                    .getElementById(`popover-${routine.id}`)
                    ?.showPopover()
                }
              >
                <div class="card-body flex-row p-0">
                  <h2 class="grow p-(--card-p,1.5rem) font-bold">
                    {routine.name}
                  </h2>
                  <div class="bg-base-300 grow  p-(--card-p,1.5rem)">
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
                    logSet(routine.id);
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
              <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
            </svg>
          </button>
        </div>
        <h2 class="text-xl font-bold">MAINTAIN <span class="badge badge-neutral ms-4 badge-sm align-middle">ONCE PER DAY</span></h2>
        <button class="btn" onClick={() => goalSetMetDialog.showModal()}>Open Alert</button>
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
              ></a>
              <p>
                <strong>Add New Workout Routine</strong>
              </p>
            </header>
            <form
              ref={formRef}
              onSubmit={handleSubmit}
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
                class="input"
              />
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
        <dialog ref={goalSetMetDialog} class="modal">
          <div class="modal-box">
            <span class="icon-[ph--check-circle-duotone] text-success size-20 block mx-auto" />
            <p class="text-xl font-bold text-center mt-2">Goal Reached</p>
            <p class="text-center text-current/70 text-sm mt-2">Pull up hit $#200 out of $#200 sets. It moved to Maintain · now it only needs one set a day to keep the groove.</p>
            <div class="modal-action justify-center">
              <button class="btn btn-secondary" onClick={() => goalSetMetDialog.close()}>Keep In Routine</button>
              <button class="btn btn-primary">Got It</button>
            </div>
          </div>
        </dialog>
      </div>
    </>
  );
}
