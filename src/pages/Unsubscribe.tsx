import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { checkUnsubscribeToken, confirmUnsubscribe } from "@/services/api";

type State = "loading" | "valid" | "already" | "invalid" | "done" | "error";

/**
 * Public page reached from the Unsubscribe link in outbound mail.
 *
 * Two steps on purpose: the GET only *checks* the token, and nothing is
 * suppressed until the person presses the button (a POST). Mail clients and
 * security scanners pre-fetch every link in a message, so a page that acted on
 * load would unsubscribe people who never clicked.
 *
 * Unauthenticated by design — the recipient will not be signed in to the
 * dashboard, and requiring a login to stop email is a dark pattern.
 */
export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await checkUnsubscribeToken(token);
        if (cancelled) return;
        if (data.valid) {
          setEmail(data.email);
          setState("valid");
        } else if (data.reason === "already_unsubscribed") {
          setState("already");
        } else {
          setState("invalid");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const confirm = async () => {
    setSubmitting(true);
    try {
      await confirmUnsubscribe(token);
      setState("done");
    } catch {
      setState("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full bg-card border rounded-xl shadow-sm p-8 text-center">
        <h1 className="text-xl font-bold text-foreground mb-1">Medulate Sync</h1>
        <p className="text-xs text-muted-foreground mb-6">Email preferences</p>

        {state === "loading" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">Checking your link…</p>
          </div>
        )}

        {state === "valid" && (
          <div className="flex flex-col items-center gap-4 py-2">
            <p className="text-sm text-foreground">
              Stop sending cohort summary emails
              {email ? (
                <>
                  {" "}to <span className="font-medium">{email}</span>
                </>
              ) : null}
              ?
            </p>
            <Button onClick={confirm} disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Unsubscribing…
                </>
              ) : (
                "Unsubscribe"
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Password resets and other account emails are not affected.
            </p>
          </div>
        )}

        {(state === "done" || state === "already") && (
          <div className="flex flex-col items-center gap-3 py-2">
            <CheckCircle className="h-8 w-8 text-[#0a7d0a]" aria-hidden />
            <p className="text-sm text-foreground">
              {state === "done"
                ? "You have been unsubscribed."
                : "You were already unsubscribed."}
            </p>
            <p className="text-xs text-muted-foreground">
              Changed your mind? Ask your coordinator to re-enable summaries.
            </p>
          </div>
        )}

        {(state === "invalid" || state === "error") && (
          <div className="flex flex-col items-center gap-3 py-2">
            <XCircle className="h-8 w-8 text-destructive" aria-hidden />
            <p className="text-sm text-foreground">
              {state === "invalid"
                ? "This unsubscribe link is not valid."
                : "Something went wrong. Please try again."}
            </p>
            <p className="text-xs text-muted-foreground">
              You can also reply to any summary email and ask to be removed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
