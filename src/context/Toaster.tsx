import type { Component } from "solid-js";
import { createStore, For } from "solid-js";

const ICONS = {
  success: "icon-[ph--check-fat-fill]",
  error: "icon-[ph--x-circle]",
  warning: "icon-[ph--warning]",
};

const ALERT_CLASS = {
  success: "alert-success",
  error: "alert-error",
  warning: "alert-warning",
};

const STATUS = ["success", "error", "warning"] as const;

type Status = (typeof STATUS)[number];

const [alerts, setAlerts] = createStore<
  { id: string; message: string; status: Status }[]
>([]);
let toast!: HTMLDivElement;
export const notify = (
  message: string,
  status: Status = "success",
  duration = 3000,
) => {
  const id = crypto.randomUUID();
  setAlerts((draft) => {
    draft.push({ id, message, status });
  });

  const remove = () => setAlerts((draft) => draft.filter((d) => d.id !== id));
  setTimeout(() => {
    const alert = toast.querySelector<HTMLDivElement>(`[data-toastid="${id}"]`);
    if (alert) {
      alert.classList.add("animate-toast-end");
      alert.addEventListener("animationend", () => {
        remove();
      });
    } else {
      remove();
    }
  }, duration);
};

export const Toaster: Component = () => {
  return (
    <>
      <div class="toast toast-bottom toast-center" ref={toast}>
        <For each={alerts}>
          {(alert) => (
            <div
              data-toastid={alert.id}
              class={["alert", ALERT_CLASS[alert.status]]}
              role="alert"
            >
              <span class={[ICONS[alert.status], "size-5"]} />
              <span>{alert.message}</span>
            </div>
          )}
        </For>
      </div>
    </>
  );
};
