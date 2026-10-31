import { ClipboardList, FileText, Lock, ShieldCheck, Sparkles, Stethoscope, BookOpenCheck, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

const steps = [
  {
    icon: ClipboardList,
    title: "Private assessment",
    text: "Answer optional questions at your own pace. You choose what to share and can skip anything.",
  },
  {
    icon: BookOpenCheck,
    title: "Educational insights",
    text: "See general information about factors you reported, linked to named public-health and medical sources.",
  },
  {
    icon: FileText,
    title: "Consultation summary",
    text: "Turn your answers into a clear summary and question list for your next appointment.",
  },
];

const privacyPoints = [
  { icon: Lock, text: "Consent is requested before any sensitive question is processed." },
  { icon: ShieldCheck, text: "Other users cannot see your answers. Access is checked on the server." },
  { icon: Trash2, text: "You can delete your assessment data or your account from the Privacy Center." },
  { icon: Sparkles, text: "AI use is disclosed, and nothing is shared with a clinician unless you choose to." },
];

const faqs = [
  {
    q: "Does FertilityCare AI diagnose infertility?",
    a: "No. It offers general education and helps you prepare questions. Only a qualified healthcare professional can evaluate fertility.",
  },
  {
    q: "Do I need an account to read the health resources?",
    a: "No. The resource library is public. An account is only needed for the private assessment.",
  },
  {
    q: "Who can see my answers?",
    a: "Only you. Nothing is shared automatically. Before any export or sharing you see what will be included and confirm it.",
  },
  {
    q: "How is AI used?",
    a: "AI helps summarise your answers and explain general concepts. It must not diagnose, prescribe, or invent sources, and its output is checked before you see it.",
  },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        {/* Hero */}
        <section className="bg-navy text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-20 pt-10 md:grid-cols-2 md:pt-16">
            <div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                Understand Your Health. Take Your <span className="text-teal">Next Step</span> with Confidence.
              </h1>
              <p className="mt-5 max-w-xl text-base text-white/85 md:text-lg">
                Explore male reproductive health through private assessments, evidence-informed education, and
                practical guidance for your next conversation with a healthcare professional.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/sign-up">Start Private Assessment</ButtonLink>
                <ButtonLink href="#how-it-works" variant="outlineLight">
                  Explore How It Works
                </ButtonLink>
              </div>
              <ul className="mt-10 grid gap-4 text-sm sm:grid-cols-3">
                <li className="flex items-start gap-2">
                  <Lock className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden="true" />
                  <span><strong className="block text-white">Private</strong>You control your data</span>
                </li>
                <li className="flex items-start gap-2">
                  <BookOpenCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden="true" />
                  <span><strong className="block text-white">Source-linked</strong>Named medical sources</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden="true" />
                  <span><strong className="block text-white">Transparent AI</strong>Not a diagnosis</span>
                </li>
              </ul>
            </div>

            {/* Illustrative product preview (no real data) */}
            <div className="rounded-2xl border border-white/15 bg-navy-2 p-5" aria-label="Illustrative product preview">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-teal">Illustrative preview</p>
              <div className="rounded-xl bg-white p-5 text-text">
                <p className="text-sm font-semibold text-navy">Your health journey</p>
                <ol className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                  {["Consent", "Assessment", "Insights", "Summary"].map((s, i) => (
                    <li key={s} className="space-y-2">
                      <span
                        className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full font-semibold ${
                          i === 0 ? "bg-teal-dark text-white" : "bg-[#eef1f6] text-navy-2"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="block text-muted">{s}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-5 rounded-lg bg-teal-light p-4 text-sm text-navy">
                  <Stethoscope className="mb-1 h-5 w-5 text-teal-dark" aria-hidden="true" />
                  Educational information only. Discuss anything that concerns you with a healthcare professional.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-3xl font-bold text-navy">How it works</h2>
          <p className="mt-2 max-w-2xl text-muted">Three steps, each one optional and under your control.</p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }) => (
              <Card key={title}>
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-light">
                  <Icon className="h-6 w-6 text-teal-dark" aria-hidden="true" />
                </span>
                <CardTitle className="mt-4">{title}</CardTitle>
                <p className="mt-2 text-sm text-muted">{text}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Privacy */}
        <section id="privacy" className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-3xl font-bold text-navy">Privacy and data control</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Reproductive health information is sensitive. The product is designed around that.
            </p>
            <ul className="mt-8 grid gap-4 md:grid-cols-2">
              {privacyPoints.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 rounded-xl border border-border p-4">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-dark" aria-hidden="true" />
                  <span className="text-sm">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* About */}
        <section id="about" className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-3xl font-bold text-navy">About this project</h2>
          <p className="mt-3 max-w-3xl text-muted">
            FertilityCare AI is a health education and care-navigation prototype. It has not been clinically
            validated, and it does not provide diagnoses or fertility predictions.
          </p>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-5 pb-20">
          <h2 className="text-3xl font-bold text-navy">Frequently asked questions</h2>
          <div className="mt-6 space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="rounded-xl border border-border bg-white p-4">
                <summary className="cursor-pointer font-semibold text-navy">{f.q}</summary>
                <p className="mt-2 text-sm text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
