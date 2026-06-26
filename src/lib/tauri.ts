declare global {
  interface Window {
    __TAURI_INTERNALS__?: {
      invoke: (cmd: string, args?: Record<string, unknown>, options?: unknown) => Promise<unknown>;
    };
  }
}

export async function invoke<T = unknown>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const internals = window.__TAURI_INTERNALS__;
  if (internals?.invoke) {
    return internals.invoke(cmd, args) as Promise<T>;
  }
  throw new Error("Tauri IPC not available. Run with `cargo tauri dev` instead of `npm run dev`.");
}
