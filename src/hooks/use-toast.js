let subs = new Set()

export function useToast() {
  return {
    toast: (opts) => subs.forEach((fn) => fn(opts)),
  }
}

export function __toastSubscribe(fn) {
  subs.add(fn)
  return () => subs.delete(fn)
}

