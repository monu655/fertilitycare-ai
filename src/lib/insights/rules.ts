import { SECTIONS, optionLabel, type SectionId } from "@/features/assessment/questions";
import type { Insight } from "./schema";

type Responses = Record<string, Record<string, unknown>>;

// "Field label: answer", built from the same question list the user saw.
function line(sectionId: SectionId, name: string, value: unknown): string {
  const field = SECTIONS.find((s) => s.id === sectionId)?.fields.find((f) => f.name === name);
  if (!field) return String(value);
  return `${field.label} ${optionLabel(field, value)}`;
}

// These rules never score or label the user. They only match a reported answer to general,
// sourced information, and they say so when evidence is limited. Nothing here is a diagnosis.
export function buildInsights(r: Responses): Insight[] {
  const ctx = r.context ?? {};
  const life = r.lifestyle ?? {};
  const hist = r.history ?? {};
  const tests = r.tests ?? {};
  const out: Insight[] = [];

  // --- Lifestyle ---
  if (life.tobacco === "current") {
    out.push({
      id: "tobacco",
      topic: "Tobacco and sperm health",
      kind: "educational",
      personal: true,
      reported: [line("lifestyle", "tobacco", life.tobacco)],
      explanation:
        "Mayo Clinic notes that smoking may lower sperm count and that secondhand smoke may also affect male fertility. WHO and CDC list smoking among lifestyle factors that can affect fertility. The AUA/ASRM guideline describes the evidence as low quality, pointing to a small effect on sperm concentration, movement and shape.",
      whyItMatters:
        "Tobacco use is one of several factors that health organizations mention. These general findings cannot predict the effect on any one person.",
      nextSteps: ["Consider raising tobacco use with a healthcare professional, who can discuss options and support for cutting down or stopping."],
      whenToConsult: "Bring it up at any appointment about fertility or general health.",
      strength: "mixed",
      sourceIds: ["mayo-male-infertility", "who-infertility", "cdc-infertility-faq", "aua-asrm-2020"],
      limitations:
        "Studies differ in size and quality. This does not show how much tobacco affects your own fertility, and no outcome can be promised.",
    });
  }

  if (life.alcohol === "8-14" || life.alcohol === "15+") {
    out.push({
      id: "alcohol",
      topic: "Alcohol",
      kind: "educational",
      personal: true,
      reported: [line("lifestyle", "alcohol", life.alcohol)],
      explanation:
        "Mayo Clinic says drinking alcohol can lower testosterone and sperm count, and WHO and CDC list excessive or heavy alcohol use among factors that can affect fertility. The AUA/ASRM guideline is more cautious: it found high-quality evidence of only a mild effect on semen volume and shape, which it did not consider clinically significant, and no harm to sperm concentration or movement.",
      whyItMatters:
        "The sources do not fully agree, so the effect of the amount you reported is uncertain. Alcohol also affects general health.",
      nextSteps: ["You may want to talk with a healthcare professional about what level of alcohol is right for you."],
      whenToConsult: "If you are trying to conceive, or if you feel your drinking is hard to control, speak to a healthcare professional.",
      strength: "mixed",
      sourceIds: ["mayo-male-infertility", "who-infertility", "cdc-infertility-faq", "aua-asrm-2020"],
      limitations: "The research is mixed and does not set a safe or unsafe amount for fertility.",
    });
  }

  if (life.activity === "mostly_sitting") {
    out.push({
      id: "activity",
      topic: "Physical activity and body weight",
      kind: "educational",
      personal: true,
      reported: [line("lifestyle", "activity", life.activity)],
      explanation:
        "The AUA/ASRM guideline says clinicians may advise regular resistance or high-intensity exercise for sedentary men who have abnormal semen results, but it notes that the evidence is limited. WHO, Mayo Clinic and the guideline also link obesity with reduced fertility. This assessment does not ask about weight, so it cannot say anything about yours.",
      whyItMatters: "Activity level and weight are things many people can influence, but the link to fertility is not strongly proven.",
      nextSteps: ["A healthcare professional can advise on activity that suits your health and fitness."],
      whenToConsult: "Check with a healthcare professional before starting a new intense exercise routine, especially if you have a health condition.",
      strength: "limited",
      sourceIds: ["aua-asrm-2020", "who-infertility", "mayo-male-infertility"],
      limitations: "Evidence is limited, and your weight was not collected, so no conclusion about weight is drawn.",
    });
  }

  if (life.sleep === "under_6") {
    out.push({
      id: "sleep",
      topic: "Sleep",
      kind: "educational",
      personal: true,
      reported: [line("lifestyle", "sleep", life.sleep)],
      explanation:
        "Mayo Clinic mentions that having sleep apnea or otherwise sleeping poorly can also affect sperm. The sources give little detail, so how much sleep matters for fertility is uncertain.",
      whyItMatters: "Poor sleep affects general health, so it is worth attention whatever its effect on fertility.",
      nextSteps: ["If sleep is a problem, a healthcare professional can help look at the causes."],
      whenToConsult: "Mention ongoing sleep problems to a healthcare professional.",
      strength: "limited",
      sourceIds: ["mayo-male-infertility"],
      limitations: "Only one of the reviewed sources discusses sleep, and only briefly.",
    });
  }

  if (life.stress === "high") {
    out.push({
      id: "stress",
      topic: "Stress",
      kind: "educational",
      personal: true,
      reported: [line("lifestyle", "stress", life.stress)],
      explanation:
        "The AUA/ASRM guideline reports that stress is linked to a small decrease in progressive sperm movement in studies. Mayo Clinic lists lowering stress as general advice and notes that difficulty conceiving can itself cause stress. The NHS says a doctor may ask about stress at a first visit.",
      whyItMatters: "Stress and fertility can affect each other, but the measured effect on sperm is small.",
      nextSteps: ["If stress feels hard to manage, consider speaking to a healthcare professional or a counsellor."],
      whenToConsult: "Seek support if stress is affecting your sleep, mood or daily life.",
      strength: "limited",
      sourceIds: ["aua-asrm-2020", "mayo-male-infertility", "nhs-infertility-diagnosis"],
      limitations: "The evidence is limited and does not show that reducing stress will change a fertility result.",
    });
  }

  const exposures = Array.isArray(life.exposures) ? (life.exposures as string[]) : [];
  const heatReported = exposures.filter((e) => e === "heat" || e === "long_sitting");
  if (heatReported.length > 0) {
    out.push({
      id: "heat",
      topic: "Heat and long periods of sitting",
      kind: "educational",
      personal: true,
      reported: heatReported.map((e) => line("lifestyle", "exposures", [e])),
      explanation:
        "Mayo Clinic says saunas and hot tubs may lower sperm count for a time, and that long periods of sitting, laptop use and tight clothing may raise the temperature of the scrotum, adding that more research is needed. The NHS links a higher scrotal temperature with lower semen quality but says it is uncertain whether loose underwear helps. CDC lists frequent exposure of the testes to high temperatures as a factor.",
      whyItMatters: "Heat is a possible factor that people can sometimes adjust, but the evidence for everyday habits is uncertain.",
      nextSteps: ["You may want to ask a healthcare professional whether these habits are worth changing for you."],
      whenToConsult: "Raise it at a fertility appointment if you are trying to conceive.",
      strength: "limited",
      sourceIds: ["mayo-male-infertility", "nhs-infertility-causes", "cdc-infertility-faq"],
      limitations: "The sources say more research is needed. Effects of hot tubs and saunas are described as temporary.",
    });
  }

  if (exposures.includes("chemicals")) {
    out.push({
      id: "chemicals",
      topic: "Chemical exposure at work or in hobbies",
      kind: "educational",
      personal: true,
      reported: [line("lifestyle", "exposures", ["chemicals"])],
      explanation:
        "Mayo Clinic says exposure to certain chemicals, pesticides, herbicides, solvents and painting products may be part of low sperm counts, and it lists heavy metals. The AUA/ASRM guideline reports that some pesticides, lead and cadmium are linked with poorer semen results, while evidence for other chemicals is inconclusive. WHO notes that environmental pollutants can harm sperm.",
      whyItMatters: "Exposure level, duration and the exact substance matter, and this assessment does not collect them.",
      nextSteps: [
        "Follow the safety guidance for any chemicals you handle.",
        "Note which products you use and how often, in case you discuss it with a professional.",
      ],
      whenToConsult: "Mention work-related chemical exposure to a healthcare professional, especially if you are trying to conceive.",
      strength: "mixed",
      sourceIds: ["mayo-male-infertility", "aua-asrm-2020", "who-infertility"],
      limitations: "Evidence differs by substance. Nothing here can tell you whether your own exposure affects fertility.",
    });
  }

  // --- Medical history ---
  if (hist.medications === "yes") {
    out.push({
      id: "medications",
      topic: "Regular medicines",
      kind: "professional",
      personal: true,
      reported: [line("history", "medications", hist.medications)],
      explanation:
        "Mayo Clinic says some medicines can affect sperm production. The NHS lists examples such as sulfasalazine, long-term anabolic steroid misuse, chemotherapy and some herbal remedies. The AUA/ASRM guideline found little effect for most medicines but reported reduced semen volume with finasteride at 5 mg a day.",
      whyItMatters:
        "A doctor will usually ask about all current medicines, including non-prescription ones, herbal remedies and supplements.",
      nextSteps: [
        "Make a list of everything you take regularly, including supplements and herbal products.",
        "Do not stop or change any prescribed medicine on your own. Ask the prescriber or a pharmacist first.",
      ],
      whenToConsult: "Raise it at a fertility appointment so a doctor can review your full medicine list.",
      strength: "mixed",
      sourceIds: ["nhs-infertility-causes", "nhs-infertility-diagnosis", "mayo-male-infertility", "aua-asrm-2020"],
      limitations: "This assessment does not ask which medicines you take, so it cannot say whether any of yours are relevant.",
    });
  }

  if (hist.chronicCondition === "yes") {
    out.push({
      id: "condition",
      topic: "Long-term medical condition",
      kind: "professional",
      personal: true,
      reported: [line("history", "chronicCondition", hist.chronicCondition)],
      explanation:
        "Some long-term conditions are listed among possible causes of abnormal semen results. For example, MedlinePlus names diabetes, hormone disorders and cystic fibrosis, and Mayo Clinic lists hormone imbalances and certain chromosome conditions among medical causes.",
      whyItMatters: "Treating or managing an underlying condition can be part of a fertility evaluation.",
      nextSteps: ["Tell the doctor which condition you have and how it is treated."],
      whenToConsult: "Raise it at your next appointment, or earlier if your condition is not well controlled.",
      strength: "general",
      sourceIds: ["medlineplus-semen-analysis", "mayo-male-infertility"],
      limitations: "This assessment does not ask which condition you have, so it cannot say whether yours is relevant.",
    });
  }

  const flags: string[] = [];
  if (hist.previousConcern === "yes") flags.push(line("history", "previousConcern", hist.previousConcern));
  if (hist.surgeryInjury === "yes") flags.push(line("history", "surgeryInjury", hist.surgeryInjury));
  if (flags.length > 0) {
    out.push({
      id: "history",
      topic: "Past concern, surgery or injury",
      kind: "professional",
      personal: true,
      reported: flags,
      explanation:
        "CDC says couples where the man has a history such as testicular trauma, hernia surgery, chemotherapy, infertility with another partner or sexual dysfunction should not delay seeing a healthcare provider. The NHS lists infection, injury, surgery, undescended testicles and testicular cancer among causes of testicular damage that can affect fertility.",
      whyItMatters: "Some histories are a reason to seek advice earlier rather than waiting.",
      nextSteps: ["Write down what happened and when, including the type of surgery or injury and any treatment."],
      whenToConsult: "Mention it early in an appointment.",
      strength: "general",
      sourceIds: ["cdc-infertility-faq", "nhs-infertility-causes"],
      limitations: "This assessment does not ask for details, so it cannot say whether your history matters.",
    });
  }

  // --- Tests: the text never depends on the numbers the user entered ---
  if (tests.semenAnalysisDone === "yes") {
    const reported: string[] = [line("tests", "semenAnalysisDone", tests.semenAnalysisDone)];
    if (tests.concentration !== undefined) reported.push(line("tests", "concentration", tests.concentration));
    if (tests.motility !== undefined) reported.push(line("tests", "motility", tests.motility));
    if (tests.concentration === undefined && tests.motility === undefined) {
      reported.push("No values were entered.");
    }
    out.push({
      id: "tests",
      topic: "Your semen analysis information",
      kind: "professional",
      personal: true,
      reported,
      explanation:
        "MedlinePlus explains that a semen analysis measures things such as volume, sperm count, movement and shape, and compares results with reference ranges. Sperm count and quality can vary from day to day, so two or more samples may be needed. CDC and MedlinePlus both say that slightly abnormal or low results do not by themselves mean a man is infertile.",
      whyItMatters:
        "Only a healthcare professional can interpret a result using your history, the laboratory's reference ranges and any repeat tests. This platform does not judge the values you entered.",
      nextSteps: [
        "Bring the full laboratory report, not just the numbers, to your appointment.",
        "Ask whether a repeat test is advisable.",
      ],
      whenToConsult: "Discuss your report with the doctor who ordered it or a fertility specialist.",
      strength: "general",
      sourceIds: ["medlineplus-semen-analysis", "cdc-infertility-faq", "aua-asrm-2020"],
      limitations: "Values you type cannot be checked against your report. Missing values are never treated as abnormal.",
    });
  } else if (tests.semenAnalysisDone === "no" || tests.semenAnalysisDone === "not_sure") {
    out.push({
      id: "tests-first",
      topic: "Semen analysis as a common first test",
      kind: "professional",
      personal: true,
      reported: [line("tests", "semenAnalysisDone", tests.semenAnalysisDone)],
      explanation:
        "The AUA/ASRM guideline says the initial evaluation of a man should include one or more semen analyses, and the NHS lists semen analysis among the first tests offered. MedlinePlus describes how to prepare, for example avoiding ejaculation for about 2 to 7 days before the sample unless your provider says otherwise.",
      whyItMatters: "A semen analysis is a simple first step that can show whether sperm may be part of a difficulty conceiving.",
      nextSteps: ["If you have been trying to conceive for 12 months or longer, ask a healthcare professional whether a semen analysis is appropriate."],
      whenToConsult: "Ask a healthcare professional before booking tests, and follow the preparation instructions you are given.",
      strength: "general",
      sourceIds: ["aua-asrm-2020", "nhs-infertility-diagnosis", "medlineplus-semen-analysis", "who-infertility"],
      limitations: "This assessment does not ask how long you have been trying to conceive.",
    });
  }

  // --- Age ---
  if (ctx.ageRange === "40-44" || ctx.ageRange === "45-49" || ctx.ageRange === "50+") {
    out.push({
      id: "age",
      topic: "Age and male fertility",
      kind: "educational",
      personal: true,
      reported: [line("context", "ageRange", ctx.ageRange)],
      explanation:
        "NICHD says men produce fewer sperm as they age and that male fertility declines more gradually than female fertility. CDC lists age 40 or older among factors linked with difficulty conceiving.",
      whyItMatters: "Age is one factor among many and cannot predict an individual outcome.",
      nextSteps: ["No action is needed because of age alone. See the timing guidance below if you are trying to conceive."],
      whenToConsult: "If you are trying to conceive and have concerns, a healthcare professional can advise on timing.",
      strength: "general",
      sourceIds: ["nichd-infertility", "cdc-infertility-faq"],
      limitations: "Many men conceive at older ages. This is general information only.",
    });
  }

  const hasPersonal = out.length > 0;

  // --- Always shown: general timing guidance ---
  out.push({
    id: "when-to-see",
    topic: "When to see a healthcare professional",
    kind: "educational",
    personal: false,
    reported: [],
    explanation:
      "WHO defines infertility as not achieving a pregnancy after 12 months or more of regular unprotected sex. The NHS and CDC suggest seeing a healthcare provider after about a year of trying, and sooner when the female partner is in her mid-30s or older. Mayo Clinic gives six months in that case, and CDC says men with certain histories should not delay.",
    whyItMatters: "Starting an evaluation at the right time can save worry and time, and a first visit often involves history and a semen analysis.",
    nextSteps: ["If you are unsure whether to book, a primary care professional can help you decide."],
    whenToConsult: "Earlier advice is reasonable if you have a past injury, surgery, cancer treatment, infection, or any worry about sexual function.",
    strength: "general",
    sourceIds: ["who-infertility", "nhs-infertility-diagnosis", "cdc-infertility-faq", "mayo-male-infertility"],
    limitations: "This assessment does not ask how long you have been trying, so it cannot say whether this applies to you now.",
  });

  if (!hasPersonal) {
    out.unshift({
      id: "insufficient",
      topic: "Not enough information for personalised insights",
      kind: "educational",
      personal: false,
      reported: [],
      explanation:
        "Based on what you shared, the platform cannot draw reliable conclusions. Many answers were skipped or did not match a topic in the evidence library. That is fine, and skipping a question never counts against you.",
      whyItMatters: "Without more information, only general guidance is shown.",
      nextSteps: ["You can start a new assessment at any time to add or change answers."],
      whenToConsult: "If you have concerns, a healthcare professional can help regardless of what this platform shows.",
      strength: "general",
      sourceIds: [],
      limitations: "The platform cannot assess you, diagnose a condition or predict fertility.",
    });
  }

  return out;
}
