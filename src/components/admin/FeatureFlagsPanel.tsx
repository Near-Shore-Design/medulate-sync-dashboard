import { useState } from "react";
import { Flag, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useFeatureFlags, useSaveFeatureFlag } from "@/hooks/useAdmin";
import { formatApiError } from "@/lib/apiError";

const KNOWN_FLAGS: Record<string, string> = {
  demo_logins: "Show the demo quick-login buttons on the training app's login screen.",
};

export function FeatureFlagsPanel() {
  const { toast } = useToast();
  const { data: flags, isLoading } = useFeatureFlags();
  const saveFlag = useSaveFeatureFlag();
  const [newKey, setNewKey] = useState("");

  const toggle = (id: number, key: string, enabled: boolean) =>
    saveFlag.mutate(
      { id, enabled },
      {
        onSuccess: () => toast({ title: "Setting saved", description: `${key} is now ${enabled ? "on" : "off"}.` }),
        onError: (err) => toast({ title: "Could not save setting", description: formatApiError(err), variant: "destructive" }),
      },
    );

  const missingKnown = Object.keys(KNOWN_FLAGS).filter((k) => !(flags ?? []).some((f) => f.key === k));

  const create = (key: string) =>
    saveFlag.mutate(
      { key, enabled: true, note: KNOWN_FLAGS[key] ?? "" },
      {
        onSuccess: () => {
          setNewKey("");
          toast({ title: "Setting added", description: `${key} was created (on).` });
        },
        onError: (err) => toast({ title: "Could not add setting", description: formatApiError(err), variant: "destructive" }),
      },
    );

  return (
    <div className="rounded-lg border bg-card shadow-card">
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Flag className="h-4 w-4 text-muted-foreground" /> Platform settings
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Global switches read by the apps before sign-in. Changes apply to every institution.
        </p>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading settings...
        </div>
      ) : (
        <div className="divide-y">
          {(flags ?? []).map((flag) => (
            <div key={flag.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-sm font-medium font-mono text-foreground">{flag.key}</p>
                <p className="text-[11px] text-muted-foreground">{flag.note || KNOWN_FLAGS[flag.key] || "—"}</p>
              </div>
              <Switch
                checked={flag.enabled}
                disabled={saveFlag.isPending}
                onCheckedChange={(checked) => toggle(flag.id, flag.key, checked)}
                aria-label={`Toggle ${flag.key}`}
              />
            </div>
          ))}
          {missingKnown.map((key) => (
            <div key={key} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-sm font-medium font-mono text-foreground">{key}</p>
                <p className="text-[11px] text-muted-foreground">{KNOWN_FLAGS[key]} Not created yet.</p>
              </div>
              <Button size="sm" variant="outline" disabled={saveFlag.isPending} onClick={() => create(key)}>
                Create
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2 px-4 py-3">
            <Input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              placeholder="new_flag_key"
              className="h-8 max-w-xs font-mono text-xs"
              aria-label="New flag key"
            />
            <Button size="sm" variant="outline" className="gap-1.5" disabled={!newKey || saveFlag.isPending} onClick={() => create(newKey)}>
              <Plus className="h-3.5 w-3.5" /> Add flag
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
