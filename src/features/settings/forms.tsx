"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import type { ActionState } from "@/lib/action-state";
import { changePasswordAction, updateNameAction } from "./actions";

const initial: ActionState = {};

export function NameForm({ currentName }: { currentName: string }) {
  const [state, action, pending] = useActionState(updateNameAction, initial);
  return (
    <form action={action} className="space-y-3" noValidate>
      <Field id="settings-name" label="Name" error={state.errors?.name}>
        {(aria) => <Input {...aria} name="name" defaultValue={currentName} maxLength={80} autoComplete="name" />}
      </Field>
      <Button type="submit" loading={pending}>
        Save name
      </Button>
      <FormMessage state={state} />
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initial);
  return (
    <form action={action} className="space-y-3" noValidate>
      <Field id="settings-current" label="Current password" error={state.errors?.currentPassword}>
        {(aria) => <Input {...aria} name="currentPassword" type="password" autoComplete="current-password" />}
      </Field>
      <Field
        id="settings-new"
        label="New password"
        hint="At least 10 characters, with a letter and a number."
        error={state.errors?.newPassword}
      >
        {(aria) => <Input {...aria} name="newPassword" type="password" autoComplete="new-password" />}
      </Field>
      <Field id="settings-confirm" label="Confirm new password" error={state.errors?.confirmPassword}>
        {(aria) => <Input {...aria} name="confirmPassword" type="password" autoComplete="new-password" />}
      </Field>
      <Button type="submit" loading={pending}>
        Change password
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
