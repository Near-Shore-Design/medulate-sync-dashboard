import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, AlertTriangle, KeyRound, ShoppingCart, Upload, Sparkles, Target, ArrowRight } from "lucide-react";
import { summaryStats as mockSummaryStats, students as mockStudents, errorTypes as mockErrorTypes, patientCases as mockPatientCases } from "@/data/mockData";
import { useTrainees } from "@/hooks/useTrainees";
import { usePatientCases } from "@/hooks/useCases";
import { useErrorTypes, useStudentErrorMap } from "@/hooks/useErrors";
import { useLicenseStats } from "@/hooks/useLicenses";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import BatchUploadModal from "./BatchUploadModal";
import PurchaseLicensesModal from "./PurchaseLicensesModal";

interface SummaryCardsProps {
  activeUnit: string;
  onUnitChange: (unit: string) => void;
}

const units = ["All", "Anesthesia", "Surgery", "Internal Medicine", "Advanced Practice Providers"];

const progressCategories = [
  { name: "Walkthrough Complete", color: "hsl(217, 91%, 60%)" },
  { name: "Verification Done", color: "hsl(210, 78%, 46%)" },
  { name: "Not Started", color: "hsl(214, 32%, 78%)" },
];

const SummaryCards = ({ activeUnit, onUnitChange }: SummaryCardsProps) => {
  const navigate = useNavigate();
  const [batchOpen, setBatchOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const { data: apiStudents } = useTrainees();
  const { data: apiCases } = usePatientCases();
  const { data: apiErrorTypes } = useErrorTypes();
  const { data: apiStudentErrorMap } = useStudentErrorMap();
  const { data: apiLicenseStats } = useLicenseStats();

  const students = apiStudents ?? mockStudents;
  const patientCases = apiCases ?? mockPatientCases;
  const errorTypes = apiErrorTypes ?? mockErrorTypes;
  const summaryStats = apiLicenseStats
    ? { licensesUsed: apiLicenseStats.used, licensesTotal: apiLicenseStats.total }
    : mockSummaryStats;

  const studentErrors: Record<string, string[]> = apiStudentErrorMap ?? {};
  const { licensesUsed, licensesTotal } = summaryStats;
  const usagePercent = licensesTotal > 0 ? Math.round((licensesUsed / licensesTotal) * 100) : 0;

  const unitStudents = activeUnit === "All" ? students : students.filter((s) => s.unit === activeUnit);
  const totalStudents = unitStudents.length;
  const activeToday = unitStudents.filter((s) => s.lastActivity.includes("hr")).length;
  const completedCount = unitStudents.filter((s) => s.walkthroughComplete === 100 && s.verificationStatus === "Verified").length;
  const completedPercent = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0;

  const needsPracticeCount = unitStudents.filter((s) => s.needsPractice).length;
  const overdueOrCloseCount = unitStudents.filter((s) => s.daysRemaining <= 3).length;
  const needAttentionTotal = new Set([
    ...unitStudents.filter((s) => s.needsPractice).map((s) => s.id),
    ...unitStudents.filter((s) => s.daysRemaining <= 3).map((s) => s.id),
  ]).size;

  const walkthroughDone = unitStudents.filter((s) => s.walkthroughComplete === 100).length;
  const verificationDone = unitStudents.filter((s) => s.verificationStatus === "Verified").length;
  const notStarted = unitStudents.filter((s) => s.walkthroughComplete === 0).length;

  const progressData = [
    { name: "Walkthrough Complete", value: totalStudents > 0 ? Math.round((walkthroughDone / totalStudents) * 100) : 0, count: walkthroughDone },
    { name: "Verification Done", value: totalStudents > 0 ? Math.round((verificationDone / totalStudents) * 100) : 0, count: verificationDone },
    { name: "Not Started", value: totalStudents > 0 ? Math.round((notStarted / totalStudents) * 100) : 0, count: notStarted },
  ];

  const getOverdueStudents = (categoryName: string) => {
    let categoryStudents = unitStudents;
    if (categoryName === "Walkthrough Complete") categoryStudents = unitStudents.filter((s) => s.walkthroughComplete === 100);
    else if (categoryName === "Verification Done") categoryStudents = unitStudents.filter((s) => s.verificationStatus === "Verified");
    else if (categoryName === "Not Started") categoryStudents = unitStudents.filter((s) => s.walkthroughComplete === 0);
    return categoryStudents.filter((s) => s.daysRemaining <= 3);
  };

  // Unit-filtered error counts
  const unitErrorCounts = unitStudents.reduce<Record<string, number>>((acc, s) => {
    (studentErrors[s.userId ?? ""] || []).forEach((err) => { acc[err] = (acc[err] || 0) + 1; });
    return acc;
  }, {});
  const totalUnitErrors = Object.values(unitErrorCounts).reduce((a, b) => a + b, 0);
  const topErrors = Object.entries(unitErrorCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const hardCases = patientCases.filter((c) => c.difficulty === "Hard").length;
  const avgPassRate = Math.round(patientCases.reduce((s, c) => s + (100 - c.errorRate), 0) / patientCases.length);

  return (
    <div className="space-y-4">
      {/* Unit filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground mr-1">Unit:</span>
        {units.map((unit) => (
          <button
            key={unit}
            onClick={() => onUnitChange(unit)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeUnit === unit
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {unit}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Card 1: Students + Training Progress + Needs Attention */}
        <Link to="/students" className="block rounded-xl bg-card p-5 shadow-card animate-fade-in hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Students</p>
              <p className="text-3xl font-bold leading-tight text-foreground">{totalStudents}</p>
            </div>
          </div>
          <div className="space-y-1.5 border-t pt-3 mb-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Active today</span>
              <span className="font-semibold text-foreground">{activeToday}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Course completed</span>
              <span className="font-semibold text-success">{completedPercent}% ({completedCount})</span>
            </div>
          </div>

          {/* Training Progress - display only, clicking navigates */}
          <div className="border-t pt-3 mb-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Training Progress</p>
            <div className="space-y-2">
              {progressData.map((item, idx) => {
                const cat = progressCategories[idx];
                const overdueStudents = getOverdueStudents(item.name);
                const overdueCount = overdueStudents.length;
                return (
                  <div key={item.name} className="rounded-md px-1.5 py-1 -mx-1.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-medium text-foreground">{item.name}</span>
                      <span className="text-[10px] font-bold text-foreground">{item.value}% ({item.count})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="relative h-2 flex-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.value}%`, backgroundColor: cat.color }} />
                      </div>
                      {overdueCount > 0 && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                              className="flex items-center gap-0.5 shrink-0 rounded px-1 py-0.5 text-[9px] font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
                            >
                              {overdueCount} ⚠
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-3" side="right" align="start">
                            <p className="text-xs font-semibold text-foreground mb-2">{overdueCount} overdue / close to deadline</p>
                            <div className="space-y-1.5 mb-3">
                              {overdueStudents.map((s) => (
                                <div key={s.id} className="flex items-center justify-between text-xs">
                                  <span className="text-foreground">{s.name}</span>
                                  <span className={`font-semibold ${s.daysRemaining < 0 ? "text-destructive" : "text-warning"}`}>{s.daysRemaining < 0 ? "Overdue" : `${s.daysRemaining}d left`}</span>
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate("/students", { state: { statusFilter: "Overdue" } });
                              }}
                              className="text-[11px] font-medium text-primary hover:underline"
                            >
                              View these students →
                            </button>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Needs Attention */}
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" />
              <span className="text-[10px] font-semibold text-foreground uppercase tracking-wide">Need Attention: {needAttentionTotal}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Need more practice</span>
                <span className="font-semibold text-destructive">{needsPracticeCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Overdue / close to due</span>
                <span className="font-semibold text-destructive">{overdueOrCloseCount}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Card 2: Common Errors & Cases */}
        <Link to="/cases" className="block rounded-xl bg-card p-5 shadow-card animate-fade-in hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Errors & Cases</p>
              <p className="text-3xl font-bold leading-tight text-foreground">{totalUnitErrors} <span className="text-lg text-muted-foreground font-normal">errors</span></p>
            </div>
          </div>

          <div className="space-y-1.5 border-t pt-3 mb-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Avg pass rate</span>
              <span className="font-semibold text-success">{avgPassRate}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Hard cases</span>
              <span className="font-semibold text-destructive">{hardCases}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total cases</span>
              <span className="font-semibold text-foreground">{patientCases.length}</span>
            </div>
          </div>

          {topErrors.length > 0 && (
            <div className="border-t pt-3 mb-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Top Errors ({activeUnit})</p>
              <div className="space-y-1.5">
                {topErrors.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate mr-2">{name}</span>
                    <span className="font-semibold text-destructive">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Hardest Cases</p>
            <div className="space-y-1.5">
              {patientCases.filter((c) => c.difficulty === "Hard").slice(0, 3).map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs">
                  <span className="text-foreground truncate mr-2">{c.caseName}</span>
                  <span className="font-semibold text-destructive">{c.errorRate}% err</span>
                </div>
              ))}
            </div>
          </div>

          <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
            View all cases <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>

        {/* Card 3: Licenses & Access */}
        <Link to="/licenses" className="block rounded-xl bg-card p-5 shadow-card animate-fade-in hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Licenses & Access</p>
              <p className="text-3xl font-bold leading-tight text-foreground">{licensesUsed}<span className="text-lg text-muted-foreground font-normal">/{licensesTotal}</span></p>
            </div>
          </div>

          <div className="mb-3">
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${usagePercent}%`,
                  background: usagePercent > 85 ? "hsl(0, 65%, 48%)" : usagePercent > 65 ? "hsl(38, 92%, 50%)" : "hsl(217, 91%, 60%)",
                }}
              />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {usagePercent > 85 ? "⚠ Running low on licenses" : `${licensesTotal - licensesUsed} licenses available`}
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t" onClick={(e) => e.preventDefault()}>
            <Button className="w-full justify-start gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-none" variant="outline" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPurchaseOpen(true); }}>
              <ShoppingCart className="h-3.5 w-3.5" /> Purchase Licenses
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBatchOpen(true); }}>
              <Upload className="h-3.5 w-3.5" /> Start New Training Cohort
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <Sparkles className="h-3.5 w-3.5" /> Assign Practice
            </Button>
          </div>

          <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
            Manage licenses & access <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>

      <BatchUploadModal open={batchOpen} onClose={() => setBatchOpen(false)} />
      <PurchaseLicensesModal open={purchaseOpen} onClose={() => setPurchaseOpen(false)} />
    </div>
  );
};

export default SummaryCards;
