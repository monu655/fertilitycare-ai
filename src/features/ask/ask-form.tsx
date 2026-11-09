"use client";

import { useActionState } from "react";
import { AlertTriangle, Check, ExternalLink, Minus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, inputStyles } from "@/components/ui/field";
import { askAction, type AskState, type AskView } from "./actions";
import { MAX_QUESTION_LENGTH, explainFallback } from "./constants";

const initial: AskState = {};

export function AskForm({ defaultQuestion }: { defaultQuestion: string }) {
  const [state, action, pending] = useActionState(askAction, initial);
  const result = state.result;

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-3" noValidate>
        <Field
          id="ask-question"
          label="Your question"
          hint={`Do not type your name, phone number or other personal details. Up to ${MAX_QUESTION_LENGTH} characters.`}
          error={state.errors?.question}
        >
          {(aria) => (
            <textarea
              {...aria}
              name="question"
              rows={3}
              maxLength={MAX_QUESTION_LENGTH}
              defaultValue={state.question ?? defaultQuestion}
              placeholder="for example: Does smoking affect sperm?"
              className={`${inputStyles} py-2`}
            />
          )}
        </Field>
        <Button type="submit" loading={pending}>
          Ask
        </Button>
        {state.message && (
          <p role="alert" className="rounded-lg bg-danger-bg p-3 text-sm font-medium text-danger">
            {state.message}
          </p>
        )}
      </form>

      {result && (
        <section aria-live="polite" aria-label="Answer" className="space-y-4" data-testid="ask-result" data-kind={result.kind}>
          {result.kind === "urgent" ? (
            <div role="alert" className="rounded-[14px] border-2 border-danger bg-danger-bg p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-danger">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" /> Seek urgent care
              </h2>
              <p className="mt-2 text-sm font-medium text-text">{result.message}</p>
            </div>
          ) : (
            <Card className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {result.mode === "ai" && <Badge tone="teal">AI-assisted, checked against sources</Badge>}
                {result.mode === "sources" && <Badge tone="neutral">Answered from sources only</Badge>}
                {result.kind === "refused" && <Badge tone="warning">Outside what this app does</Badge>}
                {result.kind === "no_answer" && <Badge tone="neutral">No sourced answer</Badge>}
              </div>
              <p className="text-sm">{result.message}</p>
              {result.answer && <p className="rounded-lg bg-teal-light p-4 text-sm text-navy">{result.answer}</p>}
              {result.fallbackReason && (
                <p className="rounded-lg bg-warning-bg p-3 text-xs text-warning" data-testid="ask-fallback">
                  AI was tried but its answer was not used. {explainFallback(result.fallbackReason)} Showing the sources instead.
                </p>
              )}
              {result.kind === "answer" && <Transparency result={result} />}
            </Card>
          )}

          {result.passages.map((p) => (
            <Card key={p.id} className="space-y-2">
              <h3 className="font-semibold text-navy">{p.topic}</h3>
              <p className="text-sm">{p.text}</p>
              <ul className="space-y-1 text-sm">
                {p.sources.map((s) => (
                  <li key={s.id}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 font-medium text-teal-dark underline">
                      {s.title}
                      <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                    <span className="block text-xs text-muted">{s.organization}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}

          <p className="text-xs text-muted">
            Educational information only. It is not medical advice and not a diagnosis. Please speak with a qualified healthcare
            professional about your own situation.
          </p>
        </section>
      )}
    </div>
  );
}

const STATUS_TEXT = { passed: "Passed", failed: "Failed", skipped: "Not run" } as const;

// Shows HOW the answer was checked and WHAT was sent out. Both are plain facts from the server.
function Transparency({ result }: { result: AskView }) {
  const receipt = result.receipt;
  return (
    <div className="space-y-2 border-t border-border pt-3" data-testid="transparency">
      {result.checks && (
        <details className="text-sm" data-testid="safety-checks">
          <summary className="cursor-pointer font-medium text-navy">Safety checks on the AI reply</summary>
          <ul className="mt-2 space-y-1">
            {result.checks.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                {c.status === "passed" && <Check className="h-4 w-4 text-success" aria-hidden="true" />}
                {c.status === "failed" && <X className="h-4 w-4 text-danger" aria-hidden="true" />}
                {c.status === "skipped" && <Minus className="h-4 w-4 text-muted" aria-hidden="true" />}
                <span>
                  {c.label}: <strong>{STATUS_TEXT[c.status]}</strong>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">If any check fails, the AI reply is not shown and you see the plain source passages.</p>
        </details>
      )}
      {receipt && (
        <details className="text-sm" data-testid="data-receipt">
          <summary className="cursor-pointer font-medium text-navy">What was sent to an AI service</summary>
          {receipt.sentToAi ? (
            <div className="mt-2 space-y-1">
              <p>
                Sent to <strong>{receipt.provider}</strong>:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Your question: <q>{receipt.question}</q>
                  {receipt.removedDetails && " (an email address or phone number was removed first)"}
                </li>
                <li>{receipt.passageTopics?.length ?? 0} passages from our source library: {receipt.passageTopics?.join("; ")}</li>
              </ul>
              <p className="text-xs text-muted">
                Not sent: your name, your email, your assessment answers, your other questions. We do not save your question.
              </p>
            </div>
          ) : (
            <p className="mt-2">Nothing was sent to any AI service. This answer was put together on our own server from the source passages.</p>
          )}
        </details>
      )}
    </div>
  );
}
