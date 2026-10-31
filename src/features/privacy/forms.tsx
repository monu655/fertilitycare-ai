"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import type { ActionState } from "@/lib/action-state";
import {
  deleteAccountAction,
  deleteAssessmentDataAction,
  setAiConsentAction,
  withdrawHealthConsentAction,
} from "./actions";

const initial: ActionState = {};

export function AiConsentForm({ granted }: { granted: boolean }) {
  const [state, action, pending] = useActionState(setAiConsentAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="grant" value={granted ? "false" : "true"} />
      <Button type="submit" variant="secondary" loading={pending}>
        {granted ? "Withdraw AI notes consent" : "Allow AI notes"}
      </Button>
      <FormMessage state={state} />
    </form>
  );
}

// Stays on the page after withdrawing (only the button hides), so the confirmation message is not lost.
export function WithdrawConsentForm({ granted }: { granted: boolean }) {
  const [state, action, pending] = useActionState(withdrawHealthConsentAction, initial);
  return (
    <form action={action} className="space-y-3">
      {granted && (
        <Button type="submit" variant="secondary" loading={pending}>
          Withdraw health consent
        </Button>
      )}
      <FormMessage state={state} />
    </form>
  );
}

export function DeleteAssessmentsForm() {
  const [state, action, pending] = useActionState(deleteAssessmentDataAction, initial);
  return (
    <form action={action} className="space-y-3" noValidate>
      <Field
        id="delete-data-confirm"
        label="Type DELETE to confirm"
        hint="This cannot be undone."
        error={state.errors?.confirm}
      >
        {(aria) => <Input {...aria} name="confirm" autoComplete="off" />}
      </Field>
      <Button type="submit" variant="danger" loading={pending}>
        Delete my assessment data
      </Button>
      <FormMessage state={state} />
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccountAction, initial);
  return (
    <form action={action} className="space-y-3" noValidate>
      <Field id="delete-account-password" label="Your password" error={state.errors?.password}>
        {(aria) => <Input {...aria} name="password" type="password" autoComplete="current-password" />}
      </Field>
      <Field
        id="delete-account-confirm"
        label="Type DELETE to confirm"
        hint="Your account and all of its data will be removed permanently."
        error={state.errors?.confirm}
      >
        {(aria) => <Input {...aria} name="confirm" autoComplete="off" />}
      </Field>
      <Button type="submit" variant="danger" loading={pending}>
        Delete my account
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
