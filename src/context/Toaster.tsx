import type { Component } from "solid-js"
import { createOptimisticStore, createStore, For } from "solid-js"

const ICONS = {
  success: "icon-[ph--check-fat-fill]",
  error: "icon-[ph--x-circle]",
  warning: "icon-[ph--warning]"
}

export const Toaster: Component = () => {

  const [alerts, setAlerts] = createStore<{id: string, message: string}[]>([])

  const confirm = (message: string, duration = 3000) => {
    const id = crypto.randomUUID()
    setAlerts((draft) => {
      draft.push({ id, message })
    });
    setTimeout(() => {
      setAlerts(draft => draft.filter(d => d.id !== id))
    }, duration)
  }

  return (
    <>
    <button class="btn btn-primary" onClick={() => confirm("is it working?")}>Try</button>
    <div class="toast toast-bottom toast-center">
      <For each={alerts}>
        {(alert) => (
          <div class="alert alert-success" role="alert">
            <span class="icon-[ph--check-fat-fill]" />
            <span>{alert.message}</span>
          </div>
        )}
      </For>
      </div>
    </>
  )
}
