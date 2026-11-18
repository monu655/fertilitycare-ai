// The lab values a person may record. Safe to import from browser code.
// The app never supplies a reference range: any range shown is only what the person copied from their own report.

export type MarkerCategory = "semen" | "hormone";

export type MarkerDef = {
  key: string;
  label: string;
  category: MarkerCategory;
  units: string[];
  // Plain meaning of the term. Hormone entries only expand the name: the source library has no hormone page yet.
  meaning: string;
};

export const MARKERS: MarkerDef[] = [
  { key: "semen_volume", label: "Semen volume", category: "semen", units: ["mL"], meaning: "How much semen was in the sample." },
  { key: "sperm_concentration", label: "Sperm concentration", category: "semen", units: ["million per mL"], meaning: "How many sperm were counted in each millilitre of semen." },
  { key: "sperm_total_count", label: "Total sperm count", category: "semen", units: ["million"], meaning: "How many sperm were counted in the whole sample." },
  { key: "total_motility", label: "Total motility", category: "semen", units: ["%"], meaning: "The share of sperm that were moving." },
  { key: "progressive_motility", label: "Progressive motility", category: "semen", units: ["%"], meaning: "The share of sperm that were moving forward." },
  { key: "morphology", label: "Morphology (normal forms)", category: "semen", units: ["%"], meaning: "The share of sperm with the shape the laboratory counts as typical." },
  { key: "total_testosterone", label: "Total testosterone", category: "hormone", units: ["nmol/L", "ng/dL"], meaning: "A hormone measured in a blood test." },
  { key: "fsh", label: "FSH (follicle-stimulating hormone)", category: "hormone", units: ["IU/L"], meaning: "A hormone measured in a blood test." },
  { key: "lh", label: "LH (luteinizing hormone)", category: "hormone", units: ["IU/L"], meaning: "A hormone measured in a blood test." },
  { key: "prolactin", label: "Prolactin", category: "hormone", units: ["ng/mL", "mIU/L"], meaning: "A hormone measured in a blood test." },
  { key: "estradiol", label: "Estradiol", category: "hormone", units: ["pg/mL", "pmol/L"], meaning: "A hormone measured in a blood test." },
];

export function markerByKey(key: string): MarkerDef | undefined {
  return MARKERS.find((m) => m.key === key);
}

export const CATEGORY_LABEL: Record<MarkerCategory, string> = {
  semen: "Semen analysis",
  hormone: "Hormone blood tests",
};
