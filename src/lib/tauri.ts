declare global {
  interface Window {
    __TAURI_INTERNALS__?: {
      invoke: (cmd: string, args?: Record<string, unknown>, options?: unknown) => Promise<unknown>;
      convertFileSrc: (filePath: string, protocol?: string) => string;
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

export function convertFileSrc(filePath: string): string {
  const internals = window.__TAURI_INTERNALS__;
  if (internals?.convertFileSrc) {
    return internals.convertFileSrc(filePath);
  }
  return filePath;
}
