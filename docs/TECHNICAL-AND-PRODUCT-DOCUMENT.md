# FertilityCare AI: technical and product document

Future Health Digital Innovation Challenge, focus area: [Fertility] Male Reproductive Health.
Live prototype: https://fertilitycare-ai-liard.vercel.app

## 1. Problem statement

Many men look for information about fertility late, privately and with little guidance. Search results mix medical sources with commercial claims. Appointments are short, and people often arrive without a record of their habits or past test values. Tools that give a "score" or a verdict can cause anxiety or false reassurance and should not be built without clinical validation.

## 2. Solution overview

FertilityCare AI is a privacy-first education and preparation app. It does not diagnose, predict fertility or recommend medicines. It helps a person (1) record their own habits and optional lab values over time, (2) see plain, sourced observations about those records, and (3) walk into an appointment with a structured summary and good questions.

## 3. How it answers the review team's feedback

| Feedback | What was added |
| --- | --- |
| Longitudinal lifestyle tracking | Lifestyle Tracker: daily entries, edit and delete, calendar, weekly and monthly summaries, interactive charts, period comparison. |
| Optional semen analysis and hormone logs | Medical Reports: semen parameters, testosterone, FSH, LH, prolactin, estradiol, with date, unit, the lab's own range (typed by the person) and notes. |
| AI analysis of lifestyle patterns and health information | AI Fertility Intelligence: rules engine plus an optional AI summary under separate consent, data minimisation, reply validation and a visible "what was sent" receipt. |
| Explainable educational insights | Every observation shows the observation, the data behind it, an explanation, practical ideas, limits, when to consult a professional and its sources. |
| Structured preparation for specialist visits | Consultation Summary now has selectable sections: assessment, 30-day habit summary, changes over time, lab values, and questions for the specialist. |
| (Extra) Lifestyle coaching | Weekly goals with day counts and history. |

## 4. New innovations

1. **A rules engine that explains itself and an AI layer that can only rewrite its facts.** The analysis is deterministic. The AI cannot add numbers, causes or verdicts, and any reply that does so is discarded.
2. **Consent per purpose, per request.** A separate AI tracking-data consent, plus per-request ticking of what to include. Lab values are off unless ticked.
3. **Receipt of what was sent.** The person sees the exact sentences that left the server, or a statement that nothing did.
4. **"Not recorded" is not zero.** Empty boxes are stored as empty. Averages count only recorded days and always state how many.
5. **No verdict wording.** Changes are described as numbers (for example "6.5 before, 7 recently"), never as better or worse, and the app supplies no normal ranges.

## 5. AI intelligence architecture

1. The server loads the signed-in person's own rows (tracker, assessment, labs). The browser never supplies a user id.
2. `buildPatternInsights` (pure function) creates insights and a list of facts, each tagged with a group: habits, assessment, labs. A pattern needs at least 5 recorded days.
3. The rules summary and questions are always produced.
4. If the server has AI switched on with a key, the person has AI tracking-data consent and ticks groups, the facts of the ticked groups are sent (no names, emails, notes or dates). Labs are included only if ticked.
5. The reply is parsed as JSON and checked: format, safety wording, numbers present in the sent facts, no good/bad wording. Failing any check falls back to the rules summary with a reason.
6. The result is shown with the checks and the receipt. Nothing from the AI reply is stored. An audit event records only that a summary was requested.

Providers: Groq (`openai/gpt-oss-120b`) or Anthropic. The same provider layer is used by Ask a Question.

## 6. Lifestyle tracking methodology

- Measures: sleep hours, bedtime, stress (own 1 to 5 rating), meal pattern, fruit and vegetable portions, exercise minutes, sitting hours, heat exposure minutes. All optional. There is no free-text field in daily entries.
- One entry per person per day. Saving the same day again replaces it (this is how edit works).
- Summaries: weekly (Monday start) and monthly buckets with the number of days logged. Period comparison uses the latest 14 days against the 14 before and needs at least 3 recorded days in each.
- Bedtime consistency: the spread between earliest and latest bedtime, with times after midnight counted as late. Needs at least 3 nights.
- Charts have a text table carrying the same numbers.

## 7. Biomarker tracking

Semen volume, concentration, total count, total and progressive motility, morphology; total testosterone, FSH, LH, prolactin, estradiol. Units are chosen from a fixed list per marker. The app **has no reference ranges of its own**. If the person types the range printed on their report it is shown back as typed. The page states that laboratory results need interpretation by a qualified professional. Latest and previous values are shown as numbers only.

## 8. Privacy and security

- Every private row has a user id; every query and action filters by the signed-in user.
- Health consent is required before tracker or lab data can be saved.
- Zod validation on all inputs; rate limits on saves and AI summaries (in memory).
- Export (text or JSON) and delete include tracking data, lab values and goals. Deleting the account removes everything.
- Audit events store who did what and when, never health content.
- Passwords are hashed with bcrypt. No compliance with HIPAA, GDPR or other regimes is claimed; no audit has been done.

## 9. Medical safety

No diagnosis, no fertility prediction, no medicines or doses, no causal claims. Explanations reuse wording from the app's reviewed source library. Each insight states limitations and when to see a professional. Gentle mode hides personal numbers. Emergency and diagnosis questions in Ask are handled by rules.

## 10. Technology stack

Next.js 16, React 19, TypeScript, Tailwind CSS v4, Drizzle ORM, PostgreSQL (Neon), Auth.js, bcrypt, zod, Vitest, Playwright, optional Groq or Anthropic.

## 11. Testing evidence

Results of the last full run in the development sandbox (local PostgreSQL):

- Unit tests (Vitest): 143 passed.
- End-to-end tests (Playwright, desktop and mobile): 112 passed.
- Production build: succeeded; type check and lint: no errors.

New automated coverage: trend analysis, validation, no ranges in the marker list, engine output parts, labs excluded by default, no dates or notes in AI facts, reply checks (invented numbers, judgement wording, unsafe wording, bad format), no network call without consent or data, fallback on provider failure; e2e for add/edit/delete, ownership between two users, AI consent gating, receipt, goals, summary selection, export and delete. AI was tested with a fake service. The real AI tracking summary has not yet been tried against a live service.

## 12. Current limitations

- Not a medical device; no clinical validation, no clinician review of the new observations.
- Self-reported data; no device integration.
- The source library has no page on hormone blood tests, so hormone terms are only named.
- In-memory rate limiting; no email verification or password reset.
- No full accessibility audit; PDF export uses the browser's print dialog.

## 13. Future roadmap

Clinician review of observations and wording; a small user study; hormone-test sources added to the library; reminders; more languages; shared rate limiting; accessibility audit; optional export to a clinician-friendly file.
