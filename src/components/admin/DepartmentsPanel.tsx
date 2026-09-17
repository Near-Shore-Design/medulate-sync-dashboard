import { useEffect, useState } from "react";
import { Layers, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import { useInstitutionFilter } from "@/contexts/InstitutionFilterContext";
import {
  useAdminDepartments,
  useCreateDepartment,
  useDeleteDepartment,
  useInstitutions,
  useRenameDepartment,
  type AdminDepartment,
} from "@/hooks/useAdmin";
import { formatApiError } from "@/lib/apiError";
import { ConfirmDialog } from "./ConfirmDialog";

export function DepartmentsPanel() {
  const { user: me } = useAuth();
  const { toast } = useToast();
  const isPlatformAdmin = !!me?.is_platform_admin;
  const { institutionId } = useInstitutionFilter();
  const { data: departments, isLoading } = useAdminDepartments();
  const { data: institutions } = useInstitutions(isPlatformAdmin);
  const createDepartment = useCreateDepartment();
  const renameDepartment = useRenameDepartment();
  const deleteDepartment = useDeleteDepartment();

  const [dialog, setDialog] = useState<{ department: AdminDepartment | null } | null>(null);
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [deleting, setDeleting] = useState<AdminDepartment | null>(null);

  useEffect(() => {
    if (!dialog) return;
    setName(dialog.department?.name ?? "");
    setInstitution(institutionId != null ? String(institutionId) : "");
  }, [dialog, institutionId]);

  const isEdit = !!dialog?.department;
  const pending = createDepartment.isPending || renameDepartment.isPending;

  const handleSave = () => {
    if (!dialog) return;
    const onError = (err: unknown) =>
      toast({ title: "Could not save department", description: formatApiError(err), variant: "destructive" });
    if (dialog.department) {
      renameDepartment.mutate(
        { id: dialog.department.id, name: name.trim() },
        {
          onSuccess: () => {
            toast({ title: "Department renamed" });
            setDialog(null);
          },
          onError,
        },
      );
    } else {
      createDepartment.mutate(
        { name: name.trim(), ...(isPlatformAdmin ? { institution: Number(institution) } : {}) },
        {
          onSuccess: (created) => {
            toast({ title: "Department created", description: `${created.name} is now available for users and codes.` });
            setDialog(null);
          },
          onError,
        },
      );
    }
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteDepartment.mutate(deleting.id, {
      onSuccess: () => {
        toast({ title: "Department deleted", description: `${deleting.name} was removed.` });
        setDeleting(null);
      },
      onError: (err) => toast({ title: "Could not delete department", description: formatApiError(err), variant: "destructive" }),
    });
  };

  return (
    <div className="rounded-lg border bg-card shadow-card">
      <div className="p-4 border-b flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" /> Departments
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Departments trainees pick at registration and that users and registration codes can belong to.
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setDialog({ department: null })}>
          <Plus className="h-3.5 w-3.5" /> New department
        </Button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading departments...
        </div>
      ) : !departments || departments.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No departments yet.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              {isPlatformAdmin && <TableHead>Institution</TableHead>}
              <TableHead className="text-right">Users</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="text-sm font-medium">{d.name}</TableCell>
                {isPlatformAdmin && <TableCell className="text-xs text-muted-foreground">{d.institution_name ?? "—"}</TableCell>}
                <TableCell className="text-right text-sm">{d.user_count}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDialog({ department: d })} aria-label={`Rename ${d.name}`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeleting(d)}
                    aria-label={`Delete ${d.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Rename department" : "New department"}</DialogTitle>
            <DialogDescription>
              {isEdit ? dialog?.department?.institution_name ?? "" : "Names must be unique within an institution."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {isPlatformAdmin && !isEdit && (
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Institution</label>
                <Select value={institution} onValueChange={setInstitution}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Choose an institution" />
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
            )}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Emergency Medicine" className="text-sm" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setDialog(null)} disabled={pending}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-2"
              disabled={pending || !name.trim() || (isPlatformAdmin && !isEdit && !institution)}
              onClick={handleSave}
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete department?"
        description={
          <>
            <strong>{deleting?.name}</strong> will be removed. {deleting?.user_count ?? 0} user(s) and any registration
            codes using it will be left without a department.
          </>
        }
        confirmLabel="Delete"
        destructive
        pending={deleteDepartment.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
