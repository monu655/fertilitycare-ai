"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const initial: FormState = {};

export function SignInForm() {
  const [state, action, pending] = useActionState(signInAction, initial);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && (
        <p role="alert" className="rounded-lg bg-danger-bg p-3 text-sm font-medium text-danger">
          {state.message}
        </p>
      )}
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
      <Field id="password" label="Password" error={state.errors?.password}>
        {(aria) => <Input {...aria} name="password" type="password" autoComplete="current-password" required />}
      </Field>
      <div className="text-right text-sm">
        <Link href="/forgot-password" className="font-medium text-teal-dark underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" className="w-full" loading={pending}>
        Sign in
      </Button>
      <p className="text-center text-sm text-muted">
        No account yet?{" "}
        <Link href="/sign-up" className="font-medium text-teal-dark underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
