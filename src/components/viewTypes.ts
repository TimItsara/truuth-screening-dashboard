export type AppView =
  | "home"
  | "resume"
  | "subjects"
  | "review"
  | "pep"
  | "reports"
  | "providers";

export const DEMO_MODE = true;

export const viewLabels: Record<AppView, string> = {
  home: "Home",
  resume: "Resume Intake",
  subjects: "Candidates",
  review: "Screening Results",
  pep: "PEP & Sanctions",
  reports: "Vendor Evidence",
  providers: "Provider Config",
};

export const fullViews: AppView[] = ["home", "resume", "subjects", "review", "pep", "reports", "providers"];
export const demoViews: AppView[] = ["resume", "review", "reports"];
export const visibleViews: AppView[] = DEMO_MODE ? demoViews : fullViews;
export const defaultView: AppView = DEMO_MODE ? "resume" : "review";
