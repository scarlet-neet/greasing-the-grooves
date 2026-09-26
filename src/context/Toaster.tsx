import type { Component } from "solid-js";
import { createEffect, createStore, For } from "solid-js";

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
type Alert = { id: string; message: string; status: Status, leaving?: boolean }

const [alerts, setAlerts] = createStore<
  Alert[]
  >([]);

const remove = (id: string) => setAlerts(draft => draft.filter(d => d.id !== id));

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

  setTimeout(() => {
    setAlerts(draft => {
      const a = draft.find(d => d.id === id);
      if (a) a.leaving = true
    })
  }, duration);
};

export const Toaster: Component = () => {
  return (
    <>
      <div class="toast toast-bottom toast-center" ref={toast}>
        <For each={alerts}>
          {(alert) => <ToastItem alert={alert} />}
        </For>
      </div>
    </>
  );
};

const ToastItem: Component<{ alert: Alert }> = (props) => {
  let el!: HTMLDivElement

  createEffect(() => props.alert.leaving, (leaving) => {
    if (!leaving) return;

    Promise.allSettled(el.getAnimations().map(a => a.finished)).then(() => remove(props.alert.id))
  })

  return (
    <div
      ref={el}
      data-toastid={props.alert.id}
      class={["alert", ALERT_CLASS[props.alert.status] , { "animate-toast-end": !!props.alert.leaving }]}
      role={props.alert.status === "error" ? "alert" : "status"}
      onAnimationEnd={(e) => e.target === e.currentTarget && props.alert.leaving && remove(props.alert.id)}
    >
      <span class={[ICONS[props.alert.status], "size-5"]} />
      <span>{props.alert.message}</span>
    </div>
  )
}
