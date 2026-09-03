import { useEffect, useState } from 'react'

// Presentation choices a presenter makes once and should not have to make again
// after a reload. Reading is guarded because a locked-down browser can throw on
// localStorage rather than merely returning null.
const readStored = <T>(key: string, fallback: T, store: Storage): T => {
  try {
    const raw = store.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

const useStored = <T>(key: string | undefined, fallback: T, store: () => Storage | undefined) => {
  const [value, setValue] = useState<T>(() => {
    const available = store()
    return key && available ? readStored(key, fallback, available) : fallback
  })

  useEffect(() => {
    try {
      const available = store()
      if (key && available) available.setItem(key, JSON.stringify(value))
    } catch {
      // A presenter's layout preference is not worth failing a render over.
    }
  }, [key, store, value])

  return [value, setValue] as const
}

export function usePersistentState<T>(key: string | undefined, fallback: T) {
  return useStored(key, fallback, () => (typeof window === 'undefined' ? undefined : window.localStorage))
}

/** Retains transient interface state across reloads within the current browser tab. */
export function useSessionState<T>(key: string | undefined, fallback: T) {
  return useStored(key, fallback, () => (typeof window === 'undefined' ? undefined : window.sessionStorage))
}
