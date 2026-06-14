export interface Student {
  id: string;
  // Backend auth User id (string). NeedleFeedback / error maps are keyed by user id,
  // NOT trainee id, so error lookups must use this. Optional: mock rows omit it.
  userId?: string;
  // Real per-trainee aggregates from the trainees API (NeedleFeedback-derived).
  casesPassed?: number;
  totalAttempts?: number;
  name: string;
  avatar: string;
  unit: "Anesthesia" | "Surgery" | "Internal Medicine" | "Advanced Practice Providers";
  walkthroughComplete: number; // 0-100
  verificationStatus: "Not Started" | "In Progress" | "Verified";
  latestScore: number;
  lastActivity: string;
  deadline: string;
  daysRemaining: number;
  needsPractice: boolean;
  currentModule: string;
  cohort?: string;
}

export interface ErrorType {
  name: string;
  count: number;
  severity: "critical" | "moderate" | "minor";
}

export interface PatientCase {
  id: number;
  caseName: string;
  patientName: string;
  race: string;
  sex: string;
  age: number;
  preexistingConditions: string;
  symptoms: string;
  difficulty: "Easy" | "Moderate" | "Hard";
  errorRate: number;
  avgScore: number;
  attempts: number;
  completions: number;
  topErrors: string[];
}

export const students: Student[] = [
  { id: "1", name: "Sarah Chen", avatar: "SC", unit: "Anesthesia", walkthroughComplete: 100, verificationStatus: "Verified", latestScore: 94, lastActivity: "2 hrs ago", deadline: "2026-02-20", daysRemaining: 9, needsPractice: false, currentModule: "Module 5: Advanced Lines", cohort: "Spring 2026 Anesthesia" },
  { id: "2", name: "James Rodriguez", avatar: "JR", unit: "Surgery", walkthroughComplete: 72, verificationStatus: "In Progress", latestScore: 68, lastActivity: "1 day ago", deadline: "2026-02-14", daysRemaining: 3, needsPractice: true, currentModule: "Module 3: Femoral Access", cohort: "Spring 2026 Surgery" },
  { id: "3", name: "Emily Thompson", avatar: "ET", unit: "Internal Medicine", walkthroughComplete: 45, verificationStatus: "Not Started", latestScore: 55, lastActivity: "3 days ago", deadline: "2026-02-12", daysRemaining: 1, needsPractice: true, currentModule: "Module 2: Ultrasound Guidance", cohort: "Spring 2026 IM" },
  { id: "4", name: "Michael Park", avatar: "MP", unit: "Anesthesia", walkthroughComplete: 100, verificationStatus: "In Progress", latestScore: 82, lastActivity: "5 hrs ago", deadline: "2026-02-25", daysRemaining: 14, needsPractice: false, currentModule: "Module 5: Advanced Lines", cohort: "Spring 2026 Anesthesia" },
  { id: "5", name: "Aisha Patel", avatar: "AP", unit: "Surgery", walkthroughComplete: 88, verificationStatus: "In Progress", latestScore: 76, lastActivity: "12 hrs ago", deadline: "2026-02-18", daysRemaining: 7, needsPractice: false, currentModule: "Module 4: Subclavian Access", cohort: "Spring 2026 Surgery" },
  { id: "6", name: "David Kim", avatar: "DK", unit: "Internal Medicine", walkthroughComplete: 0, verificationStatus: "Not Started", latestScore: 42, lastActivity: "5 days ago", deadline: "2026-02-11", daysRemaining: 0, needsPractice: true, currentModule: "Module 1: Anatomy Review", cohort: "Spring 2026 IM" },
  { id: "7", name: "Lisa Wang", avatar: "LW", unit: "Anesthesia", walkthroughComplete: 100, verificationStatus: "Verified", latestScore: 97, lastActivity: "1 hr ago", deadline: "2026-02-28", daysRemaining: 17, needsPractice: false, currentModule: "Module 5: Advanced Lines", cohort: "Spring 2026 Anesthesia" },
  { id: "8", name: "Ryan Foster", avatar: "RF", unit: "Surgery", walkthroughComplete: 60, verificationStatus: "Not Started", latestScore: 61, lastActivity: "2 days ago", deadline: "2026-02-13", daysRemaining: 2, needsPractice: true, currentModule: "Module 3: Femoral Access", cohort: "Spring 2026 Surgery" },
  { id: "9", name: "Maria Gonzalez", avatar: "MG", unit: "Internal Medicine", walkthroughComplete: 95, verificationStatus: "In Progress", latestScore: 88, lastActivity: "4 hrs ago", deadline: "2026-02-22", daysRemaining: 11, needsPractice: false, currentModule: "Module 5: Advanced Lines", cohort: "Spring 2026 IM" },
  { id: "10", name: "Tom Bradley", avatar: "TB", unit: "Anesthesia", walkthroughComplete: 0, verificationStatus: "Not Started", latestScore: 38, lastActivity: "1 week ago", deadline: "2026-02-10", daysRemaining: -1, needsPractice: true, currentModule: "Module 1: Anatomy Review", cohort: "Spring 2026 Anesthesia" },
  { id: "11", name: "Rachel Nguyen", avatar: "RN", unit: "Advanced Practice Providers", walkthroughComplete: 80, verificationStatus: "In Progress", latestScore: 79, lastActivity: "6 hrs ago", deadline: "2026-02-19", daysRemaining: 8, needsPractice: false, currentModule: "Module 4: Subclavian Access", cohort: "Spring 2026 APP" },
  { id: "12", name: "Chris Howard", avatar: "CH", unit: "Advanced Practice Providers", walkthroughComplete: 55, verificationStatus: "Not Started", latestScore: 52, lastActivity: "2 days ago", deadline: "2026-02-15", daysRemaining: 4, needsPractice: true, currentModule: "Module 2: Ultrasound Guidance", cohort: "Spring 2026 APP" },
];

export const errorTypes: ErrorType[] = [
  { name: "Arterial Puncture", count: 23, severity: "critical" },
  { name: "Through-and-Through", count: 18, severity: "critical" },
  { name: "Guidewire Misplacement", count: 15, severity: "moderate" },
  { name: "Prolonged Arrhythmia", count: 12, severity: "critical" },
  { name: "Excessive Cannulation Attempts", count: 9, severity: "moderate" },
  { name: "Failed Cannulation Attempts", count: 6, severity: "critical" },
];

export const patientCases: PatientCase[] = [
  { id: 1, caseName: "Case 1: Doebuck, James", patientName: "Doebuck, James", race: "Black", sex: "M", age: 66, preexistingConditions: "N/A", symptoms: "Closed head injury after motor vehicle collision. Requires central line for 3% saline administration.", difficulty: "Easy", errorRate: 8, avgScore: 91, attempts: 142, completions: 131, topErrors: ["Guidewire Misplacement"] },
  { id: 2, caseName: "Case 2: Miller, Vincent", patientName: "Miller, Vincent", race: "Asian", sex: "M", age: 28, preexistingConditions: "N/A", symptoms: "Thin patient, needs plasmapheresis.", difficulty: "Easy", errorRate: 10, avgScore: 88, attempts: 138, completions: 124, topErrors: ["Excessive Cannulation Attempts"] },
  { id: 3, caseName: "Case 3: Washington, Simone", patientName: "Washington, Simone", race: "Black", sex: "M", age: 62, preexistingConditions: "N/A", symptoms: "Hemodynamically unstable after falling off roof. Multiple injuries.", difficulty: "Moderate", errorRate: 22, avgScore: 74, attempts: 115, completions: 90, topErrors: ["Arterial Puncture", "Through-and-Through"] },
  { id: 4, caseName: "Case 4: Gonzalez, Jessica", patientName: "Gonzalez, Jessica", race: "Black, Hispanic", sex: "F", age: 41, preexistingConditions: "End stage kidney disease", symptoms: "Severe hyperkalemia. Requires dialysis.", difficulty: "Easy", errorRate: 12, avgScore: 85, attempts: 130, completions: 114, topErrors: ["Guidewire Misplacement"] },
  { id: 5, caseName: "Case 5: Johnston, Helena", patientName: "Johnston, Helena", race: "Caucasian, Hispanic", sex: "F", age: 25, preexistingConditions: "N/A", symptoms: "Thin patient. Unable to obtain peripheral access.", difficulty: "Moderate", errorRate: 25, avgScore: 71, attempts: 108, completions: 81, topErrors: ["Arterial Puncture", "Prolonged Arrhythmia"] },
  { id: 6, caseName: "Case 6: Brown, Christina", patientName: "Brown, Christina", race: "Black", sex: "F", age: 65, preexistingConditions: "N/A", symptoms: "Obese, difficulty obtaining stable IV.", difficulty: "Hard", errorRate: 42, avgScore: 58, attempts: 87, completions: 50, topErrors: ["Arterial Puncture", "Through-and-Through", "Failed Cannulation Attempts"] },
  { id: 7, caseName: "Case 7: Stevenson, Kawhi", patientName: "Stevenson, Kawhi", race: "Black", sex: "M", age: 44, preexistingConditions: "Minimal change disease", symptoms: "Requires dialysis. Multiple scars from previous CVC access sites.", difficulty: "Easy", errorRate: 9, avgScore: 90, attempts: 135, completions: 123, topErrors: ["Excessive Cannulation Attempts"] },
  { id: 8, caseName: "Case 8: Sparrow, Timmothy", patientName: "Sparrow, Timmothy", race: "Caucasian", sex: "M", age: 25, preexistingConditions: "N/A", symptoms: "Closed head injury after skateboarding accident. Central line needed for hypertonic saline and possible vasopressors.", difficulty: "Moderate", errorRate: 28, avgScore: 69, attempts: 102, completions: 73, topErrors: ["Through-and-Through", "Guidewire Misplacement"] },
  { id: 9, caseName: "Case 9: Castell, Heather", patientName: "Castell, Heather", race: "Caucasian, Hispanic", sex: "F", age: 52, preexistingConditions: "Atrial fibrillation, DM, peripheral vascular disease, diabetes mellitus", symptoms: "Obese, massive hematochezia.", difficulty: "Hard", errorRate: 38, avgScore: 61, attempts: 94, completions: 58, topErrors: ["Arterial Puncture", "Prolonged Arrhythmia", "Through-and-Through"] },
  { id: 10, caseName: "Case 10: Smith, Anna", patientName: "Smith, Anna", race: "Caucasian", sex: "F", age: 82, preexistingConditions: "N/A", symptoms: "Severe dehydration, bowel obstruction, hemodynamically unstable.", difficulty: "Easy", errorRate: 11, avgScore: 87, attempts: 128, completions: 114, topErrors: ["Guidewire Misplacement"] },
  { id: 11, caseName: "Case 11: Jacobson, Devin", patientName: "Jacobson, Devin", race: "Caucasian", sex: "M", age: 65, preexistingConditions: "CHF", symptoms: "Morbidly obese, intubated. Very thick neck, extremely edematous.", difficulty: "Moderate", errorRate: 20, avgScore: 76, attempts: 110, completions: 88, topErrors: ["Excessive Cannulation Attempts", "Arterial Puncture"] },
  { id: 12, caseName: "Case 12: Shoemaker, Ashley", patientName: "Shoemaker, Ashley", race: "Caucasian", sex: "F", age: 15, preexistingConditions: "N/A", symptoms: "Ingested large quantity of prescription medications. Somnolence. Severe electrolyte abnormality.", difficulty: "Hard", errorRate: 35, avgScore: 64, attempts: 92, completions: 60, topErrors: ["Failed Cannulation Attempts", "Through-and-Through"] },
  { id: 13, caseName: "Case 13: Steinlan, John", patientName: "Steinlan, John", race: "Caucasian", sex: "M", age: 33, preexistingConditions: "Diabetes Mellitus, COPD, CHF", symptoms: "Morbidly obese. Necrotizing fasciitis. Requires CVC prior to debridement and hemodynamic support.", difficulty: "Easy", errorRate: 7, avgScore: 93, attempts: 145, completions: 135, topErrors: ["Guidewire Misplacement"] },
  { id: 14, caseName: "Case 14: Zhang, Colin", patientName: "Zhang, Colin", race: "Asian", sex: "M", age: 67, preexistingConditions: "N/A", symptoms: "In ICU for several weeks after motor vehicle accident. Edematous, acute renal failure. Requires CVC for acute hemodialysis.", difficulty: "Moderate", errorRate: 24, avgScore: 72, attempts: 105, completions: 80, topErrors: ["Arterial Puncture", "Excessive Cannulation Attempts"] },
  { id: 15, caseName: "Case 15: Nash, Jeff", patientName: "Nash, Jeff", race: "Caucasian", sex: "M", age: 25, preexistingConditions: "N/A", symptoms: "Gunshot wound to abdomen. Significant blood loss. Tachycardic and hypovolemic.", difficulty: "Hard", errorRate: 40, avgScore: 59, attempts: 88, completions: 53, topErrors: ["Arterial Puncture", "Through-and-Through", "Prolonged Arrhythmia"] },
  { id: 16, caseName: "Case 16: Carr, John", patientName: "Carr, John", race: "Caucasian", sex: "M", age: 65, preexistingConditions: "Cardiac problems requiring coronary artery bypass grafting", symptoms: "Previous lower respiratory tract infection, hypotension, pale and cool extremities, altered mentation.", difficulty: "Easy", errorRate: 13, avgScore: 84, attempts: 125, completions: 109, topErrors: ["Excessive Cannulation Attempts"] },
  { id: 17, caseName: "Case 17: Wilson, Alan", patientName: "Wilson, Alan", race: "Asian", sex: "M", age: 22, preexistingConditions: "N/A", symptoms: "Level 1 trauma after vehicle collision. Left open femur fracture requiring operative management. Tachycardic, hypotensive. Muscular neck.", difficulty: "Moderate", errorRate: 26, avgScore: 70, attempts: 100, completions: 74, topErrors: ["Through-and-Through", "Guidewire Misplacement"] },
];

export const summaryStats = {
  totalStudents: students.length,
  activeToday: students.filter((s) => s.lastActivity.includes("hr")).length,
  completedCourse: students.filter((s) => s.walkthroughComplete === 100 && s.verificationStatus === "Verified").length,
  completedPercent: Math.round((students.filter((s) => s.walkthroughComplete === 100 && s.verificationStatus === "Verified").length / students.length) * 100),
  licensesUsed: 12,
  licensesTotal: 200,
};
