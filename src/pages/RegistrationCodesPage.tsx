import { useState } from "react";
import { Ticket, Plus, Copy, Ban, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  useRegistrationCodes,
} from "@/hooks/useRegistrationCodes";

const RegistrationCodesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isPlatformAdmin = !!user?.is_platform_admin;

  const { data: codes, isLoading } = useRegistrationCodes();
  const { data: departments } = useDepartmentOptions();
  const { data: institutions } = useInstitutions(isPlatformAdmin);
  const createCode = useCreateRegistrationCode();
  const deactivateCode = useDeactivateRegistrationCode();

  const [createOpen, setCreateOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("none");
  const [institutionId, setInstitutionId] = useState<string>("");

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast({ title: "Copied", description: `Registration code ${code} copied to clipboard.` });
  };

  const handleCreate = () => {
    createCode.mutate(
      {
        label: label.trim(),
        // Institution admins create codes for their own tenant; the backend
        // requires an explicit institution from platform admins.
        ...(isPlatformAdmin
          ? { institution: Number(institutionId) }
          : { department: departmentId === "none" ? null : Number(departmentId) }),
      },
      {
        onSuccess: (created) => {
          setCreateOpen(false);
          setLabel("");
          setDepartmentId("none");
          setInstitutionId("");
          toast({
            title: "Code created",
            description: `New registration code: ${created.code}`,
          });
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

  const createDisabled =
    createCode.isPending || (isPlatformAdmin && !institutionId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" /> Registration Codes
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Give a code to your trainees — they create their account inside the DHRT training app.
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
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
                <TableHead className="text-center">Trainees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
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
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Registration Code</DialogTitle>
            <DialogDescription>
              The code is generated automatically. Share it with trainees so they can register in
              the DHRT app.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
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
            {isPlatformAdmin ? (
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
            ) : (
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
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="gap-2" disabled={createDisabled} onClick={handleCreate}>
              {createCode.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegistrationCodesPage;
