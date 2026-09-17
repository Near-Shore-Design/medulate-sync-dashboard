import { describe, it, expect } from "vitest";
import { formatApiError } from "@/lib/apiError";
import { buildUsersQuery } from "@/hooks/useUsers";

describe("formatApiError", () => {
  it("passes plain messages through", () => {
    expect(formatApiError(new Error("You cannot delete your own account."))).toBe(
      "You cannot delete your own account.",
    );
  });

  it("flattens DRF field errors", () => {
    const err = new Error(JSON.stringify({ email: ["A user with this email already exists."], password: ["Too short.", "Too common."] }));
    expect(formatApiError(err)).toBe("Email: A user with this email already exists. Password: Too short. Too common.");
  });

  it("omits the field name for non_field_errors", () => {
    expect(formatApiError(new Error(JSON.stringify({ non_field_errors: ["Nope."] })))).toBe("Nope.");
  });

  it("has a fallback for empty errors", () => {
    expect(formatApiError(new Error(""))).toBe("Something went wrong.");
  });
});

describe("buildUsersQuery", () => {
  it("defaults to first page with a roster-sized page", () => {
    expect(buildUsersQuery({})).toBe("/users/?page=1&page_size=50");
  });

  it("maps filters to API params and skips 'all'", () => {
    const url = buildUsersQuery({
      search: "  jane ",
      accountType: "instructor",
      status: "inactive",
      department: 7,
      page: 3,
      pageSize: 25,
    });
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("search")).toBe("jane");
    expect(params.get("account_type")).toBe("instructor");
    expect(params.get("is_active")).toBe("false");
    expect(params.get("department")).toBe("7");
    expect(params.get("page")).toBe("3");
    expect(params.get("page_size")).toBe("25");

    const all = new URLSearchParams(buildUsersQuery({ accountType: "all", status: "all" }).split("?")[1]);
    expect(all.has("account_type")).toBe(false);
    expect(all.has("is_active")).toBe(false);
  });
});
