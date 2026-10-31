import type { ActionState } from "@/lib/action-state";

// Shows the result of a server action. Success uses role="status", errors use role="alert".
export function FormMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return state.ok ? (
    <p role="status" className="rounded-lg bg-success-bg p-3 text-sm font-medium text-success">
      {state.message}
    </p>
  ) : (
    <p role="alert" className="rounded-lg bg-danger-bg p-3 text-sm font-medium text-danger">
      {state.message}
    </p>
  );
}
