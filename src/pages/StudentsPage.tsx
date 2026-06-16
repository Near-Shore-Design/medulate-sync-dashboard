import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { students as mockStudents, errorTypes as mockErrorTypes, type Student } from "@/data/mockData";
import { useTrainees, useUnenrollTrainee } from "@/hooks/useTrainees";
import { useErrorTypes, useStudentErrorMap } from "@/hooks/useErrors";
import { useSendMessage } from "@/hooks/useMessages";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Flag, Search, Send, ArrowUpDown, Plus, Users, CheckCircle, AlertTriangle, BookOpen, Clock, TrendingUp, Mail, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import StudentDetailModal from "@/components/dashboard/StudentDetailModal";
import ErrorAnalytics from "@/components/dashboard/ErrorAnalytics";

const units = ["All", "Anesthesia", "Surgery", "Internal Medicine", "Advanced Practice Providers"];

type SortKey = "name" | "unit" | "deadline" | "walkthrough" | "verification" | "errors" | "status";
type SortDir = "asc" | "desc";

const getDeadlineBadge = (days: number) => {
  if (days < 0) return { text: "Overdue", className: "bg-destructive/10 text-destructive" };
  if (days <= 3) return { text: `${days}d left`, className: "bg-destructive/10 text-destructive" };
  if (days <= 7) return { text: `${days}d left`, className: "bg-warning/10 text-warning" };
  return { text: `${days}d left`, className: "bg-success/10 text-success" };
};

const getVerificationBadge = (status: Student["verificationStatus"]) => {
  switch (status) {
    case "Verified": return "bg-success/10 text-success";
    case "In Progress": return "bg-info/10 text-info";
    default: return "bg-muted text-muted-foreground";
  }
};

const StudentsPage = () => {
  const location = useLocation();
  const navState = location.state as { statusFilter?: string } | null;

  // API data with mock fallback
  const { data: apiStudents } = useTrainees();
  const { data: apiErrorTypes } = useErrorTypes();
  const { data: apiStudentErrorMap } = useStudentErrorMap();
  const students = apiStudents ?? mockStudents;
  const errorTypes = apiErrorTypes ?? mockErrorTypes;
  const studentErrors: Record<string, string[]> = apiStudentErrorMap ?? {};

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchName, setSearchName] = useState("");
  const [filterUnit, setFilterUnit] = useState("All");
  const [filterWalkthrough, setFilterWalkthrough] = useState("All");
  const [filterVerification, setFilterVerification] = useState("All");
  const [filterDeadline, setFilterDeadline] = useState("All");
  const [filterErrors, setFilterErrors] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [messageStudent, setMessageStudent] = useState<Student | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messageSent, setMessageSent] = useState(false);
  const [addModuleStudent, setAddModuleStudent] = useState<Student | null>(null);
  // Unenroll
  const { toast } = useToast();
  const unenrollTrainee = useUnenrollTrainee();
  const [unenrollStudent, setUnenrollStudent] = useState<Student | null>(null);

  const handleUnenroll = () => {
    if (!unenrollStudent) return;
    const name = unenrollStudent.name;
    unenrollTrainee.mutate(unenrollStudent.id, {
      onSuccess: () => {
        toast({ title: "Trainee unenrolled", description: `${name} has been removed from the roster. Their account and history are preserved.` });
        setUnenrollStudent(null);
        if (selectedStudent?.id === unenrollStudent.id) setSelectedStudent(null);
      },
      onError: (e: unknown) => {
        toast({ title: "Couldn't unenroll", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
      },
    });
  };

  // Bulk email
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [bulkEmailCategory, setBulkEmailCategory] = useState("");
  const [bulkEmailText, setBulkEmailText] = useState("");
  const [bulkEmailSent, setBulkEmailSent] = useState(false);

  // Error filter for analytics
  const [activeErrors, setActiveErrors] = useState<string[]>([]);

  useEffect(() => {
    if (navState?.statusFilter) {
      if (navState.statusFilter === "Overdue") setFilterDeadline("Overdue");
      else if (navState.statusFilter === "Not Started") setFilterWalkthrough("Not Started");
      else if (navState.statusFilter === "Needs Practice") setFilterStatus("Needs Practice");
    }
  }, [navState]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  let filtered = [...students];
  if (searchName) filtered = filtered.filter((s) => s.name.toLowerCase().includes(searchName.toLowerCase()));
  if (filterUnit !== "All") filtered = filtered.filter((s) => s.unit === filterUnit);
  if (filterWalkthrough === "Complete") filtered = filtered.filter((s) => s.walkthroughComplete === 100);
  else if (filterWalkthrough === "In Progress") filtered = filtered.filter((s) => s.walkthroughComplete > 0 && s.walkthroughComplete < 100);
  else if (filterWalkthrough === "Not Started") filtered = filtered.filter((s) => s.walkthroughComplete === 0);
  if (filterVerification !== "All") filtered = filtered.filter((s) => s.verificationStatus === filterVerification);
  if (filterDeadline === "Overdue") filtered = filtered.filter((s) => s.daysRemaining < 0);
  else if (filterDeadline === "Due Soon") filtered = filtered.filter((s) => s.daysRemaining >= 0 && s.daysRemaining <= 7);
  else if (filterDeadline === "On Track") filtered = filtered.filter((s) => s.daysRemaining > 7);
  if (filterErrors === "Has Errors") filtered = filtered.filter((s) => (studentErrors[s.userId ?? ""]?.length || 0) > 0);
  else if (filterErrors === "No Errors") filtered = filtered.filter((s) => !studentErrors[s.userId ?? ""]?.length);
  if (filterStatus === "Needs Practice") filtered = filtered.filter((s) => s.needsPractice);
  else if (filterStatus === "On Track") filtered = filtered.filter((s) => !s.needsPractice);
  if (activeErrors.length > 0) filtered = filtered.filter((s) => activeErrors.some((err) => studentErrors[s.userId ?? ""]?.includes(err)));

  filtered.sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "name": cmp = a.name.localeCompare(b.name); break;
      case "unit": cmp = a.unit.localeCompare(b.unit); break;
      case "deadline": cmp = a.daysRemaining - b.daysRemaining; break;
      case "walkthrough": cmp = a.walkthroughComplete - b.walkthroughComplete; break;
      case "verification": cmp = a.verificationStatus.localeCompare(b.verificationStatus); break;
      case "errors": cmp = (studentErrors[a.userId ?? ""]?.length || 0) - (studentErrors[b.userId ?? ""]?.length || 0); break;
      case "status": cmp = (a.needsPractice ? 0 : 1) - (b.needsPractice ? 0 : 1); break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalCount = students.length;
  const overdueCount = students.filter((s) => s.daysRemaining < 0).length;
  const dueSoonCount = students.filter((s) => s.daysRemaining >= 0 && s.daysRemaining <= 7).length;
  const notStartedCount = students.filter((s) => s.walkthroughComplete === 0).length;
  const completedCount = students.filter((s) => s.walkthroughComplete === 100 && s.verificationStatus === "Verified").length;
  const needsPracticeCount = students.filter((s) => s.needsPractice).length;
  const avgProgress = Math.round(students.reduce((s, st) => s + st.walkthroughComplete, 0) / students.length);
  const avgScore = Math.round(students.reduce((s, st) => s + st.latestScore, 0) / students.length);

  const sendMessage = useSendMessage();

  const handleSendMessage = () => {
    if (!messageStudent) return;
    sendMessage.mutate(
      { subject: "Training Reminder", body: messageText, recipient_ids: [Number(messageStudent.id)] },
      { onSuccess: () => { setMessageSent(true); setTimeout(() => { setMessageSent(false); setMessageText(""); setMessageStudent(null); }, 2000); } }
    );
  };

  const handleAddModule = (_type: string) => { setAddModuleStudent(null); };

  const handleStatClick = (filter: string) => {
    setFilterDeadline("All"); setFilterWalkthrough("All"); setFilterStatus("All"); setFilterErrors("All");
    if (filter === "Overdue") setFilterDeadline("Overdue");
    else if (filter === "Due Soon") setFilterDeadline("Due Soon");
    else if (filter === "Not Started") setFilterWalkthrough("Not Started");
    else if (filter === "Needs Practice") setFilterStatus("Needs Practice");
    else if (filter === "Completed") { setFilterWalkthrough("Complete"); setFilterVerification("Verified"); }
  };

  const handleBulkEmail = (category: string) => {
    setBulkEmailCategory(category);
    let count = 0;
    if (category === "Overdue") count = overdueCount;
    else if (category === "Due Soon") count = dueSoonCount;
    else if (category === "Not Started") count = notStartedCount;
    else if (category === "Needs Practice") count = needsPracticeCount;
    setBulkEmailText(`This is a reminder regarding your CVC training. Please ensure you complete your required modules by the deadline.`);
    setBulkEmailOpen(true);
  };

  const handleSendBulkEmail = () => {
    const recipientIds = filtered
      .filter(s => {
        if (bulkEmailCategory === "Overdue") return s.daysRemaining < 0;
        if (bulkEmailCategory === "Due Soon") return s.daysRemaining >= 0 && s.daysRemaining <= 7;
        if (bulkEmailCategory === "Not Started") return s.walkthroughComplete === 0;
        if (bulkEmailCategory === "Needs Practice") return s.needsPractice;
        return false;
      })
      .map(s => Number(s.id));

    sendMessage.mutate(
      { subject: `${bulkEmailCategory} Reminder`, body: bulkEmailText, recipient_ids: recipientIds },
      { onSuccess: () => { setBulkEmailSent(true); setTimeout(() => { setBulkEmailSent(false); setBulkEmailOpen(false); setBulkEmailText(""); }, 2000); } }
    );
  };

  const getBulkCount = () => {
    if (bulkEmailCategory === "Overdue") return overdueCount;
    if (bulkEmailCategory === "Due Soon") return dueSoonCount;
    if (bulkEmailCategory === "Not Started") return notStartedCount;
    if (bulkEmailCategory === "Needs Practice") return needsPracticeCount;
    return 0;
  };

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort(field)}>
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === field ? "text-primary" : "text-muted-foreground/40"}`} />
      </div>
    </th>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Students & Analytics</h2>
        <p className="text-sm text-muted-foreground">Full student list with training analytics</p>
      </div>

      {/* Overall Progress */}
      <div className="rounded-xl bg-card p-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Overall Cohort Progress</h3>
          <span className="text-xs text-muted-foreground">{totalCount} students enrolled</span>
        </div>
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Average Walkthrough Progress</span>
              <span className="font-bold text-foreground">{avgProgress}%</span>
            </div>
            <Progress value={avgProgress} className="h-3" />
          </div>
          <div className="text-center px-4 border-l">
            <p className="text-2xl font-bold text-foreground">{avgScore}</p>
            <p className="text-[10px] text-muted-foreground">Avg Score</p>
          </div>
        </div>
      </div>

      {/* Clickable Summary Stats with email all button */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { filter: "Overdue", icon: AlertTriangle, count: overdueCount, color: "text-destructive", ringColor: "ring-destructive", active: filterDeadline === "Overdue" },
          { filter: "Due Soon", icon: Clock, count: dueSoonCount, color: "text-warning", ringColor: "ring-warning", active: filterDeadline === "Due Soon" },
          { filter: "Not Started", icon: BookOpen, count: notStartedCount, color: "text-muted-foreground", ringColor: "ring-muted-foreground", active: filterWalkthrough === "Not Started" },
          { filter: "Needs Practice", icon: Flag, count: needsPracticeCount, color: "text-destructive", ringColor: "ring-destructive", active: filterStatus === "Needs Practice" },
          { filter: "Completed", icon: CheckCircle, count: completedCount, color: "text-success", ringColor: "ring-success", active: filterWalkthrough === "Complete" && filterVerification === "Verified" },
        ].map((stat) => (
          <div key={stat.filter} className={`rounded-xl bg-card p-3 shadow-card text-center transition-all hover:shadow-lg ${stat.active ? `ring-2 ${stat.ringColor}` : ""}`}>
            <button onClick={() => handleStatClick(stat.filter)} className="w-full">
              <stat.icon className={`h-4 w-4 ${stat.color} mx-auto mb-1`} />
              <p className={`text-xl font-bold ${stat.color}`}>{stat.count}</p>
              <p className="text-[10px] text-muted-foreground">{stat.filter}</p>
            </button>
            {stat.count > 0 && stat.filter !== "Completed" && (
              <button onClick={() => handleBulkEmail(stat.filter)} className="mt-1.5 text-[9px] text-primary hover:underline flex items-center gap-0.5 mx-auto">
                <Mail className="h-2.5 w-2.5" /> Email all
              </button>
            )}
          </div>
        ))}
        <div className="rounded-xl bg-card p-3 shadow-card text-center">
          <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold text-primary">{avgProgress}%</p>
          <p className="text-[10px] text-muted-foreground">Avg Progress</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-card p-4 shadow-card space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name…" value={searchName} onChange={(e) => setSearchName(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <Select value={filterUnit} onValueChange={setFilterUnit}>
            <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="Unit" /></SelectTrigger>
            <SelectContent>{units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filterDeadline} onValueChange={setFilterDeadline}>
            <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Deadline" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Deadlines</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
              <SelectItem value="Due Soon">Due Soon</SelectItem>
              <SelectItem value="On Track">On Track</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterWalkthrough} onValueChange={setFilterWalkthrough}>
            <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue placeholder="Walkthrough" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Walkthrough</SelectItem>
              <SelectItem value="Complete">Complete</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Not Started">Not Started</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Needs Practice">Needs Practice</SelectItem>
              <SelectItem value="On Track">On Track</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">{filtered.length} students</p>
          {(filterDeadline !== "All" || filterWalkthrough !== "All" || filterStatus !== "All" || filterUnit !== "All" || activeErrors.length > 0) && (
            <button onClick={() => { setFilterDeadline("All"); setFilterWalkthrough("All"); setFilterStatus("All"); setFilterUnit("All"); setFilterErrors("All"); setFilterVerification("All"); setActiveErrors([]); }} className="text-[10px] text-destructive hover:underline">
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <SortHeader label="Student" field="name" />
                <SortHeader label="Unit" field="unit" />
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cohort</th>
                <SortHeader label="Deadline" field="deadline" />
                <SortHeader label="Walkthrough" field="walkthrough" />
                <SortHeader label="Verification" field="verification" />
                <SortHeader label="Errors" field="errors" />
                <SortHeader label="Status" field="status" />
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => {
                const deadline = getDeadlineBadge(student.daysRemaining);
                const errors = studentErrors[student.userId ?? ""] || [];
                return (
                  <tr key={student.id} onClick={() => setSelectedStudent(student)} className={`border-b transition-colors hover:bg-muted/30 cursor-pointer ${student.needsPractice ? "bg-destructive/[0.02]" : ""}`}>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{student.avatar}</div>
                        <div>
                          <p className="font-medium text-foreground text-[13px]">{student.name}</p>
                          <p className="text-[11px] text-muted-foreground">{student.lastActivity}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3"><span className="text-xs text-muted-foreground">{student.unit}</span></td>
                    <td className="px-3 py-3"><span className="text-[10px] text-primary font-medium">{student.cohort || "—"}</span></td>
                    <td className="px-3 py-3">
                      <div>
                        <span className="text-xs text-foreground">{new Date(student.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        <span className={`ml-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${deadline.className}`}>{deadline.text}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${student.walkthroughComplete}%` }} />
                        </div>
                        <span className="text-xs font-medium text-foreground">{student.walkthroughComplete}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3"><span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${getVerificationBadge(student.verificationStatus)}`}>{student.verificationStatus}</span></td>
                    <td className="px-3 py-3">
                      {errors.length > 0 ? <span className="text-[10px] font-semibold text-destructive">{errors.length} errors</span> : <span className="text-[10px] text-muted-foreground">None</span>}
                    </td>
                    <td className="px-3 py-3">
                      {student.needsPractice ? (
                        <div className="flex items-center gap-1 text-destructive"><Flag className="h-3 w-3 fill-current" /><span className="text-[10px] font-semibold">Needs Practice</span></div>
                      ) : (
                        <span className="text-[10px] text-success font-medium">On Track</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary" title="Send reminder" onClick={() => setMessageStudent(student)}>
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setAddModuleStudent(student)}><Plus className="h-3.5 w-3.5 mr-2" /> Add Module</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setMessageStudent(student)}><Send className="h-3.5 w-3.5 mr-2" /> Send Message</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setUnenrollStudent(student)} className="text-destructive focus:text-destructive"><UserMinus className="h-3.5 w-3.5 mr-2" /> Unenroll</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-5 py-8 text-center text-sm text-muted-foreground">No students match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Common Errors - below student table, filterable by specialty */}
      <ErrorAnalytics activeErrors={activeErrors} onErrorToggle={(err) => setActiveErrors((prev) => prev.includes(err) ? prev.filter((e) => e !== err) : [...prev, err])} onClearErrors={() => setActiveErrors([])} />

      <StudentDetailModal student={selectedStudent} open={!!selectedStudent} onClose={() => setSelectedStudent(null)} />

      {/* Send Message Modal */}
      <Dialog open={!!messageStudent} onOpenChange={() => setMessageStudent(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-4 w-4 text-primary" /> Send Reminder</DialogTitle>
            <DialogDescription>Send a message to {messageStudent?.name}</DialogDescription>
          </DialogHeader>
          {messageSent ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <CheckCircle className="h-10 w-10 text-success" />
              <p className="text-sm font-semibold">Message sent!</p>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-[10px] flex-1" onClick={() => setMessageText(`Please complete your training course before ${messageStudent?.deadline}.`)}>📋 Complete Course</Button>
                <Button variant="outline" size="sm" className="text-[10px] flex-1" onClick={() => setMessageText("You have been assigned additional practice. Please review.")}>🔄 Additional Practice</Button>
              </div>
              <Textarea placeholder="Custom message…" value={messageText} onChange={(e) => setMessageText(e.target.value)} className="text-xs min-h-[80px]" />
              <Button className="w-full" size="sm" onClick={handleSendMessage} disabled={!messageText.trim()}><Send className="h-3.5 w-3.5 mr-1.5" /> Send Message</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Email Modal */}
      <Dialog open={bulkEmailOpen} onOpenChange={setBulkEmailOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Email All {bulkEmailCategory} Students</DialogTitle>
            <DialogDescription>Send a message to all {getBulkCount()} students who are {bulkEmailCategory.toLowerCase()}</DialogDescription>
          </DialogHeader>
          {bulkEmailSent ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <CheckCircle className="h-10 w-10 text-success" />
              <p className="text-sm font-semibold">Emails sent to {getBulkCount()} students!</p>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              <Textarea placeholder="Type your message…" value={bulkEmailText} onChange={(e) => setBulkEmailText(e.target.value)} className="text-sm min-h-[100px]" />
              <Button className="w-full" onClick={handleSendBulkEmail} disabled={!bulkEmailText.trim()}>
                <Send className="h-3.5 w-3.5 mr-1.5" /> Send to {getBulkCount()} Students
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Module Modal */}
      <AlertDialog open={!!unenrollStudent} onOpenChange={(open) => { if (!open) setUnenrollStudent(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><UserMinus className="h-4 w-4 text-destructive" /> Unenroll {unenrollStudent?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {unenrollStudent?.name} from your roster. Their account and training history are kept,
              so they can re-enroll later with a registration code. This does not delete any of their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unenrollTrainee.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleUnenroll(); }} disabled={unenrollTrainee.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {unenrollTrainee.isPending ? "Unenrolling…" : "Unenroll"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!addModuleStudent} onOpenChange={() => setAddModuleStudent(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Add Module for {addModuleStudent?.name}</DialogTitle>
            <DialogDescription>Assign additional training if there was an error on upload.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {[
              { id: "walkthrough", label: "Walkthrough Training", icon: "📖" },
              { id: "patient-cases", label: "Patient Cases", icon: "🏥" },
              { id: "verification", label: "Verification of Proficiency", icon: "✅" },
            ].map((mod) => (
              <Button key={mod.id} variant="outline" className="w-full justify-start gap-2 text-sm" onClick={() => handleAddModule(mod.id)}>
                <span>{mod.icon}</span> {mod.label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentsPage;
