export type AppView =
  | "home"
  | "subjects"
  | "review"
  | "pep"
  | "reports"
  | "providers";

export const viewLabels: Record<AppView, string> = {
  home: "Home",
  subjects: "Subject Management",
  review: "Adverse Media Review",
  pep: "PEP & Sanctions",
  reports: "Compliance Reports",
  providers: "Provider Config",
};
