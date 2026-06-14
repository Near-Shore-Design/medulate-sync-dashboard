import { useState } from "react";
import { students as mockStudents, type Student, errorTypes } from "@/data/mockData";
import { useTrainees } from "@/hooks/useTrainees";
import { useStudentErrorMap } from "@/hooks/useErrors";
import { MoreHorizontal, Flag, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentDetailModal from "./StudentDetailModal";

const getDeadlineBadge = (days: number) => {
  if (days < 0) return { text: "Overdue", className: "bg-destructive/10 text-destructive" };
  if (days <= 3) return { text: `${days}d left`, className: "bg-destructive/10 text-destructive" };
  if (days <= 7) return { text: `${days}d left`, className: "bg-warning/10 text-warning" };
  return { text: `${days}d left`, className: "bg-success/10 text-success" };
};

const getVerificationBadge = (status: Student["verificationStatus"]) => {
  switch (status) {
    case "Verified":
      return "bg-success/10 text-success";
    case "In Progress":
      return "bg-info/10 text-info";
    default:
      return "bg-muted text-muted-foreground";
  }
};

type SortKey = "name" | "unit" | "walkthrough" | "verification" | "deadline" | "errors" | "status";
type SortDir = "asc" | "desc";

interface StudentTableProps {
  activeUnit: string;
  activeStatus?: string;
  activeError?: string;
  dashboardMode?: boolean;
}

const StudentTable = ({ activeUnit, activeStatus, activeError, dashboardMode }: StudentTableProps) => {
  const { data: apiStudents } = useTrainees();
  const { data: apiStudentErrorMap } = useStudentErrorMap();
  const students = apiStudents ?? mockStudents;
  const studentErrors: Record<string, string[]> = apiStudentErrorMap ?? {};

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  let filtered = activeUnit === "All"
    ? students
    : students.filter((s) => s.unit === activeUnit);

  // Filter by progress chart status
  if (activeStatus) {
    const isOverdueFilter = activeStatus.endsWith(":overdue");
    const statusName = isOverdueFilter ? activeStatus.replace(":overdue", "") : activeStatus;

    if (statusName === "Walkthrough Complete") {
      filtered = filtered.filter((s) => s.walkthroughComplete === 100);
    } else if (statusName === "Verification Done") {
      filtered = filtered.filter((s) => s.verificationStatus === "Verified");
    } else if (statusName === "Not Started") {
      filtered = filtered.filter((s) => s.walkthroughComplete === 0);
    }

    if (isOverdueFilter) {
      filtered = filtered.filter((s) => s.daysRemaining <= 3);
    }
  }

  // Filter by error type
  if (activeError) {
    filtered = filtered.filter((s) => studentErrors[s.userId ?? ""]?.includes(activeError));
  }

  // Dashboard mode: only show students who need attention
  if (dashboardMode) {
    filtered = filtered.filter((s) => s.needsPractice || s.daysRemaining <= 3);
  }

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "name": cmp = a.name.localeCompare(b.name); break;
      case "unit": cmp = a.unit.localeCompare(b.unit); break;
      case "walkthrough": cmp = a.walkthroughComplete - b.walkthroughComplete; break;
      case "verification": cmp = a.verificationStatus.localeCompare(b.verificationStatus); break;
      case "deadline": cmp = a.daysRemaining - b.daysRemaining; break;
      case "errors": cmp = (studentErrors[a.userId ?? ""]?.length || 0) - (studentErrors[b.userId ?? ""]?.length || 0); break;
      case "status": cmp = (a.needsPractice ? 0 : 1) - (b.needsPractice ? 0 : 1); break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === field ? "text-primary" : "text-muted-foreground/40"}`} />
      </div>
    </th>
  );

  return (
    <>
      <div className="rounded-xl bg-card shadow-card animate-fade-in overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {dashboardMode ? "Students Needing Attention" : "Student Progress"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {sorted.length} students
              {activeStatus && <span className="ml-1 text-primary font-medium">· Status: {activeStatus}</span>}
              {activeError && <span className="ml-1 text-destructive font-medium">· Error: {activeError}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="text-xs">
              Assign Practice
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-b bg-muted/50">
                <SortHeader label="Student" field="name" />
                <SortHeader label="Unit" field="unit" />
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cohort</th>
                <SortHeader label="Deadline" field="deadline" />
                <SortHeader label="Walkthrough" field="walkthrough" />
                <SortHeader label="Verification" field="verification" />
                <SortHeader label="Errors" field="errors" />
                <SortHeader label="Status" field="status" />
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((student) => {
                const deadline = getDeadlineBadge(student.daysRemaining);
                const errors = studentErrors[student.userId ?? ""] || [];
                return (
                  <tr
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`border-b transition-colors hover:bg-muted/30 cursor-pointer ${
                      student.needsPractice ? "bg-destructive/[0.02]" : ""
                    }`}
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {student.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-[13px] hover:text-primary transition-colors">{student.name}</p>
                          <p className="text-[11px] text-muted-foreground">{student.lastActivity}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-muted-foreground">{student.unit}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[10px] text-primary font-medium">{student.cohort || "—"}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div>
                        <span className="text-xs text-foreground">{new Date(student.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        <span className={`ml-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${deadline.className}`}>
                          {deadline.text}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${student.walkthroughComplete}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-foreground">{student.walkthroughComplete}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${getVerificationBadge(student.verificationStatus)}`}>
                        {student.verificationStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {errors.length > 0 ? (
                        <span className="text-[10px] font-semibold text-destructive">{errors.length} errors</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {student.needsPractice ? (
                        <div className="flex items-center gap-1 text-destructive">
                          <Flag className="h-3 w-3 fill-current" />
                          <span className="text-[10px] font-semibold">Needs Practice</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-success font-medium">On Track</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No students match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StudentDetailModal
        student={selectedStudent}
        open={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </>
  );
};

export default StudentTable;
