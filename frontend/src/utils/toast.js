let toastCount = 0;

const listeners = new Set();

function emit(toast) {
  listeners.forEach((fn) => fn(toast));
}

export function subscribeToToasts(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function toast(message, type = "success") {
  const id = ++toastCount;
  emit({ id, message, type });
  setTimeout(() => {
    emit({ id, remove: true });
  }, 4000);
}

export const getApiErrorMessage = (err, fallback = "Something went wrong") =>
  err?.response?.data?.message || err?.message || fallback;
