import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { requireUser } from "@/lib/session";
import { Card, CardTitle } from "@/components/ui/card";
import { SourceList } from "@/components/shared/source-list";

export const metadata: Metadata = { title: "Care navigation" };
export const instant = false;

const questions = [
  "Which tests do you recommend first, and why?",
  "Should the semen analysis be repeated, and when?",
  "Could any medicine or supplement I take affect sperm?",
  "Are any of my habits worth changing, and how strong is the evidence?",
  "Should my partner be assessed at the same time?",
  "When would you refer me to a specialist?",
];

const checklist = [
  "How long you have been trying to conceive, and how often you have sex",
  "Any difficulties during sex",
  "Past contraception use and when you stopped",
  "Your medical history, including any past sexually transmitted infections, surgery or injury",
  "All current medicines, including non-prescription medicines, herbal remedies and supplements",
  "Smoking, alcohol, drug use, weight and stress",
  "Any children from other relationships",
  "Any laboratory reports you already have (bring the full report, not only the numbers)",
];

const steps = [
  {
    title: "Talk with a primary care professional",
    text: "The NHS advises seeing a GP if you have not conceived after a year of regular unprotected sex, and sooner for some situations such as past cancer treatment or a possible infection. They may recommend lifestyle changes or refer you to a specialist team.",
  },
  {
    title: "History and examination",
    text: "The AUA/ASRM guideline says a man's evaluation should include a reproductive history, and men with abnormal semen results should see a male reproductive expert for a full history and physical examination. It also says both partners should be assessed at the same time.",
  },
  {
    title: "One or more semen analyses",
    text: "The guideline says the first evaluation should include one or more semen analyses. MedlinePlus explains that sperm count and quality vary from day to day, so two or more samples may be needed.",
  },
  {
    title: "Other tests, if the professional advises them",
    text: "The NHS says men may also be offered a urine test for chlamydia. MedlinePlus says abnormal results can lead to further tests such as ultrasounds or blood tests. Which tests are right depends on your situation.",
  },
];

export default async function CarePage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-navy">Care navigation</h1>
        <p className="mt-1 text-muted">
          General guidance on getting care. It is informational and does not replace professional judgement.
        </p>
      </header>

      <section aria-labelledby="urgent" className="rounded-[14px] border-2 border-danger bg-danger-bg p-5">
        <h2 id="urgent" className="flex items-center gap-2 text-lg font-semibold text-danger">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" /> Seek urgent care now if this happens
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text">
          <li>Sudden, severe pain in one testicle. This is the most common sign of testicular torsion.</li>
          <li>It may come with swelling of the scrotum, abdominal pain, nausea or vomiting, a testicle sitting higher than usual, or redness and tenderness.</li>
        </ul>
        <p className="mt-3 text-sm font-medium text-text">
          Do not wait to see whether it gets better. Go to the nearest emergency department straight away, or call your local
          emergency number if you cannot get there quickly. The source says time is critical.
        </p>
        <p className="mt-2 text-xs text-muted">
          Source: NHS Essex Integrated Care Board (UK). Its hospital names and phone number apply to Essex, UK only. Use your own
          local emergency service.
        </p>
        <div className="mt-3">
          <SourceList ids={["nhs-essex-testicular-torsion"]} />
        </div>
      </section>

      <Card>
        <CardTitle>Which professional may be appropriate</CardTitle>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
          <li>
            <strong>A primary care doctor</strong> is a usual first step (the NHS suggests seeing a GP). They can ask about your
            history, arrange first tests, and refer you on.
          </li>
          <li>
            <strong>A male reproductive expert</strong>, as the AUA/ASRM guideline calls this specialist, is advised for men with
            abnormal semen results or presumed male infertility.
          </li>
        </ul>
        <div className="mt-3">
          <SourceList ids={["nhs-infertility-diagnosis", "aua-asrm-2020"]} />
        </div>
      </Card>

      <Card>
        <CardTitle>What may happen next</CardTitle>
        <ol className="mt-3 space-y-3">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-dark text-sm font-semibold text-white">
                {i + 1}
              </span>
              <span className="text-sm">
                <strong className="block text-navy">{s.title}</strong>
                {s.text}
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-3">
          <SourceList ids={["nhs-infertility-diagnosis", "aua-asrm-2020", "medlineplus-semen-analysis"]} />
        </div>
      </Card>

      <Card>
        <CardTitle>Preparation checklist</CardTitle>
        <p className="mt-1 text-sm text-muted">
          The NHS lists these as topics a doctor typically asks about at a first visit.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {checklist.map((c) => (
            <li key={c} className="flex gap-2">
              <span aria-hidden="true">☐</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          If you are asked for a semen sample, MedlinePlus says people are often asked to avoid ejaculation for about 2 to 7 days
          beforehand. Follow the instructions your provider gives you.
        </p>
        <div className="mt-3">
          <SourceList ids={["nhs-infertility-diagnosis", "medlineplus-semen-analysis"]} />
        </div>
      </Card>

      <Card>
        <CardTitle>Questions you could ask</CardTitle>
        <p className="mt-1 text-sm text-muted">
          These suggestions were written for this app. They are not taken from a source and are not a complete list.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {questions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </Card>

      <p className="text-xs text-muted">
        This page does not list hospitals, clinics, prices or appointments, because that information has not been verified.
      </p>
    </div>
  );
}
