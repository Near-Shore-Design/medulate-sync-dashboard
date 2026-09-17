import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useInstitutionFilter } from "@/contexts/InstitutionFilterContext";
import { useAdminDepartments, useInstitutions } from "@/hooks/useAdmin";
import {
  ACCOUNT_TYPE_LABELS,
  UNIT_OPTIONS,
  useCreateUser,
  useUpdateUser,
  type AccountType,
  type AdminUser,
  type UserWritePayload,
} from "@/hooks/useUsers";
import { formatApiError } from "@/lib/apiError";
import { TemporaryPasswordNotice } from "./TemporaryPasswordNotice";

const TYPE_HELP: Record<AccountType, string> = {
  trainee: "Uses the DHRT training app; appears on rosters and progress pages.",
  instructor: "Instructor / coordinator record for this institution.",
  institution_admin: "Can sign in to this portal and manage this institution.",
  platform_admin: "Full access to every institution. Grant sparingly.",
};

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create a new user. */
  user: AdminUser | null;
}

const NONE = "none";

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const { user: me } = useAuth();
  const { toast } = useToast();
  const { institutionId: headerInstitutionId } = useInstitutionFilter();
  const isPlatformAdmin = !!me?.is_platform_admin;
  const isEdit = user != null;

  const { data: institutions } = useInstitutions(isPlatformAdmin && open);
  const { data: departments } = useAdminDepartments();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [types, setTypes] = useState<AccountType[]>(["trainee"]);
  const [institution, setInstitution] = useState<string>(NONE);
  const [department, setDepartment] = useState<string>(NONE);
  const [unit, setUnit] = useState("anesthesia");
  const [cohort, setCohort] = useState("");
  const [deadline, setDeadline] = useState("");
  const [passwordMode, setPasswordMode] = useState<"generate" | "set">("generate");
  const [password, setPassword] = useState("");
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  // (Re)initialise whenever the dialog opens for a different user.
  useEffect(() => {
    if (!open) return;
    setCreated(null);
    setPassword("");
    setPasswordMode("generate");
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setEmail(user.email);
      setUsername(user.username);
      setTypes(user.account_types);
      setInstitution(user.institution ? String(user.institution.id) : NONE);
      setDepartment(user.department ? String(user.department.id) : NONE);
      setUnit(user.trainee?.unit ?? "anesthesia");
      setCohort(user.trainee?.cohort ?? "");
      setDeadline(user.trainee?.deadline ?? "");
    } else {
      setFirstName("");
      setLastName("");
      setEmail("");
      setUsername("");
      setTypes(["trainee"]);
      const defaultInstitution = isPlatformAdmin ? headerInstitutionId : me?.institution?.id;
      setInstitution(defaultInstitution != null ? String(defaultInstitution) : NONE);
      setDepartment(NONE);
      setUnit("anesthesia");
      setCohort("");
      setDeadline("");
    }
  }, [open, user, isPlatformAdmin, headerInstitutionId, me?.institution?.id]);

  const allowedTypes: AccountType[] = isPlatformAdmin
    ? ["trainee", "instructor", "institution_admin", "platform_admin"]
    : ["trainee", "instructor", "institution_admin"];

  const effectiveInstitutionId = isPlatformAdmin
    ? institution === NONE ? null : Number(institution)
    : me?.institution?.id ?? null;

  const departmentOptions = useMemo(
    () =>
      (departments ?? []).filter(
        (d) => effectiveInstitutionId == null || d.institution === effectiveInstitutionId,
      ),
    [departments, effectiveInstitutionId],
  );

  const needsInstitution = types.some((t) => t !== "platform_admin");
  const isTrainee = types.includes("trainee");

  const toggleType = (type: AccountType, checked: boolean) =>
    setTypes((prev) => (checked ? [...prev, type] : prev.filter((t) => t !== type)));

  const handleInstitutionChange = (value: string) => {
    setInstitution(value);
    setDepartment(NONE); // departments belong to one institution
  };

  const pending = createUser.isPending || updateUser.isPending;
  const invalid =
    !email.trim() ||
    (!isEdit && types.length === 0) ||
    (isPlatformAdmin && needsInstitution && types.length > 0 && effectiveInstitutionId == null) ||
    (!isEdit && passwordMode === "set" && !password);

  const handleSubmit = () => {
    const payload: UserWritePayload = {
      email: email.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      account_types: types,
      department: department === NONE ? null : Number(department),
    };
    if (isPlatformAdmin) payload.institution = effectiveInstitutionId;
    if (isTrainee) {
      payload.unit = unit;
      payload.cohort = cohort.trim();
      payload.deadline = deadline || null;
    }

    if (isEdit) {
      if (username.trim()) payload.username = username.trim();
      updateUser.mutate(
        { id: user.id, ...payload },
        {
          onSuccess: (updated) => {
            toast({ title: "User updated", description: `${updated.full_name || updated.email} was saved.` });
            onOpenChange(false);
          },
          onError: (err) =>
            toast({ title: "Could not update user", description: formatApiError(err), variant: "destructive" }),
        },
      );
      return;
    }

    if (username.trim()) payload.username = username.trim();
    payload.password = passwordMode === "set" ? password : "";
    createUser.mutate(payload, {
      onSuccess: (result) => {
        toast({ title: "User created", description: `${result.email} can now sign in.` });
        if (result.temporary_password) {
          setCreated({ email: result.email, password: result.temporary_password });
        } else {
          onOpenChange(false);
        }
      },
      onError: (err) =>
        toast({ title: "Could not create user", description: formatApiError(err), variant: "destructive" }),
    });
  };

  const removingTrainee = isEdit && user.account_types.includes("trainee") && !isTrainee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "Add user"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update account details, access, and training assignment."
              : "Create an account directly — no registration code needed."}
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="space-y-4">
            <TemporaryPasswordNotice password={created.password} account={created.email} />
            <DialogFooter>
              <Button size="sm" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="First name">
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="text-sm" />
                </Field>
                <Field label="Last name">
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="text-sm" />
                </Field>
              </div>
              <Field label="Email">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospital.org"
                  className="text-sm"
                />
              </Field>
              <Field label="Username" hint={isEdit ? undefined : "optional — defaults to the email"}>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} className="text-sm" />
              </Field>

              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Account type</p>
                <div className="space-y-2 rounded-lg border p-3">
                  {allowedTypes.map((type) => (
                    <label key={type} className="flex items-start gap-2.5 cursor-pointer">
                      <Checkbox
                        checked={types.includes(type)}
                        onCheckedChange={(checked) => toggleType(type, checked === true)}
                        className="mt-0.5"
                        aria-label={ACCOUNT_TYPE_LABELS[type]}
                      />
                      <span>
                        <span className="text-sm font-medium text-foreground">{ACCOUNT_TYPE_LABELS[type]}</span>
                        <span className="block text-[11px] text-muted-foreground">{TYPE_HELP[type]}</span>
                      </span>
                    </label>
                  ))}
                </div>
                {removingTrainee && (
                  <p className="mt-1.5 text-[11px] text-warning">
                    Removing Trainee deletes this user's cohort, deadline, and verification status.
                    Their attempts and completed lessons are kept.
                  </p>
                )}
              </div>

              {isPlatformAdmin && (
                <Field label="Institution" hint={needsInstitution ? undefined : "optional for platform admins"}>
                  <Select value={institution} onValueChange={handleInstitutionChange}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Choose an institution" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>No institution</SelectItem>
                      {(institutions ?? []).map((inst) => (
                        <SelectItem key={inst.id} value={String(inst.id)}>
                          {inst.name}
                          {!inst.is_active ? " (inactive)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              <Field label="Department" hint="optional">
                <Select value={department} onValueChange={setDepartment} disabled={effectiveInstitutionId == null}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="No department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>No department</SelectItem>
                    {departmentOptions.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {isTrainee && (
                <div className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-3">
                  <Field label="Unit">
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Cohort">
                    <Input value={cohort} onChange={(e) => setCohort(e.target.value)} className="text-sm" />
                  </Field>
                  <Field label="Deadline">
                    <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="text-sm" />
                  </Field>
                </div>
              )}

              {!isEdit && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1.5">Password</p>
                  <Select value={passwordMode} onValueChange={(v) => setPasswordMode(v as "generate" | "set")}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generate">Generate a temporary password</SelectItem>
                      <SelectItem value="set">Set a password now</SelectItem>
                    </SelectContent>
                  </Select>
                  {passwordMode === "set" && (
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="mt-2 text-sm"
                      autoComplete="new-password"
                    />
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={pending}>
                Cancel
              </Button>
              <Button size="sm" className="gap-2" disabled={pending || invalid} onClick={handleSubmit}>
                {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isEdit ? "Save changes" : "Create user"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-foreground mb-1 block">
        {label} {hint && <span className="font-normal text-muted-foreground">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
