// Curated, versioned evidence library.
// Every entry below was opened and read on the "checkedOn" date. If a page cannot be opened
// it must NOT be added here as verified. Summaries are our own paraphrase, never copied text.

export const EVIDENCE_VERSION = "2026-10-27";

export type CategoryId = "basics" | "lifestyle" | "tests" | "appointment" | "urgent";

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "basics", label: "Male reproductive health basics" },
  { id: "lifestyle", label: "Lifestyle and general wellness" },
  { id: "tests", label: "Understanding existing tests" },
  { id: "appointment", label: "Preparing for a medical appointment" },
  { id: "urgent", label: "When to seek urgent care" },
];

export type Source = {
  id: string;
  title: string;
  organization: string;
  url: string;
  // The date as the page itself shows it. Not every page shows one.
  dateShown: string;
  checkedOn: string;
  verified: boolean;
  categories: CategoryId[];
  summary: string;
};

const CHECKED = "2026-10-27";

export const SOURCES: Source[] = [
  {
    id: "who-infertility",
    title: "Infertility (fact sheet)",
    organization: "World Health Organization (WHO)",
    url: "https://www.who.int/news-room/fact-sheets/detail/infertility",
    dateShown: "28 November 2025",
    checkedOn: CHECKED,
    verified: true,
    categories: ["basics", "lifestyle"],
    summary:
      "Defines infertility as not achieving a pregnancy after 12 months or more of regular unprotected sex, and describes male-related causes and lifestyle and environmental factors.",
  },
  {
    id: "mayo-male-infertility",
    title: "Male infertility: symptoms and causes",
    organization: "Mayo Clinic",
    url: "https://www.mayoclinic.org/diseases-conditions/male-infertility/symptoms-causes/syc-20374773",
    dateShown: "8 August 2026 (as shown on the page)",
    checkedOn: CHECKED,
    verified: true,
    categories: ["basics", "lifestyle", "appointment"],
    summary:
      "Plain-language overview of symptoms, medical, environmental and lifestyle causes, risk factors, and when to see a healthcare professional.",
  },
  {
    id: "aua-asrm-2020",
    title: "Diagnosis and Treatment of Infertility in Men: AUA/ASRM Guideline",
    organization: "American Urological Association (AUA) and American Society for Reproductive Medicine (ASRM)",
    url: "https://auanet.org/guidelines-and-quality/guidelines/male-infertility",
    dateShown: "2020",
    checkedOn: CHECKED,
    verified: true,
    categories: ["basics", "lifestyle", "tests", "appointment"],
    summary:
      "Clinical guideline for professionals covering evaluation of men, semen analysis, and the strength of evidence for lifestyle factors, medicines and exposures.",
  },
  {
    id: "nhs-infertility-causes",
    title: "Causes of infertility",
    organization: "NHS (UK)",
    url: "https://www.nhs.uk/conditions/infertility/causes/",
    dateShown: "Reviewed 9 August 2023",
    checkedOn: CHECKED,
    verified: true,
    categories: ["basics", "lifestyle"],
    summary: "Lists causes of male infertility, including sperm problems, testicular damage, hormones, medicines and heat.",
  },
  {
    id: "nhs-infertility-diagnosis",
    title: "Diagnosis of infertility",
    organization: "NHS (UK)",
    url: "https://www.nhs.uk/conditions/infertility/diagnosis/",
    dateShown: "Reviewed 9 August 2023",
    checkedOn: CHECKED,
    verified: true,
    categories: ["tests", "appointment"],
    summary:
      "Explains when to see a GP, which first tests men are offered, and what a doctor typically asks about at the first visit.",
  },
  {
    id: "cdc-infertility-faq",
    title: "Infertility: Frequently Asked Questions",
    organization: "Centers for Disease Control and Prevention (CDC, USA)",
    url: "https://www.cdc.gov/reproductive-health/infertility-faq/",
    dateShown: "Reviewed 15 December 2023",
    checkedOn: CHECKED,
    verified: true,
    categories: ["basics", "lifestyle", "appointment"],
    summary:
      "Answers common questions: definition of infertility, male factors, when to see a provider, and lifestyle factors for men.",
  },
  {
    id: "nichd-infertility",
    title: "Infertility and Fertility",
    organization: "Eunice Kennedy Shriver National Institute of Child Health and Human Development (NICHD, NIH)",
    url: "https://www.nichd.nih.gov/health/topics/factsheets/infertility",
    dateShown: "Review date not shown on the page",
    checkedOn: CHECKED,
    verified: true,
    categories: ["basics"],
    summary: "Fact sheet on causes in men and women, including the effect of age, and when to see a provider.",
  },
  {
    id: "medlineplus-semen-analysis",
    title: "Semen Analysis (medical test)",
    organization: "MedlinePlus (US National Library of Medicine)",
    url: "https://medlineplus.gov/lab-tests/semen-analysis/",
    dateShown: "Updated 10 June 2025",
    checkedOn: CHECKED,
    verified: true,
    categories: ["tests"],
    summary:
      "Explains why a semen analysis is done, how to prepare, what is measured, and why results can vary and may need repeating.",
  },
  {
    id: "nhs-essex-testicular-torsion",
    title: "Testicular torsion: symptoms and urgent emergency advice",
    organization: "NHS Essex Integrated Care Board (UK, regional)",
    url: "https://www.essex.icb.nhs.uk/news/testicular-torsion-emergency-advice/",
    dateShown: "Published 26 January 2026",
    checkedOn: CHECKED,
    verified: true,
    categories: ["urgent"],
    summary:
      "Describes the symptoms of testicular torsion and why urgent hospital care matters. The hospital names on the page are local to Essex, UK.",
  },
];

const byId = new Map(SOURCES.map((s) => [s.id, s]));

export function sourceById(id: string): Source | undefined {
  return byId.get(id);
}
