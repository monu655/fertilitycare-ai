"use client";

import { useActionState } from "react";
import { startDemoAction, type DemoState } from "./actions";
import { Button } from "@/components/ui/button";

const initial: DemoState = {};

export function DemoButton() {
  const [state, action, pending] = useActionState(startDemoAction, initial);
  return (
    <form action={action} className="space-y-2">
      {state.message && (
        <p role="alert" className="rounded-lg bg-danger-bg p-3 text-sm font-medium text-danger">
          {state.message}
        </p>
      )}
      <Button type="submit" variant="secondary" className="w-full" loading={pending}>
        Try the demo (no sign-up)
      </Button>
      <p className="text-center text-xs text-muted">
        Opens a private demo account filled with made-up example answers. No real data is used.
      </p>
    </form>
  );
}
