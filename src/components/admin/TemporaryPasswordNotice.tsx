import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TemporaryPasswordNoticeProps {
  password: string;
  /** Who the password belongs to, e.g. an email. */
  account?: string;
}

/**
 * Shows a server-generated temporary password exactly once, with a copy
 * button. The API never returns it again, so the admin must copy it now.
 */
export function TemporaryPasswordNotice({ password, account }: TemporaryPasswordNoticeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (non-HTTPS / permissions); the value stays selectable.
    }
  };

  return (
    <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 space-y-2" role="status">
      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <KeyRound className="h-3.5 w-3.5" /> Temporary password{account ? ` for ${account}` : ""}
      </p>
      <div className="flex items-center gap-2">
        <code
          data-testid="temporary-password"
          className="flex-1 select-all rounded bg-background px-2 py-1.5 font-mono text-sm tracking-wide text-foreground border"
        >
          {password}
        </code>
        <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        This is shown only once. Share it securely and ask the user to change it after signing in.
      </p>
    </div>
  );
}
