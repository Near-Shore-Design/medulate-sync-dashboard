/**
 * apiFetch throws `new Error(detail || message || JSON.stringify(body))`, so DRF
 * field errors arrive as a JSON string like `{"email":["A user ..."]}`. Turn
 * that into something readable for a toast.
 */
export function formatApiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return raw || "Something went wrong.";
  }
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const parts = Object.entries(parsed as Record<string, unknown>).map(([field, value]) => {
      const text = Array.isArray(value) ? value.join(" ") : String(value);
      return field === "non_field_errors" || field === "detail" ? text : `${humanize(field)}: ${text}`;
    });
    return parts.join(" ") || raw;
  }
  if (Array.isArray(parsed)) return parsed.join(" ");
  return raw;
}

function humanize(field: string): string {
  const spaced = field.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
