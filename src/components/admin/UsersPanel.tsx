import { useEffect, useState } from "react";
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Loader2,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useAdminDepartments, useInstitutions } from "@/hooks/useAdmin";
import {
  ACCOUNT_TYPE_LABELS,
  useDeleteUser,
  useSetUserActive,
  useUsers,
  type AdminUser,
  type UserFilters,
} from "@/hooks/useUsers";
import { formatApiError } from "@/lib/apiError";
import { ConfirmDialog } from "./ConfirmDialog";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { UserFormDialog } from "./UserFormDialog";

const PAGE_SIZE = 50;

const TYPE_BADGE: Record<string, string> = {
  platform_admin: "bg-destructive/10 text-destructive",
  institution_admin: "bg-primary/10 text-primary",
  instructor: "bg-info/10 text-info",
  trainee: "bg-success/10 text-success",
  user: "bg-muted text-muted-foreground",
};

export function UsersPanel() {
  const { user: me } = useAuth();
  const { toast } = useToast();
  const isPlatformAdmin = !!me?.is_platform_admin;
  const { institutionId, setInstitutionId } = useInstitutionFilter();
  const { data: institutions } = useInstitutions(isPlatformAdmin);
  const { data: departments } = useAdminDepartments();

  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    accountType: "all",
    status: "all",
    department: null,
    page: 1,
    pageSize: PAGE_SIZE,
  });

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.search === searchInput ? f : { ...f, search: searchInput, page: 1 }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError, error } = useUsers(filters);
  const users = data?.results ?? [];
  const total = data?.count ?? 0;
  const page = filters.page ?? 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const setActive = useSetUserActive();
  const deleteUser = useDeleteUser();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [resetting, setResetting] = useState<AdminUser | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "deactivate" | "delete"; user: AdminUser } | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (u: AdminUser) => {
    setEditing(u);
    setFormOpen(true);
  };

  const displayName = (u: AdminUser) => u.full_name || `${u.first_name} ${u.last_name}`.trim() || u.username;

  const handleReactivate = (u: AdminUser) =>
    setActive.mutate(
      { id: u.id, active: true },
      {
        onSuccess: () => toast({ title: "User reactivated", description: `${displayName(u)} can sign in again.` }),
        onError: (err) =>
          toast({ title: "Could not reactivate", description: formatApiError(err), variant: "destructive" }),
      },
    );

  const handleConfirm = () => {
    if (!confirm) return;
    const { kind, user: u } = confirm;
    const onError = (err: unknown) =>
      toast({
        title: kind === "delete" ? "Could not delete user" : "Could not deactivate user",
        description: formatApiError(err),
        variant: "destructive",
      });
    if (kind === "deactivate") {
      setActive.mutate(
        { id: u.id, active: false },
        {
          onSuccess: () => {
            setConfirm(null);
            toast({ title: "User deactivated", description: `${displayName(u)} can no longer sign in.` });
          },
          onError,
        },
      );
    } else {
      deleteUser.mutate(u.id, {
        onSuccess: () => {
          setConfirm(null);
          toast({ title: "User deleted", description: `${displayName(u)} and their data were removed.` });
        },
        onError,
      });
    }
  };

  const departmentOptions = (departments ?? []).filter(
    (d) => !isPlatformAdmin || institutionId == null || d.institution === institutionId,
  );

  return (
    <div className="rounded-lg border bg-card shadow-card">
      <div className="p-4 border-b space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Users</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isPlatformAdmin
                ? "Every account across institutions. Narrow with the institution filter."
                : `Accounts in ${me?.institution?.name ?? "your institution"}.`}
            </p>
          </div>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <UserPlus className="h-3.5 w-3.5" /> Add user
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, email, username"
              className="h-8 pl-8 text-xs"
              aria-label="Search users"
            />
          </div>
          {isPlatformAdmin && (
            <Select
              value={institutionId != null ? String(institutionId) : "all"}
              onValueChange={(v) => {
                setFilters((f) => ({ ...f, department: null, page: 1 }));
                setInstitutionId(v === "all" ? null : Number(v));
              }}
            >
              <SelectTrigger className="h-8 w-[170px] text-xs" aria-label="Institution filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All institutions</SelectItem>
                {(institutions ?? []).map((inst) => (
                  <SelectItem key={inst.id} value={String(inst.id)}>
                    {inst.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={filters.accountType ?? "all"}
            onValueChange={(v) => setFilters((f) => ({ ...f, accountType: v as UserFilters["accountType"], page: 1 }))}
          >
            <SelectTrigger className="h-8 w-[160px] text-xs" aria-label="Account type filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All account types</SelectItem>
              <SelectItem value="trainee">Trainees</SelectItem>
              <SelectItem value="instructor">Instructors</SelectItem>
              <SelectItem value="institution_admin">Institution admins</SelectItem>
              {isPlatformAdmin && <SelectItem value="platform_admin">Platform admins</SelectItem>}
              <SelectItem value="user">No role</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.department != null ? String(filters.department) : "all"}
            onValueChange={(v) => setFilters((f) => ({ ...f, department: v === "all" ? null : Number(v), page: 1 }))}
          >
            <SelectTrigger className="h-8 w-[160px] text-xs" aria-label="Department filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departmentOptions.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name}
                  {isPlatformAdmin && institutionId == null && d.institution_name ? ` — ${d.institution_name}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status ?? "all"}
            onValueChange={(v) => setFilters((f) => ({ ...f, status: v as UserFilters["status"], page: 1 }))}
          >
            <SelectTrigger className="h-8 w-[120px] text-xs" aria-label="Status filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          {isFetching && !isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading users...
        </div>
      ) : isError ? (
        <div className="py-12 text-center text-sm text-destructive">{formatApiError(error)}</div>
      ) : users.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm font-medium text-foreground">No users match these filters</p>
          <p className="text-xs text-muted-foreground mt-1">Try clearing the search or filters, or add a user.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              {isPlatformAdmin && <TableHead>Institution</TableHead>}
              <TableHead>Account type</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last sign-in</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const isSelf = u.id === me?.id;
              const types = u.account_types.length ? u.account_types : ["user" as const];
              return (
                <TableRow key={u.id} className={!u.is_active ? "opacity-60" : undefined}>
                  <TableCell>
                    <p className="text-sm font-medium text-foreground">
                      {displayName(u)} {isSelf && <span className="text-[10px] text-muted-foreground">(you)</span>}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{u.email || u.username}</p>
                  </TableCell>
                  {isPlatformAdmin && (
                    <TableCell className="text-xs text-muted-foreground">{u.institution?.name ?? "—"}</TableCell>
                  )}
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {types.map((t) => (
                        <Badge key={t} variant="outline" className={`border-none text-[10px] ${TYPE_BADGE[t]}`}>
                          {ACCOUNT_TYPE_LABELS[t]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.department?.name ?? "—"}</TableCell>
                  <TableCell>
                    {u.is_active ? (
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
                    {u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Actions for ${displayName(u)}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(u)} className="gap-2 text-xs">
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setResetting(u)} disabled={isSelf} className="gap-2 text-xs">
                          <KeyRound className="h-3.5 w-3.5" /> Reset password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {u.is_active ? (
                          <DropdownMenuItem
                            onClick={() => setConfirm({ kind: "deactivate", user: u })}
                            disabled={isSelf}
                            className="gap-2 text-xs"
                          >
                            <Ban className="h-3.5 w-3.5" /> Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleReactivate(u)} className="gap-2 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Reactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setConfirm({ kind: "delete", user: u })}
                          disabled={isSelf}
                          className="gap-2 text-xs text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {total > 0 && (
        <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
          <span>
            {total} user{total === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: page - 1 }))}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span>
              Page {page} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page >= pageCount}
              onClick={() => setFilters((f) => ({ ...f, page: page + 1 }))}
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editing} />
      <ResetPasswordDialog user={resetting} onOpenChange={(open) => !open && setResetting(null)} />
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm?.kind === "delete" ? "Delete user?" : "Deactivate user?"}
        description={
          confirm?.kind === "delete" ? (
            <>
              This permanently deletes <strong>{confirm ? displayName(confirm.user) : ""}</strong> and everything tied
              to the account — training attempts, lesson progress, messages. This cannot be undone. Deactivate instead
              if you may need the history.
            </>
          ) : (
            <>
              <strong>{confirm ? displayName(confirm.user) : ""}</strong> will be signed out of every app and unable to
              sign in until reactivated. Their data is kept.
            </>
          )
        }
        confirmLabel={confirm?.kind === "delete" ? "Delete permanently" : "Deactivate"}
        destructive
        pending={setActive.isPending || deleteUser.isPending}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
