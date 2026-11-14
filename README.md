# FertilityCare AI

A privacy-first web app that helps adults learn about male reproductive health and prepare for a conversation with a healthcare professional.

**It does not diagnose, predict fertility or pregnancy outcomes, or recommend medicines.** It gives general educational information from named public-health and medical sources, and points people to professional care.

## Live demo

**https://fertilitycare-ai-liard.vercel.app**

1. Open the link, then go to **Sign in** (`/sign-in`).
2. Press **Try the demo (no sign-up)**. This opens a private demo account filled with made-up example answers. No real data is used, and each click creates a separate demo user.
3. Look at: **Dashboard**, **Insights**, **My Progress** (the demo has three made-up assessments to compare), **Care**, **Ask a Question**, **Consultation Summary**, **Privacy Center** (with full account activity), **Settings** (gentle mode), and the public page **How we test safety** (`/how-we-test`).

In the demo, AI consent is off by default. The AI features are also switched off on the public site until a key is added (see "AI" below). Without AI, the app still works and answers from the source library.

## What it does

| Area | What you get |
| --- | --- |
| Assessment | A 6-step guided form. Only age range is required. Everything else can be skipped. |
| Insights | Educational cards built by a **rules engine** (not AI). Each card links to named sources and states its limitations. |
| Ask a Question | Answers only from the app's source library. Urgent symptoms get emergency guidance. Diagnosis, prediction and dosing questions are refused. |
| My Progress | The person's own submitted assessments side by side, with a "Changed" mark, and line charts of the test numbers they typed. It never says a change is good or bad and draws no normal range. |
| Gentle mode | Optional setting (kept in this browser only) that hides the person's own numbers and "What you reported" lists on Insights and Progress. Safety information and sources always stay visible. |
| How we test safety | Public page that lists about 35 safety test cases (emergency questions, diagnosis and dosing requests, made-up unsafe AI replies, removal of emails and phone numbers) and runs them **live** against the app's real code. The same list runs as automated tests. Known gaps are shown openly. |
| Safety card | Public page (`/safety-card`) that says what the app is for, what it does not do, how answers are made, where data goes, what was tested (live count) and what has not been done. It shows whether AI is switched on at that moment. |
| Account activity | Privacy Center page with the person's own audit events in plain words (sign-in, consent changes, downloads, deletions). It contains no health content. |
| Care navigation | When to see a professional, what to ask, and urgent warning signs. |
| Consultation Summary | A printable summary the person can bring to an appointment. They choose which sections to include. |
| Privacy Center | Separate consents, withdraw consent, download own data (readable text or technical JSON), delete assessment data, delete account. |
| Health Resources | Public page of source pages that were opened and read. |

## How AI is used (and limited)

- AI is **optional**. The app works fully without it.
- It runs only if the server has `AI_ENABLED="true"` and a key, **and** the person gave a separate AI consent in the Privacy Center.
- Only coded answers (for example an age range) are sent for insight notes. Name, email and free text are never sent. Emails and phone numbers typed into a question are removed before sending.
- For Ask a Question, the AI can only rewrite the passages it is given. The reply must pass four checks: expected format, long enough, no diagnosis, medicine, dosing or prediction wording, and **no number that is not in the sources**. If any check fails, the plain source passages are shown instead, with a short reason code.
- Under every answer the person can open **Safety checks on the AI reply** (which check passed or failed) and **What was sent to an AI service** (the exact question after personal details were removed, and the titles of the passages sent). When no AI was used it says so.

## Built with

Next.js 16, React 19, TypeScript, Tailwind CSS v4, Drizzle ORM, PostgreSQL (Neon), Auth.js (credentials, JWT sessions), bcrypt, zod, Vitest, Playwright. Optional AI providers: Groq or Anthropic.

## Run it on your computer

You need Node.js and a PostgreSQL database.

```bash
npm ci
cp .env.example .env      # on Windows PowerShell: copy .env.example .env
# edit .env: set DATABASE_URL, AUTH_SECRET (a long random text), AUTH_URL, APP_URL
npm run db:migrate        # creates the tables
npm run dev               # http://localhost:3000
```

Main settings in `.env` (see `.env.example`):

| Name | Meaning |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Long random text used to sign login cookies |
| `DEMO_MODE` | `"true"` shows the "Try the demo" button |
| `AI_ENABLED` | `"true"` allows AI (also needs a key and user consent) |
| `AI_PROVIDER`, `GROQ_API_KEY`, `GROQ_MODEL` | AI provider settings (private, never commit) |

## Tests

```bash
npm test            # unit tests (Vitest)
npm run build       # production build, needed before e2e tests
npm run test:e2e    # end-to-end tests (Playwright), uses a separate test database
```

At the last full run in the development sandbox: **112 unit tests and 74 end-to-end tests passed** (desktop and mobile screen sizes), against a local PostgreSQL database.

## Privacy and security design

- Health answers are stored apart from identity data. Every private row belongs to a user, and the server checks ownership on each request.
- Consent is recorded per purpose (health assessment, AI processing) and is append-only. Withdrawing consent blocks new answers.
- Passwords are hashed with bcrypt. Sign-in and sign-up are rate limited. Wrong email and wrong password give the same message.
- Audit events store who did what and when, **never health content**, and survive account deletion.
- Deleting the account removes all of the person's rows.
- Questions typed into Ask a Question are not stored.

## Honest limits (please read)

- **Not a medical device and not medical advice.** No clinical validation has been done.
- **No compliance is claimed.** This project has not been audited for HIPAA, GDPR or any other law or standard.
- **Not implemented:** email verification and password reset (the app sends no emails). The "Forgot password?" link opens a page that says this plainly and lists what to do instead.
- **Rate limiting is in memory.** On a serverless host each server instance counts separately, so limits are approximate. A shared store would be needed for strict limits.
- **AI was tested with the real Groq service only by hand** (one question, answered and passed the checks). Automated tests use a fake AI service.
- **The Progress charts and gentle mode are tested only in the development sandbox with demo data.** The chart is SVG with a text table that carries the same numbers for screen readers.
- **"Save as PDF" uses the browser's print dialog.** The app does not generate PDF files itself.
- **Accessibility:** forms use labels, error messages are announced, and pages work on phone and desktop. A full accessibility audit with assistive technology has not been done.
- **The safety page tests our own rules, not the AI model.** About 35 cases cannot cover every sentence. Known gaps today: misspelled questions (for example "infertlie") and many other languages are not caught by the question rules, although every AI reply still passes the reply checks. While preparing this page, three real misses in the emergency and diagnosis rules were found and fixed.
- **The source link checker (`npm run check:links`, and a weekly GitHub workflow) has not been run against the real internet by the developer's sandbox**, which has no outside access. Run it once yourself before relying on it.
- The source library is a fixed list of pages that were opened and read on the date shown on each entry. Pages can change later.
- The demo uses **synthetic data only**.

## Source library

Every insight and answer links to a named source. Sources and their check dates live in `src/data/evidence-library.ts`. Statistics are never invented: the app shows no percentage that is not in a source.
