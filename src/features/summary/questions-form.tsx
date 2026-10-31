"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import type { ActionState } from "@/lib/action-state";
import { inputStyles } from "@/components/ui/field";
import { MAX_QUESTIONS, MAX_QUESTION_LENGTH } from "@/lib/validation/privacy";
import { saveQuestionsAction } from "./actions";

const initial: ActionState = {};

export function QuestionsForm({ saved }: { saved: string[] }) {
  const [state, action, pending] = useActionState(saveQuestionsAction, initial);
  return (
    <form action={action} className="space-y-3" noValidate>
      <Field
        id="my-questions"
        label="Your own questions"
        optional
        hint={`One question per line. Up to ${MAX_QUESTIONS} questions, ${MAX_QUESTION_LENGTH} characters each. Avoid names or phone numbers.`}
        error={state.errors?.questions}
      >
        {(aria) => <textarea {...aria} name="questions" rows={4} defaultValue={saved.join("\n")} className={`${inputStyles} py-2`} />}
      </Field>
      <Button type="submit" variant="secondary" loading={pending}>
        Save questions
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
