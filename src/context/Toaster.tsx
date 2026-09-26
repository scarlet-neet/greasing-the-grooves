import type { Component } from "solid-js"
import { createOptimisticStore, createStore, For } from "solid-js"

const ICONS = {
  success: "icon-[ph--check-fat-fill]",
  error: "icon-[ph--x-circle]",
  warning: "icon-[ph--warning]"
}

export const Toaster: Component = () => {

  const [alerts, setAlerts] = createStore<{ id: string, message: string }[]>([])
  let toast!: HTMLDivElement

  const confirm = (message: string, duration = 3000) => {
    const id = crypto.randomUUID()
    setAlerts((draft) => {
      draft.push({ id, message })
    });

    const remove = () => setAlerts(draft => draft.filter(d => d.id !== id));
    setTimeout(() => {
      const alert = toast.querySelector<HTMLDivElement>(`[data-toastid="${id}"]`);
      if (alert) {
        alert.classList.add("animate-toast-end");
        alert.addEventListener("animationend", () => {
          remove()
        })
      } else {
        remove()
      }
    }, duration)
  }

  return (
    <>
    <button class="btn btn-primary" onClick={() => confirm("is it working?")}>Try</button>
    <div class="toast toast-bottom toast-center" ref={toast}>
      <For each={alerts}>
        {(alert) => (
          <div data-toastid={alert.id} class="alert alert-success" role="alert">
            <span class="icon-[ph--check-fat-fill]" />
            <span>{alert.message}</span>
          </div>
        )}
        </For>
        <div class="alert alert-success" role="alert">
          <span class="icon-[ph--check-fat-fill]" />
          <span>Message is here</span>
        </div>
      </div>
    </>
  )
}
