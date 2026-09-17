import { useEffect, useState } from "react";
import {
  Ban,
  Building2,
  CheckCircle2,
  Copy,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  ShieldMinus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  useCreateInstitution,
  useCreateInstitutionAdmin,
  useDeleteInstitution,
  useInstitutionAdmins,
  useInstitutions,
  useRemoveInstitutionAdmin,
  useSetInstitutionActive,
  useUpdateInstitution,
  type Institution,
  type InstitutionAdmin,
} from "@/hooks/useAdmin";
import { formatApiError } from "@/lib/apiError";
import { ConfirmDialog } from "./ConfirmDialog";
import { TemporaryPasswordNotice } from "./TemporaryPasswordNotice";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-");

export function InstitutionsPanel() {
  const { toast } = useToast();
  const { data: institutions, isLoading } = useInstitutions();
  const setActive = useSetInstitutionActive();
  const deleteInstitution = useDeleteInstitution();

  const [selected, setSelected] = useState<Institution | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Institution | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "deactivate" | "delete"; inst: Institution } | null>(null);

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast({ title: "Copied", description: `Registration code ${code} copied to clipboard.` });
  };

  const handleReactivate = (inst: Institution) =>
    setActive.mutate(
      { id: inst.id, active: true },
      {
        onSuccess: () => toast({ title: "Institution reactivated", description: `${inst.name}'s users can sign in again.` }),
        onError: (err) => toast({ title: "Could not reactivate", description: formatApiError(err), variant: "destructive" }),
      },
    );

  const handleConfirm = () => {
    if (!confirm) return;
    const { kind, inst } = confirm;
    if (kind === "deactivate") {
      setActive.mutate(
        { id: inst.id, active: false },
        {
          onSuccess: () => {
            setConfirm(null);
            toast({ title: "Institution deactivated", description: `${inst.name}'s users can no longer sign in.` });
          },
          onError: (err) => toast({ title: "Could not deactivate", description: formatApiError(err), variant: "destructive" }),
        },
      );
    } else {
      deleteInstitution.mutate(inst.id, {
        onSuccess: () => {
          setConfirm(null);
          if (selected?.id === inst.id) setSelected(null);
          toast({ title: "Institution deleted", description: `${inst.name} was removed.` });
        },
        onError: (err) => {
          setConfirm(null);
          toast({ title: "Could not delete institution", description: formatApiError(err), variant: "destructive" });
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card shadow-card">
        <div className="p-4 border-b flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" /> Institutions
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Create and manage tenants. The legacy institution-wide registration code is shown here; per-cohort codes
              live on the Registration Codes page.
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" /> New institution
          </Button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading institutions...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Legacy code</TableHead>
                <TableHead className="text-right">Users</TableHead>
                <TableHead className="text-right">Trainees</TableHead>
                <TableHead className="text-right">Admins</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(institutions ?? []).map((inst) => (
                <TableRow key={inst.id} className={selected?.id === inst.id ? "bg-muted/50" : undefined}>
                  <TableCell>
                    <p className="text-sm font-medium">{inst.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {inst.slug}
                      {inst.contact_email ? ` · ${inst.contact_email}` : ""}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm tracking-wider">{inst.registration_code}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy(inst.registration_code)}
                        aria-label="Copy registration code"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm">{inst.user_count ?? "—"}</TableCell>
                  <TableCell className="text-right text-sm">{inst.trainee_count ?? "—"}</TableCell>
                  <TableCell className="text-right text-sm">{inst.admin_count ?? "—"}</TableCell>
                  <TableCell>
                    {inst.is_active ? (
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
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant={selected?.id === inst.id ? "default" : "outline"}
                        size="sm"
                        className="text-xs gap-1.5"
                        onClick={() => setSelected(selected?.id === inst.id ? null : inst)}
                      >
                        <Users className="h-3 w-3" />
                        {selected?.id === inst.id ? "Hide admins" : "Admins"}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Actions for ${inst.name}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="gap-2 text-xs"
                            onClick={() => {
                              setEditing(inst);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {inst.is_active ? (
                            <DropdownMenuItem className="gap-2 text-xs" onClick={() => setConfirm({ kind: "deactivate", inst })}>
                              <Ban className="h-3.5 w-3.5" /> Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="gap-2 text-xs" onClick={() => handleReactivate(inst)}>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Reactivate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="gap-2 text-xs text-destructive focus:text-destructive"
                            onClick={() => setConfirm({ kind: "delete", inst })}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {selected && <InstitutionAdminsCard institution={selected} />}

      <InstitutionFormDialog open={formOpen} onOpenChange={setFormOpen} institution={editing} />
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm?.kind === "delete" ? "Delete institution?" : "Deactivate institution?"}
        description={
          confirm?.kind === "delete" ? (
            <>
              <strong>{confirm?.inst.name}</strong> can only be deleted when it has no users. Deactivating is usually the
              safer choice.
            </>
          ) : (
            <>
              Every user of <strong>{confirm?.inst.name}</strong> (trainees, instructors, and its admins) will be locked
              out of the portal and the training app until it is reactivated. No data is deleted.
            </>
          )
        }
        confirmLabel={confirm?.kind === "delete" ? "Delete" : "Deactivate"}
        destructive
        pending={setActive.isPending || deleteInstitution.isPending}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

function InstitutionFormDialog({
  open,
  onOpenChange,
  institution,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institution: Institution | null;
}) {
  const { toast } = useToast();
  const createInstitution = useCreateInstitution();
  const updateInstitution = useUpdateInstitution();
  const isEdit = institution != null;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [result, setResult] = useState<{ name: string; code: string; adminEmail?: string; password?: string } | null>(null);

  // Reset the form each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setName(institution?.name ?? "");
    setSlug(institution?.slug ?? "");
    setSlugTouched(institution != null);
    setContactEmail(institution?.contact_email ?? "");
    setAdminEmail("");
    setAdminName("");
    setAdminPassword("");
    setResult(null);
  }, [open, institution]);

  const pending = createInstitution.isPending || updateInstitution.isPending;
  const effectiveSlug = slug.trim() || slugify(name);

  const handleSubmit = () => {
    if (isEdit) {
      updateInstitution.mutate(
        { id: institution.id, name: name.trim(), slug: effectiveSlug, contact_email: contactEmail.trim() },
        {
          onSuccess: (updated) => {
            toast({ title: "Institution updated", description: `${updated.name} was saved.` });
            onOpenChange(false);
          },
          onError: (err) => toast({ title: "Could not update institution", description: formatApiError(err), variant: "destructive" }),
        },
      );
      return;
    }
    createInstitution.mutate(
      {
        name: name.trim(),
        slug: effectiveSlug,
        ...(contactEmail.trim() ? { contact_email: contactEmail.trim() } : {}),
        ...(adminEmail.trim()
          ? { admin_email: adminEmail.trim(), admin_full_name: adminName.trim(), admin_password: adminPassword }
          : {}),
      },
      {
        onSuccess: (created) => {
          toast({
            title: "Institution created",
            description: `${created.name} — a "General" department was provisioned automatically.`,
          });
          setResult({
            name: created.name,
            code: created.registration_code,
            adminEmail: created.admin?.email,
            password: created.temporary_password ?? undefined,
          });
        },
        onError: (err) => toast({ title: "Could not create institution", description: formatApiError(err), variant: "destructive" }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit institution" : "New institution"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Changing the slug does not change the registration code."
              : 'A registration code and a "General" department are provisioned automatically.'}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3">
            <p className="text-sm">
              <strong>{result.name}</strong> is ready. Registration code{" "}
              <span className="font-mono tracking-wider">{result.code}</span>.
            </p>
            {result.adminEmail && !result.password && (
              <p className="text-xs text-muted-foreground">{result.adminEmail} can sign in with the password you set.</p>
            )}
            {result.password && <TemporaryPasswordNotice password={result.password} account={result.adminEmail} />}
            <DialogFooter>
              <Button size="sm" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <LabeledInput
                label="Name"
                value={name}
                placeholder="Carilion Clinic"
                onChange={(v) => {
                  setName(v);
                  if (!slugTouched) setSlug(slugify(v));
                }}
              />
              <LabeledInput
                label="Slug"
                value={slug}
                placeholder="carilion-clinic"
                mono
                onChange={(v) => {
                  setSlugTouched(true);
                  setSlug(slugify(v));
                }}
              />
              <LabeledInput
                label="Contact email"
                hint="optional"
                type="email"
                value={contactEmail}
                placeholder="medical-education@example.org"
                onChange={setContactEmail}
              />
              {!isEdit && (
                <div className="rounded-lg border p-3 space-y-3">
                  <p className="text-xs font-semibold text-foreground">
                    First administrator <span className="font-normal text-muted-foreground">(optional)</span>
                  </p>
                  <LabeledInput label="Admin email" type="email" value={adminEmail} onChange={setAdminEmail} placeholder="jane.doe@example.org" />
                  <LabeledInput label="Admin full name" value={adminName} onChange={setAdminName} placeholder="Jane Doe" />
                  <LabeledInput
                    label="Admin password"
                    hint="leave blank to generate one"
                    type="password"
                    value={adminPassword}
                    onChange={setAdminPassword}
                  />
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={pending}>
                Cancel
              </Button>
              <Button size="sm" className="gap-2" disabled={pending || !name.trim() || !effectiveSlug} onClick={handleSubmit}>
                {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isEdit ? "Save changes" : "Create institution"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InstitutionAdminsCard({ institution }: { institution: Institution }) {
  const { toast } = useToast();
  const { user: me } = useAuth();
  const { data: admins, isLoading } = useInstitutionAdmins(institution.id);
  const createAdmin = useCreateInstitutionAdmin();
  const removeAdmin = useRemoveInstitutionAdmin();

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(null);
  const [removing, setRemoving] = useState<InstitutionAdmin | null>(null);

  const openCreate = () => {
    setEmail("");
    setFullName("");
    setPassword("");
    setTempPassword(null);
    setOpen(true);
  };

  const handleCreate = () =>
    createAdmin.mutate(
      { institutionId: institution.id, email: email.trim(), full_name: fullName.trim(), password },
      {
        onSuccess: (created) => {
          toast({ title: "Admin created", description: `${created.email} can now sign in for ${institution.name}.` });
          if (created.temporary_password) {
            setTempPassword({ email: created.email, password: created.temporary_password });
          } else {
            setOpen(false);
          }
        },
        onError: (err) => toast({ title: "Could not create admin", description: formatApiError(err), variant: "destructive" }),
      },
    );

  const handleRemove = () => {
    if (!removing) return;
    removeAdmin.mutate(
      { institutionId: institution.id, userId: removing.id },
      {
        onSuccess: () => {
          toast({ title: "Admin access removed", description: `${removing.email} is no longer an admin. The account was kept.` });
          setRemoving(null);
        },
        onError: (err) => toast({ title: "Could not remove admin", description: formatApiError(err), variant: "destructive" }),
      },
    );
  };

  return (
    <div className="rounded-lg border bg-card shadow-card">
      <div className="p-4 border-b flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Administrators — {institution.name}</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Institution admins sign in to this portal and see only {institution.name}'s data. To promote an existing
            user, edit them on the Users tab.
          </p>
        </div>
        <Button size="sm" variant="outline" className="gap-2" onClick={openCreate}>
          <UserPlus className="h-3.5 w-3.5" /> New admin
        </Button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading admins...
        </div>
      ) : !admins || admins.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-foreground">No admins yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create one so {institution.name} can use the portal.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell className="text-sm font-medium">{admin.email}</TableCell>
                <TableCell className="text-sm">{admin.full_name || <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(admin.date_joined).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-destructive hover:text-destructive"
                    disabled={admin.id === me?.id}
                    onClick={() => setRemoving(admin)}
                  >
                    <ShieldMinus className="h-3.5 w-3.5" /> Remove admin
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New admin — {institution.name}</DialogTitle>
            <DialogDescription>They sign in to this portal and see only {institution.name}'s data.</DialogDescription>
          </DialogHeader>
          {tempPassword ? (
            <div className="space-y-4">
              <TemporaryPasswordNotice password={tempPassword.password} account={tempPassword.email} />
              <DialogFooter>
                <Button size="sm" onClick={() => setOpen(false)}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <LabeledInput label="Email" type="email" value={email} onChange={setEmail} placeholder="jane.doe@example.org" />
                <LabeledInput label="Full name" value={fullName} onChange={setFullName} placeholder="Jane Doe" />
                <LabeledInput
                  label="Password"
                  hint="leave blank to generate one"
                  type="password"
                  value={password}
                  onChange={setPassword}
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="gap-2" disabled={createAdmin.isPending || !email.trim()} onClick={handleCreate}>
                  {createAdmin.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create admin
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Remove admin access?"
        description={
          <>
            <strong>{removing?.email}</strong> will no longer be able to manage {institution.name}. Their account and
            any other roles are kept.
          </>
        }
        confirmLabel="Remove access"
        destructive
        pending={removeAdmin.isPending}
        onConfirm={handleRemove}
      />
    </div>
  );
}

function LabeledInput({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = "text",
  mono,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-foreground mb-1 block">
        {label} {hint && <span className="font-normal text-muted-foreground">({hint})</span>}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`text-sm${mono ? " font-mono" : ""}`}
        autoComplete={type === "password" ? "new-password" : undefined}
      />
    </div>
  );
}
