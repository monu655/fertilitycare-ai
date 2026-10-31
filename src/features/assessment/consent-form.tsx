"use client";

import { useActionState } from "react";
import Link from "next/link";
import { giveConsentAction, type AssessmentFormState } from "./actions";
import { SubmitButton } from "./submit-button";

const initial: AssessmentFormState = {};

export function ConsentForm() {
  const [state, action] = useActionState(giveConsentAction, initial);
  const err = state.errors?.consentHealth;

  return (
    <form action={action} className="space-y-6" noValidate>
      <div className="space-y-4 text-sm leading-relaxed">
        <section>
          <h3 className="font-semibold text-navy">What this assessment is for</h3>
          <p className="text-muted">
            It helps you organize information about your reproductive health, read general educational material, and
            prepare questions for a healthcare professional.
          </p>
        </section>
        <section>
          <h3 className="font-semibold text-navy">What we collect</h3>
          <p className="text-muted">
            Only what you choose to answer: age range, general health, lifestyle, medical history and any test values
            you enter. Almost every question is optional.
          </p>
        </section>
        <section>
          <h3 className="font-semibold text-navy">How it is used</h3>
          <p className="text-muted">
            Your answers are stored in your account and shown only to you. They are not shared with anyone unless you
            export or share a summary yourself, after a confirmation.
          </p>
        </section>
        <section>
          <h3 className="font-semibold text-navy">Limits of AI guidance</h3>
          <p className="text-muted">
            Insights are educational. They are not a diagnosis, do not predict fertility, and do not replace a
            healthcare professional. You can withdraw consent and delete your data in the Privacy Center.
          </p>
        </section>
      </div>

      <fieldset className="space-y-3">
        <legend className="sr-only">Consent choices</legend>
        <label className="flex min-h-11 items-start gap-3 rounded-lg border border-border p-3">
          <input
            type="checkbox"
            name="consentHealth"
            className="mt-1 h-5 w-5 accent-[#0e8a7c]"
            aria-describedby={err ? "consentHealth-error" : undefined}
            aria-invalid={err ? true : undefined}
          />
          <span className="text-sm">
            <strong className="text-navy">Required:</strong> I agree that FertilityCare AI may process the health
            information I enter, for the purposes described above.
          </span>
        </label>
        {err && (
          <p id="consentHealth-error" role="alert" className="text-xs font-medium text-danger">
            {err}
          </p>
        )}
        <label className="flex min-h-11 items-start gap-3 rounded-lg border border-border p-3">
          <input type="checkbox" name="consentAi" className="mt-1 h-5 w-5 accent-[#0e8a7c]" />
          <span className="text-sm">
            <strong className="text-navy">Optional:</strong> I agree that my answers may be summarised by an AI
            service to write educational notes. If I do not agree, notes are built only from a fixed library of
            sources.
          </span>
        </label>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>Agree and continue</SubmitButton>
        <Link href="/dashboard" className="text-sm font-medium text-teal-dark underline">
          Not now
        </Link>
      </div>
    </form>
  );
}
