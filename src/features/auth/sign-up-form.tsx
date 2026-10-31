"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const initial: FormState = {};

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, initial);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && (
        <p role="alert" className="rounded-lg bg-danger-bg p-3 text-sm font-medium text-danger">
          {state.message}
        </p>
      )}
      <Field id="name" label="Name" error={state.errors?.name} hint="Use any name you like. It is only shown to you.">
        {(aria) => <Input {...aria} name="name" autoComplete="name" required defaultValue={state.values?.name} />}
      </Field>
      <Field id="email" label="Email address" error={state.errors?.email}>
        {(aria) => (
          <Input
            {...aria}
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            defaultValue={state.values?.email}
          />
        )}
      </Field>
      <Field id="password" label="Password" error={state.errors?.password} hint="At least 10 characters, with a letter and a number.">
        {(aria) => <Input {...aria} name="password" type="password" autoComplete="new-password" required />}
      </Field>
      <Field id="confirmPassword" label="Confirm password" error={state.errors?.confirmPassword}>
        {(aria) => <Input {...aria} name="confirmPassword" type="password" autoComplete="new-password" required />}
      </Field>
      <p className="text-xs text-muted">
        You do not need to share any health information to create an account. Health questions come later and are optional.
      </p>
      <Button type="submit" className="w-full" loading={pending}>
        Create account
      </Button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-teal-dark underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
