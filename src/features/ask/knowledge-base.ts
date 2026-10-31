import { SOURCES } from "@/data/evidence-library";
import { buildInsights } from "@/lib/insights/rules";

// The Q&A answers ONLY from these passages. Nothing here is new medical content:
//  1. the "explanation" text of every insight rule (already written from named sources),
//  2. the summary of every verified source in the evidence library,
//  3. a few care-navigation sentences (the same ones shown on the Care page).
// Each passage carries the ids of its sources, so links always come from the library, never from a model.

export type Passage = {
  id: string;
  topic: string;
  text: string;
  sourceIds: string[];
  // Extra everyday words people may use, so "smoking" can find the tobacco passage.
  keywords: string;
};

const EXTRA_KEYWORDS: Record<string, string> = {
  tobacco: "smoking smoke cigarette cigarettes nicotine vape vaping tobacco",
  alcohol: "drinking drink beer wine liquor alcohol",
  activity: "exercise gym workout weight obesity obese sitting fitness active",
  sleep: "sleeping insomnia apnea tired rest night",
  stress: "anxiety anxious mental pressure worry",
  heat: "sauna hot tub laptop underwear tight clothing temperature warm heat",
  chemicals: "pesticide chemical toxins exposure workplace pollution",
  medications: "medicine medication drug drugs supplement supplements steroids tablets",
  condition: "diabetes illness disease hormone condition chronic",
  history: "injury surgery operation hernia trauma cancer chemotherapy infection undescended",
  tests: "semen analysis report result results count motility sperm concentration lab",
  "tests-first": "semen analysis test tests first sample",
  age: "older aging age years old",
  "when-to-see": "when doctor appointment timing how long trying months year conceive see",
};

// A synthetic "everything reported" answer set, only used to list every insight rule once.
const ALL_ANSWERS = {
  context: { ageRange: "50+" },
  lifestyle: {
    tobacco: "current",
    alcohol: "15+",
    activity: "mostly_sitting",
    sleep: "under_6",
    stress: "high",
    exposures: ["heat", "long_sitting", "chemicals"],
  },
  history: { medications: "yes", chronicCondition: "yes", previousConcern: "yes", surgeryInjury: "yes" },
};

function insightPassages(): Passage[] {
  const byId = new Map<string, Passage>();
  for (const semen of ["yes", "no"]) {
    for (const i of buildInsights({ ...ALL_ANSWERS, tests: { semenAnalysisDone: semen } })) {
      if (i.id === "insufficient" || byId.has(i.id)) continue;
      byId.set(i.id, {
        id: `insight-${i.id}`,
        topic: i.topic,
        text: i.explanation,
        sourceIds: i.sourceIds,
        keywords: EXTRA_KEYWORDS[i.id] ?? "",
      });
    }
  }
  return [...byId.values()];
}

function sourcePassages(): Passage[] {
  return SOURCES.filter((s) => s.verified).map((s) => ({
    id: `source-${s.id}`,
    topic: s.title,
    text: s.summary,
    sourceIds: [s.id],
    keywords: `${s.organization} ${s.categories.join(" ")}`,
  }));
}

const CARE_PASSAGES: Passage[] = [
  {
    id: "care-professional",
    topic: "Which professional to see",
    text: "A primary care doctor is a usual first step (the NHS suggests seeing a GP). They can ask about your history, arrange first tests, and refer you on. A male reproductive expert, as the AUA/ASRM guideline calls this specialist, is advised for men with abnormal semen results or presumed male infertility.",
    sourceIds: ["nhs-infertility-diagnosis", "aua-asrm-2020"],
    keywords: "doctor gp specialist urologist which see professional refer referral",
  },
  {
    id: "care-evaluation",
    topic: "What may happen at an evaluation",
    text: "The AUA/ASRM guideline says a man's evaluation should include a reproductive history, and that the first evaluation should include one or more semen analyses. It also says both partners should be assessed at the same time. The NHS says men may also be offered a urine test for chlamydia.",
    sourceIds: ["aua-asrm-2020", "nhs-infertility-diagnosis"],
    keywords: "evaluation examination visit appointment expect tests partner chlamydia urine",
  },
  {
    id: "care-prepare",
    topic: "Preparing for an appointment",
    text: "The NHS lists topics a doctor typically asks about at a first visit: how long you have been trying and how often you have sex, medical history, current medicines including supplements and herbal remedies, smoking, alcohol, drug use and stress. MedlinePlus says people are often asked to avoid ejaculation for about 2 to 7 days before giving a semen sample, and to follow the provider's instructions.",
    sourceIds: ["nhs-infertility-diagnosis", "medlineplus-semen-analysis"],
    keywords: "prepare preparation checklist bring ask sample abstain abstinence days",
  },
  {
    id: "care-urgent",
    topic: "Sudden severe testicle pain (urgent)",
    text: "Sudden, severe pain in one testicle is the most common sign of testicular torsion. It may come with swelling of the scrotum, abdominal pain, nausea or vomiting, or a testicle sitting higher than usual. The source says time is critical, so go to the nearest emergency department straight away or call your local emergency number.",
    sourceIds: ["nhs-essex-testicular-torsion"],
    keywords: "torsion testicle testicular pain swelling emergency urgent scrotum",
  },
];

let cache: Passage[] | undefined;
export function knowledgeBase(): Passage[] {
  cache ??= [...insightPassages(), ...sourcePassages(), ...CARE_PASSAGES];
  return cache;
}
