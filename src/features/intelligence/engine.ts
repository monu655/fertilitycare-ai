// The rules half of "AI Fertility Intelligence". It works without any AI: it turns the person's own daily entries, assessment
// answers and (only if included) lab values into plain observations with the numbers behind them, general sourced education,
// limits, and when to talk to a professional. Everything here is arithmetic and fixed, sourced wording.
// It never diagnoses, never predicts, and never calls a change good or bad. Safe to import from browser code.

import { addDays } from "@/lib/dates";
import { SECTIONS, optionLabel } from "@/features/assessment/questions";
import { average, bedtimeSpread, inRange, round1, valuesOf, type HabitEntry } from "@/features/tracker/analysis";
import { markerByKey } from "@/features/medical/markers";
import type { Biomarker } from "@/features/medical/queries";

export type DataGroup = "habits" | "assessment" | "labs";

export type Fact = { text: string; group: DataGroup };

export type PatternInsight = {
  id: string;
  topic: string;
  observation: string;
  supportingData: Fact[];
  explanation: string;
  suggestions: string[];
  limitations: string;
  whenToConsult: string;
  sourceIds: string[];
};

export type EngineInput = {
  entries: HabitEntry[];
  today: string;
  responses: Record<string, Record<string, unknown>> | null;
  biomarkers: Biomarker[]; // pass [] to leave labs out
  windowDays?: number;
};

export type EngineOutput = {
  windowDays: number;
  daysLogged: number;
  insights: PatternInsight[];
  notes: string[]; // things that could not be said, for example "not enough entries"
};

const MIN_DAYS = 5; // fewer recorded days than this and a pattern is not described

function assessmentLine(sectionId: string, name: string, responses: EngineInput["responses"]): string | null {
  const v = responses?.[sectionId]?.[name];
  if (v === undefined || v === null || v === "" || v === "prefer_not") return null;
  const field = SECTIONS.find((s) => s.id === sectionId)?.fields.find((f) => f.name === name);
  if (!field) return null;
  return `In your assessment you answered "${field.label}": ${optionLabel(field, v)}`;
}

function sleepBucket(hours: number): string {
  if (hours < 6) return "under_6";
  if (hours < 7) return "6-7";
  if (hours <= 9) return "7-9";
  return "over_9";
}

export function buildPatternInsights(input: EngineInput): EngineOutput {
  const windowDays = input.windowDays ?? 30;
  const from = addDays(input.today, -(windowDays - 1));
  const win = inRange(input.entries, from, input.today);
  const insights: PatternInsight[] = [];
  const notes: string[] = [];
  const period = `Period: last ${windowDays} days`;

  const enough = (label: string, n: number) => {
    if (n >= MIN_DAYS) return true;
    notes.push(`Not enough ${label} entries yet (${n} in the last ${windowDays} days, at least ${MIN_DAYS} are needed to describe a pattern).`);
    return false;
  };

  // ---- Sleep ----
  const sleep = valuesOf(win, "sleepHours");
  if (enough("sleep", sleep.length)) {
    const avg = average(sleep) as number;
    const under6 = sleep.filter((h) => h < 6).length;
    const spread = bedtimeSpread(win);
    const facts: Fact[] = [
      { text: period, group: "habits" },
      { text: `Average sleep: ${avg} hours (${sleep.length} nights recorded)`, group: "habits" },
      { text: `Nights under 6 hours: ${under6} (6 hours is a reporting step in this app, not a medical limit)`, group: "habits" },
    ];
    if (spread) facts.push({ text: `Recorded bedtimes were spread over ${spread.minutes} minutes (${spread.nights} nights)`, group: "habits" });
    const reported = input.responses?.lifestyle?.sleep;
    const al = assessmentLine("lifestyle", "sleep", input.responses);
    let differs = false;
    if (al) {
      facts.push({ text: al, group: "assessment" });
      if (typeof reported === "string" && reported !== sleepBucket(avg)) differs = true;
    }
    insights.push({
      id: "sleep",
      topic: "Sleep",
      observation: `You recorded sleep on ${sleep.length} nights in the last ${windowDays} days, averaging ${avg} hours.${
        differs ? " This is a different range from the one you chose in your assessment. Your daily entries are more recent." : ""
      }`,
      supportingData: facts,
      explanation:
        "Mayo Clinic mentions that having sleep apnea or otherwise sleeping poorly can also affect sperm. The sources give little detail, so how much sleep matters for fertility is uncertain.",
      suggestions: [
        "Keep logging so you can see whether your sleep pattern is steady or changing.",
        "If sleep is a problem, a healthcare professional can help look at the causes.",
      ],
      limitations: "Only one of the reviewed sources discusses sleep, and only briefly. Your entries are self-reported.",
      whenToConsult: "Mention ongoing sleep problems, loud snoring or tiredness during the day to a healthcare professional.",
      sourceIds: ["mayo-male-infertility"],
    });
  }

  // ---- Stress ----
  const stress = valuesOf(win, "stress");
  if (enough("stress", stress.length)) {
    const avg = average(stress) as number;
    const high = stress.filter((s) => s >= 4).length;
    const facts: Fact[] = [
      { text: period, group: "habits" },
      { text: `Average stress rating: ${avg} on a 1 to 5 scale (${stress.length} days recorded)`, group: "habits" },
      { text: `Days you rated 4 or 5: ${high}`, group: "habits" },
    ];
    const al = assessmentLine("lifestyle", "stress", input.responses);
    if (al) facts.push({ text: al, group: "assessment" });
    insights.push({
      id: "stress",
      topic: "Stress",
      observation: `You rated your stress on ${stress.length} days in the last ${windowDays} days. The average rating was ${avg} out of 5, and ${high} of those days were rated 4 or 5.`,
      supportingData: facts,
      explanation:
        "The AUA/ASRM guideline reports that stress is linked to a small decrease in progressive sperm movement in studies. Mayo Clinic lists lowering stress as general advice and notes that difficulty conceiving can itself cause stress. The NHS says a doctor may ask about stress at a first visit.",
      suggestions: ["If stress feels hard to manage, consider speaking to a healthcare professional or a counsellor."],
      limitations: "The evidence is limited and does not show that reducing stress will change a fertility result. The rating is your own and is not a clinical score.",
      whenToConsult: "Seek support if stress is affecting your sleep, mood or daily life.",
      sourceIds: ["aua-asrm-2020", "mayo-male-infertility", "nhs-infertility-diagnosis"],
    });
  }

  // ---- Exercise and sitting ----
  const exercise = valuesOf(win, "exerciseMinutes");
  if (enough("exercise", exercise.length)) {
    const days = exercise.filter((m) => m > 0).length;
    const avg = average(exercise) as number;
    const sit = average(valuesOf(win, "sittingHours"));
    const facts: Fact[] = [
      { text: period, group: "habits" },
      { text: `Days with exercise: ${days} of ${exercise.length} recorded days`, group: "habits" },
      { text: `Average exercise: ${avg} minutes per recorded day`, group: "habits" },
    ];
    if (sit !== null) facts.push({ text: `Average time sitting: ${sit} hours per recorded day`, group: "habits" });
    const al = assessmentLine("lifestyle", "activity", input.responses);
    if (al) facts.push({ text: al, group: "assessment" });
    insights.push({
      id: "exercise",
      topic: "Exercise and physical activity",
      observation: `You recorded exercise on ${exercise.length} days, and on ${days} of them you exercised, averaging ${avg} minutes a day.`,
      supportingData: facts,
      explanation:
        "The AUA/ASRM guideline says clinicians may advise regular resistance or high-intensity exercise for sedentary men who have abnormal semen results, but it notes that the evidence is limited. WHO, Mayo Clinic and the guideline also link obesity with reduced fertility. This tracker does not record weight, so it cannot say anything about yours.",
      suggestions: ["A healthcare professional can advise on activity that suits your health and fitness."],
      limitations: "Evidence is limited, and your weight is not collected, so no conclusion about weight is drawn.",
      whenToConsult: "Check with a healthcare professional before starting a new intense exercise routine, especially if you have a health condition.",
      sourceIds: ["aua-asrm-2020", "who-infertility", "mayo-male-infertility"],
    });
  }

  // ---- Nutrition ----
  const fv = valuesOf(win, "fruitVeg");
  const meals = win.map((e) => e.mealPattern).filter((m): m is string => Boolean(m));
  if (enough("food", Math.max(fv.length, meals.length))) {
    const facts: Fact[] = [{ text: period, group: "habits" }];
    if (fv.length > 0) facts.push({ text: `Average fruit and vegetable portions: ${average(fv)} per recorded day (${fv.length} days)`, group: "habits" });
    const count = (k: string) => meals.filter((m) => m === k).length;
    if (meals.length > 0)
      facts.push({
        text: `Meals recorded on ${meals.length} days: ${count("mostly_home")} mostly home-cooked, ${count("mixed")} a mix, ${count("mostly_packaged")} mostly packaged or takeaway`,
        group: "habits",
      });
    insights.push({
      id: "nutrition",
      topic: "Food habits",
      observation: `You recorded food habits on ${Math.max(fv.length, meals.length)} days in the last ${windowDays} days.`,
      supportingData: facts,
      explanation:
        "WHO, Mayo Clinic and the AUA/ASRM guideline link obesity with reduced fertility. The sources we reviewed do not give specific food advice that we can quote, so this app does not say what to eat. Recording your pattern simply gives you something concrete to discuss.",
      suggestions: ["If you want food guidance, a doctor or a registered dietitian can give advice that fits you."],
      limitations: "No weight, supplement or portion size is collected, and the app cannot judge a diet from these entries.",
      whenToConsult: "Ask a healthcare professional before starting supplements or a strict diet.",
      sourceIds: ["who-infertility", "mayo-male-infertility", "aua-asrm-2020"],
    });
  }

  // ---- Heat ----
  const heat = valuesOf(win, "heatMinutes");
  if (enough("heat exposure", heat.length)) {
    const heatDays = heat.filter((m) => m > 0).length;
    const total = heat.reduce((a, b) => a + b, 0);
    const facts: Fact[] = [
      { text: period, group: "habits" },
      { text: `Days with heat exposure: ${heatDays} of ${heat.length} recorded days`, group: "habits" },
      { text: `Total heat exposure: ${total} minutes`, group: "habits" },
    ];
    const al = assessmentLine("lifestyle", "exposures", input.responses);
    if (al) facts.push({ text: al, group: "assessment" });
    insights.push({
      id: "heat",
      topic: "Heat exposure",
      observation: `You recorded heat exposure on ${heatDays} of ${heat.length} recorded days, ${total} minutes in total.`,
      supportingData: facts,
      explanation:
        "Mayo Clinic says saunas and hot tubs may lower sperm count for a time, and that long periods of sitting, laptop use and tight clothing may raise the temperature of the scrotum, adding that more research is needed. The NHS links a higher scrotal temperature with lower semen quality but says it is uncertain whether loose underwear helps. CDC lists frequent exposure of the testes to high temperatures as a factor.",
      suggestions:
        heatDays === 0
          ? ["No heat exposure was recorded on the days you logged. Keep logging if you want to see this over time."]
          : ["You may want to ask a healthcare professional whether these habits are worth changing for you."],
      limitations: "The sources say more research is needed. Effects of hot tubs and saunas are described as temporary.",
      whenToConsult: "Raise it at a fertility appointment if you are trying to conceive.",
      sourceIds: ["mayo-male-infertility", "nhs-infertility-causes", "cdc-infertility-faq"],
    });
  }

  // ---- Lab values next to habits (only when the caller passed labs) ----
  const semen = input.biomarkers.filter((b) => markerByKey(b.marker)?.category === "semen");
  if (semen.length > 0) {
    const latestDate = semen.reduce((d, b) => (b.takenOn > d ? b.takenOn : d), semen[0].takenOn);
    const latest = semen.filter((b) => b.takenOn === latestDate);
    const facts: Fact[] = [];
    for (const b of latest) {
      const def = markerByKey(b.marker);
      const earlier = semen.filter((x) => x.marker === b.marker && x.unit === b.unit && x.takenOn < latestDate).sort((a, c) => (a.takenOn < c.takenOn ? 1 : -1))[0];
      facts.push({
        text: `Latest ${def?.label.toLowerCase()}: ${b.value} ${b.unit}${earlier ? ` (the result before it: ${earlier.value} ${b.unit})` : ""}`,
        group: "labs",
      });
    }
    const before = inRange(input.entries, addDays(latestDate, -29), latestDate);
    const sl = average(valuesOf(before, "sleepHours"));
    const hd = valuesOf(before, "heatMinutes");
    const around: string[] = [];
    if (sl !== null) around.push(`average sleep ${sl} hours`);
    if (hd.length > 0) around.push(`${hd.filter((m) => m > 0).length} days with heat exposure out of ${hd.length} recorded`);
    if (around.length > 0) facts.push({ text: `In the 30 days up to your latest semen result you recorded: ${around.join(", ")}`, group: "habits" });
    insights.push({
      id: "labs",
      topic: "Your semen analysis values next to your habits",
      observation: `You recorded ${latest.length} semen analysis value${latest.length === 1 ? "" : "s"} from your most recent test${
        semen.some((b) => b.takenOn < latestDate) ? " and have earlier results too" : ""
      }. The habits you logged around that time are listed beside them.`,
      supportingData: facts,
      explanation:
        "MedlinePlus explains that semen analysis results can vary from one sample to the next and may need to be repeated, and that a healthcare professional interprets them together with other information. The AUA/ASRM guideline and the NHS describe semen analysis as the first test for men.",
      suggestions: [
        "Bring your original laboratory report and this summary to your appointment.",
        "Ask whether the test should be repeated, and when.",
      ],
      limitations: "This lines up numbers that were recorded at around the same time. It does not show that one caused the other, and it does not say what any value means.",
      whenToConsult: "A healthcare professional should interpret all laboratory values.",
      sourceIds: ["medlineplus-semen-analysis", "aua-asrm-2020", "nhs-infertility-diagnosis"],
    });
  }
  const hormones = input.biomarkers.filter((b) => markerByKey(b.marker)?.category === "hormone");
  if (hormones.length > 0) {
    const facts: Fact[] = [];
    for (const key of [...new Set(hormones.map((h) => `${h.marker}|${h.unit}`))]) {
      const rows = hormones.filter((h) => `${h.marker}|${h.unit}` === key).sort((a, b) => (a.takenOn < b.takenOn ? 1 : -1));
      const def = markerByKey(rows[0].marker);
      facts.push({ text: `Latest ${def?.label}: ${rows[0].value} ${rows[0].unit}${rows[1] ? ` (the result before it: ${rows[1].value} ${rows[0].unit})` : ""}`, group: "labs" });
    }
    insights.push({
      id: "hormones",
      topic: "Your hormone blood test values",
      observation: `You recorded ${facts.length} hormone value${facts.length === 1 ? "" : "s"}. The app only lists them. It does not say what they mean.`,
      supportingData: facts,
      explanation:
        "The NHS lists hormone problems among the causes of male infertility. Our source library has no page that explains hormone blood test results, so this app does not interpret them. Your own report prints its reference range, and a healthcare professional can explain it.",
      suggestions: ["Bring the original report to your appointment and ask what each value means for you."],
      limitations: "No reference range is supplied by this app, and no comparison with a range is made.",
      whenToConsult: "A healthcare professional should interpret all hormone results.",
      sourceIds: ["nhs-infertility-causes"],
    });
  }

  const daysLogged = win.length;
  if (daysLogged === 0) notes.push("You have no daily entries in this period yet. Add a few days in the Lifestyle tracker.");
  return { windowDays, daysLogged, insights, notes };
}

// Questions built by fixed rules from what the insights found. Used when AI is off or its reply is rejected.
export function ruleQuestions(insights: PatternInsight[]): string[] {
  const q: string[] = [];
  const has = (id: string) => insights.some((i) => i.id === id);
  if (has("sleep")) q.push("I have been recording my sleep. Is my sleep pattern worth discussing, and could it affect my results?");
  if (has("stress")) q.push("I have been rating my stress each day. Is it worth getting support for, and could it matter for fertility?");
  if (has("heat")) q.push("I recorded some heat exposure (for example hot tubs or saunas). Is it worth changing, and how strong is the evidence?");
  if (has("exercise")) q.push("Is the amount of exercise I do suitable for me, given my health?");
  if (has("nutrition")) q.push("Should I speak to a dietitian about my eating pattern?");
  if (has("labs")) q.push("Should my semen analysis be repeated, and when?");
  if (has("hormones")) q.push("What do my hormone results mean for me, based on the range on my lab report?");
  q.push("Which tests do you recommend first, and why?");
  q.push("When would you refer me to a specialist?");
  return q.slice(0, 6);
}

// The plain overview used when no AI summary is made. One sentence per observation.
export function ruleOverview(out: EngineOutput): string {
  if (out.insights.length === 0) return "There is not enough recorded information yet to describe any pattern.";
  return out.insights.map((i) => i.observation).join(" ");
}

export { round1 };
