import { useEffect, useState } from "react";
import { KeyRound, Loader2, Mail } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useSendPasswordReset, useSetUserPassword, type AdminUser } from "@/hooks/useUsers";
import { formatApiError } from "@/lib/apiError";
import { TemporaryPasswordNotice } from "./TemporaryPasswordNotice";

interface ResetPasswordDialogProps {
  user: AdminUser | null;
  onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({ user, onOpenChange }: ResetPasswordDialogProps) {
  const { toast } = useToast();
  const setPassword = useSetUserPassword();
  const sendReset = useSendPasswordReset();
  const [mode, setMode] = useState<"generate" | "set">("generate");
  const [password, setPasswordValue] = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setMode("generate");
      setPasswordValue("");
      setTempPassword(null);
    }
  }, [user]);

  if (!user) return null;
  const label = user.full_name || user.email || user.username;

  const handleSetPassword = () => {
    setPassword.mutate(
      { id: user.id, password: mode === "set" ? password : "" },
      {
        onSuccess: (res) => {
          if (res.temporary_password) {
            setTempPassword(res.temporary_password);
            toast({ title: "Temporary password set", description: `Copy it now and share it with ${label}.` });
          } else {
            toast({ title: "Password updated", description: `${label}'s password was changed.` });
            onOpenChange(false);
          }
        },
        onError: (err) =>
          toast({ title: "Could not reset password", description: formatApiError(err), variant: "destructive" }),
      },
    );
  };

  const handleSendEmail = () => {
    sendReset.mutate(user.id, {
      onSuccess: (res) => {
        toast({ title: "Reset email sent", description: res.detail });
        onOpenChange(false);
      },
      onError: (err) =>
        toast({ title: "Could not send reset email", description: formatApiError(err), variant: "destructive" }),
    });
  };

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>{label}</DialogDescription>
        </DialogHeader>

        {tempPassword ? (
          <div className="space-y-4">
            <TemporaryPasswordNotice password={tempPassword} account={user.email || user.username} />
            <DialogFooter>
              <Button size="sm" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-5">
            <section className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5" /> Set a new password
              </h4>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={mode === "generate" ? "default" : "outline"}
                  onClick={() => setMode("generate")}
                >
                  Generate temporary
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={mode === "set" ? "default" : "outline"}
                  onClick={() => setMode("set")}
                >
                  Enter password
                </Button>
              </div>
              {mode === "set" && (
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  placeholder="New password"
                  autoComplete="new-password"
                  className="text-sm"
                />
              )}
              <p className="text-[11px] text-muted-foreground">
                The current password stops working immediately.
              </p>
              <Button
                size="sm"
                className="gap-2"
                disabled={setPassword.isPending || (mode === "set" && !password)}
                onClick={handleSetPassword}
              >
                {setPassword.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {mode === "generate" ? "Generate password" : "Set password"}
              </Button>
            </section>

            <section className="space-y-2 border-t pt-4">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Or email a reset link
              </h4>
              <p className="text-[11px] text-muted-foreground">
                {user.email
                  ? `Sends the standard "Reset your Medulate password" email to ${user.email}.`
                  : "This user has no email address on file."}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                disabled={!user.email || sendReset.isPending}
                onClick={handleSendEmail}
              >
                {sendReset.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Send reset email
              </Button>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
