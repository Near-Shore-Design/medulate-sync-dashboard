import { useState } from "react";
import {
  ShieldCheck,
  Plus,
  Building2,
  Copy,
  UserPlus,
  Loader2,
  CheckCircle2,
  Ban,
} from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateInstitution,
  useCreateInstitutionAdmin,
  useInstitutionAdmins,
  useInstitutions,
  type Institution,
} from "@/hooks/useAdmin";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-");

const AdminPage = () => {
  const { toast } = useToast();
  const { data: institutions, isLoading } = useInstitutions();
  const createInstitution = useCreateInstitution();
  const createAdmin = useCreateInstitutionAdmin();

  const [selected, setSelected] = useState<Institution | null>(null);
  const { data: admins, isLoading: adminsLoading } = useInstitutionAdmins(selected?.id ?? null);

  // Create-institution dialog state
  const [instOpen, setInstOpen] = useState(false);
  const [instName, setInstName] = useState("");
  const [instSlug, setInstSlug] = useState("");
  const [instEmail, setInstEmail] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  // Create-admin dialog state
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast({ title: "Copied", description: `Registration code ${code} copied to clipboard.` });
  };

  const handleCreateInstitution = () => {
    createInstitution.mutate(
      {
        name: instName.trim(),
        slug: instSlug.trim() || slugify(instName),
        ...(instEmail.trim() ? { contact_email: instEmail.trim() } : {}),
      },
      {
        onSuccess: (created) => {
          setInstOpen(false);
          setInstName("");
          setInstSlug("");
          setInstEmail("");
          setSlugTouched(false);
          toast({
            title: "Institution created",
            description: `${created.name} — registration code ${created.registration_code}. A "General" department was provisioned automatically.`,
          });
        },
        onError: (err: Error) =>
          toast({ title: "Could not create institution", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleCreateAdmin = () => {
    if (!selected) return;
    createAdmin.mutate(
      {
        institutionId: selected.id,
        email: adminEmail.trim(),
        full_name: adminName.trim(),
        password: adminPassword,
      },
      {
        onSuccess: (created) => {
          setAdminOpen(false);
          setAdminEmail("");
          setAdminName("");
          setAdminPassword("");
          toast({
            title: "Admin created",
            description: `${created.email} can now sign in to this dashboard for ${selected.name}.`,
          });
        },
        onError: (err: Error) =>
          toast({ title: "Could not create admin", description: err.message, variant: "destructive" }),
      }
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Administration
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Manage institutions and their administrator accounts. Only platform admins see this page.
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setInstOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> New Institution
        </Button>
      </div>

      {/* Institutions */}
      <div className="rounded-lg border bg-card shadow-card">
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" /> Institutions
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Select an institution to manage its admins. The legacy institution-wide registration
            code is shown here; per-cohort codes live on the Registration Codes page.
          </p>
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
                <TableHead>Slug</TableHead>
                <TableHead>Legacy Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Admins</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(institutions ?? []).map((inst) => (
                <TableRow
                  key={inst.id}
                  className={selected?.id === inst.id ? "bg-muted/50" : undefined}
                >
                  <TableCell className="text-sm font-medium">{inst.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{inst.slug}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm tracking-wider">{inst.registration_code}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy(inst.registration_code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
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
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(inst.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={selected?.id === inst.id ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                      onClick={() => setSelected(selected?.id === inst.id ? null : inst)}
                    >
                      {selected?.id === inst.id ? "Hide Admins" : "Manage Admins"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Admins for the selected institution */}
      {selected && (
        <div className="rounded-lg border bg-card shadow-card">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Administrators — {selected.name}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Institution admins can sign in to this dashboard and see only {selected.name}'s data.
              </p>
            </div>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setAdminOpen(true)}>
              <UserPlus className="h-3.5 w-3.5" /> New Admin
            </Button>
          </div>
          {adminsLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading admins...
            </div>
          ) : !admins || admins.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-foreground">No admins yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create one so {selected.name} can use the dashboard.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="text-sm font-medium">{admin.email}</TableCell>
                    <TableCell className="text-sm">
                      {admin.full_name || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(admin.date_joined).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Create institution dialog */}
      <Dialog open={instOpen} onOpenChange={setInstOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Institution</DialogTitle>
            <DialogDescription>
              A registration code and a "General" department are provisioned automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Name</label>
              <Input
                value={instName}
                onChange={(e) => {
                  setInstName(e.target.value);
                  if (!slugTouched) setInstSlug(slugify(e.target.value));
                }}
                placeholder="Carilion Clinic"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Slug</label>
              <Input
                value={instSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setInstSlug(slugify(e.target.value));
                }}
                placeholder="carilion-clinic"
                className="text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Contact email <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <Input
                type="email"
                value={instEmail}
                onChange={(e) => setInstEmail(e.target.value)}
                placeholder="medical-education@example.org"
                className="text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setInstOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-2"
              disabled={createInstitution.isPending || !instName.trim() || !(instSlug.trim() || slugify(instName))}
              onClick={handleCreateInstitution}
            >
              {createInstitution.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create Institution
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create admin dialog */}
      <Dialog open={adminOpen} onOpenChange={setAdminOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Admin — {selected?.name}</DialogTitle>
            <DialogDescription>
              They sign in to this dashboard with the email and password below and see only{" "}
              {selected?.name}'s data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Email</label>
              <Input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="jane.doe@example.org"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Full name</label>
              <Input
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Jane Doe"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Password</label>
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setAdminOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-2"
              disabled={createAdmin.isPending || !adminEmail.trim() || !adminPassword}
              onClick={handleCreateAdmin}
            >
              {createAdmin.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create Admin
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
