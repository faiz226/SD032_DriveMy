import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];
const removeResult = { error: null as null | Error };
const rpcResult = { error: null as null | Error };

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "user-1" } } } }), getUser: vi.fn() },
    storage: { from: vi.fn(() => ({ remove: vi.fn(async (paths: string[]) => { calls.push(`remove ${paths.join(",")}`); return removeResult; }) })) },
    rpc: vi.fn(async (name: string) => { calls.push(`rpc ${name}`); return rpcResult; }),
    from: vi.fn(),
  },
}));
vi.mock("./results.service", () => ({ clearUserResultsQueue: vi.fn().mockResolvedValue(undefined), markUserDeleted: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/stores/authStore", () => ({ useAuthStore: { getState: () => ({ user: { id: "user-1" } }) } }));

import { deleteAccount } from "./account.service";

beforeEach(() => { calls.length = 0; removeResult.error = null; rpcResult.error = null; });

describe("deleteAccount and the profile picture", () => {
  it("removes the learner's picture from the public bucket before the account goes", async () => {
    await deleteAccount();
    expect(calls).toEqual(["remove user-1/avatar.webp", "rpc delete_user"]);
  });

  it("still deletes the account when the picture cannot be removed", async () => {
    removeResult.error = new Error("storage down");
    await deleteAccount();
    expect(calls).toEqual(["remove user-1/avatar.webp", "rpc delete_user"]);
  });

  it("keeps everything in place for a retry when the account deletion itself fails", async () => {
    rpcResult.error = new Error("nope");
    await expect(deleteAccount()).rejects.toThrow("nope");
  });
});
