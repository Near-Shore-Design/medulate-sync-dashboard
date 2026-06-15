import { useState } from "react";
import { Ticket, Plus, Copy, Ban, CheckCircle2, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useInstitutions } from "@/hooks/useAdmin";
import {
  useCreateRegistrationCode,
  useDeactivateRegistrationCode,
  useDepartmentOptions,
  useCaseOptions,
  useRegistrationCodes,
  useUpdateRegistrationCode,
  type RegistrationCode,
} from "@/hooks/useRegistrationCodes";

const RegistrationCodesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isPlatformAdmin = !!user?.is_platform_admin;

  const { data: codes, isLoading } = useRegistrationCodes();
  const { data: departments } = useDepartmentOptions();
  const { data: institutions } = useInstitutions(isPlatformAdmin);
  const { data: caseOptions } = useCaseOptions();
  const createCode = useCreateRegistrationCode();
  const updateCode = useUpdateRegistrationCode();
  const deactivateCode = useDeactivateRegistrationCode();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [label, setLabel] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("none");
  const [institutionId, setInstitutionId] = useState<string>("");
  // Default assignments inherited by trainees who register with the code.
  const [cohort, setCohort] = useState("");
  const [deadline, setDeadline] = useState("");
  const [cases, setCases] = useState<number[]>([]);

  const isEditing = editingId != null;

  const resetForm = () => {
    setLabel("");
    setCustomCode("");
    setDepartmentId("none");
    setInstitutionId("");
    setCohort("");
    setDeadline("");
    setCases([]);
  };

  const openCreate = () => {
    setEditingId(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (c: RegistrationCode) => {
    setEditingId(c.id);
    setLabel(c.label);
    setCustomCode(c.code);
    setDepartmentId(c.department ? String(c.department) : "none");
    setInstitutionId(String(c.institution));
    setCohort(c.default_cohort ?? "");
    setDeadline(c.default_deadline ?? "");
    setCases(c.default_cases ?? []);
    setDialogOpen(true);
  };

  const toggleCase = (num: number) =>
    setCases((prev) => (prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]));

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast({ title: "Copied", description: `Registration code ${code} copied to clipboard.` });
  };

  const handleSubmit = () => {
    const assignments = {
      default_cohort: cohort.trim(),
      default_deadline: deadline || null,
      default_cases: cases,
    };

    if (isEditing) {
      updateCode.mutate(
        {
          id: editingId,
          label: label.trim(),
          // Institution is fixed at creation; only inst-admins edit the department here.
          ...(isPlatformAdmin ? {} : { department: departmentId === "none" ? null : Number(departmentId) }),
          ...assignments,
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            toast({ title: "Code updated", description: "Assignments saved." });
          },
          onError: (err: Error) =>
            toast({ title: "Could not update code", description: err.message, variant: "destructive" }),
        }
      );
      return;
    }

    const code = customCode.trim().toUpperCase();
    createCode.mutate(
      {
        label: label.trim(),
        ...(code ? { code } : {}),
        ...(isPlatformAdmin
          ? { institution: Number(institutionId) }
          : { department: departmentId === "none" ? null : Number(departmentId) }),
        ...assignments,
      },
      {
        onSuccess: (created) => {
          setDialogOpen(false);
          resetForm();
          toast({ title: "Code created", description: `New registration code: ${created.code}` });
        },
        onError: (err: Error) =>
          toast({ title: "Could not create code", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleDeactivate = (id: number, code: string) => {
    deactivateCode.mutate(id, {
      onSuccess: () => toast({ title: "Code deactivated", description: `${code} can no longer be used to register.` }),
      onError: (err: Error) =>
        toast({ title: "Could not deactivate code", description: err.message, variant: "destructive" }),
    });
  };

  const saving = createCode.isPending || updateCode.isPending;
  const submitDisabled = saving || (!isEditing && isPlatformAdmin && !institutionId);

  const assignmentSummary = (c: RegistrationCode) => {
    const parts: string[] = [];
    if (c.default_cohort) parts.push(c.default_cohort);
    if (c.default_deadline) parts.push(`due ${c.default_deadline}`);
    if (c.default_cases?.length) parts.push(`${c.default_cases.length} case${c.default_cases.length > 1 ? "s" : ""}`);
    return parts.length ? parts.join(" · ") : null;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" /> Registration Codes
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Give a code to your trainees — they create their account inside the DHRT training app and
            inherit the cohort, deadline, and cases you assign here.
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" /> New Code
        </Button>
      </div>

      <div className="rounded-lg border bg-card shadow-card">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading codes...
          </div>
        ) : !codes || codes.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-foreground">No registration codes yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create one and share it with your next cohort of trainees.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Label</TableHead>
                {isPlatformAdmin && <TableHead>Institution</TableHead>}
                <TableHead>Department</TableHead>
                <TableHead>Assignments</TableHead>
                <TableHead className="text-center">Trainees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-semibold tracking-wider">{c.code}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy(c.code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{c.label || <span className="text-muted-foreground">—</span>}</TableCell>
                  {isPlatformAdmin && <TableCell className="text-sm">{c.institution_name}</TableCell>}
                  <TableCell className="text-sm">
                    {c.department_name || <span className="text-muted-foreground">Trainee picks</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {assignmentSummary(c) || <span className="text-muted-foreground">None</span>}
                  </TableCell>
                  <TableCell className="text-center text-sm">{c.trainee_count}</TableCell>
                  <TableCell>
                    {c.is_active ? (
                      <Badge variant="outline" className="bg-success/10 text-success border-none gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-none gap-1">
                        <Ban className="h-3 w-3" /> Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => openEdit(c)}
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </Button>
                      {c.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs text-destructive hover:text-destructive"
                          disabled={deactivateCode.isPending}
                          onClick={() => handleDeactivate(c.id, c.code)}
                        >
                          <Ban className="h-3 w-3" /> Deactivate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Registration Code" : "New Registration Code"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the label, department, and the default assignments trainees inherit when they register."
                : "Type a code your trainees will remember, or leave it blank to auto-generate one. The cohort, deadline, and cases below are applied to everyone who registers with it."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {!isEditing && (
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Code <span className="font-normal text-muted-foreground">(optional, 3-32 chars: letters, numbers, - or _)</span>
                </label>
                <Input
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  placeholder="FALL26-ANESTHESIA"
                  className="text-sm font-mono tracking-wider"
                  maxLength={32}
                />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Label <span className="font-normal text-muted-foreground">(e.g. cohort name)</span>
              </label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Fall 2026 Anesthesia cohort"
                className="text-sm"
              />
            </div>
            {!isEditing && isPlatformAdmin ? (
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Institution</label>
                <Select value={institutionId} onValueChange={setInstitutionId}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select an institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {(institutions ?? []).map((inst) => (
                      <SelectItem key={inst.id} value={String(inst.id)}>
                        {inst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : !isPlatformAdmin ? (
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Default department <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Trainee picks at signup</SelectItem>
                    {(departments ?? []).map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="rounded-md border bg-muted/30 p-3 space-y-3">
              <p className="text-xs font-semibold text-foreground">Assignments for trainees who use this code</p>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Cohort <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <Input
                  value={cohort}
                  onChange={(e) => setCohort(e.target.value)}
                  placeholder="Fall 2026 Anesthesia"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Training deadline <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-foreground">Assigned cases</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-[11px] text-primary hover:underline"
                      onClick={() => setCases((caseOptions ?? []).map((c) => c.case_number))}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      className="text-[11px] text-muted-foreground hover:underline"
                      onClick={() => setCases([])}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="rounded-md border bg-card p-2 space-y-1.5 max-h-44 overflow-auto">
                  {(caseOptions ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No cases available.</p>
                  ) : (
                    (caseOptions ?? []).map((c) => (
                      <label key={c.case_number} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={cases.includes(c.case_number)}
                          onCheckedChange={() => toggleCase(c.case_number)}
                          className="h-4 w-4"
                        />
                        {c.case_name}
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="gap-2" disabled={submitDisabled} onClick={handleSubmit}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Code"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegistrationCodesPage;
