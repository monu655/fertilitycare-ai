"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import type { ActionState } from "@/lib/action-state";
import { setGentleModeAction } from "./gentle-actions";

const initial: ActionState = {};

export function GentleForm({ defaultOn }: { defaultOn: boolean }) {
  const [state, action, pending] = useActionState(setGentleModeAction, initial);
  return (
    <form action={action} className="space-y-3">
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="gentle" defaultChecked={defaultOn} className="mt-1 h-5 w-5 accent-[#0e8a7c]" />
        <span>Turn on gentle mode</span>
      </label>
      <Button type="submit" loading={pending}>
        Save gentle mode setting
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
