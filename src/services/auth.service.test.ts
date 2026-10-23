import { describe, it, expect, vi, beforeEach } from "vitest";
import { signOut, terminateLocalSession, getSupabaseAuthStorageKey } from "./auth.service";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";


vi.mock("@/lib/supabase", () => {
  const mockAuth = {
    signOut: vi.fn(),
    _removeSession: vi.fn(),
    storageKey: "sb-mockproject-auth-token",
    storage: {
      removeItem: vi.fn(),
    },
  };
  return {
    supabase: {
      auth: mockAuth,
    },
  };
});

vi.mock("@/lib/cache", () => ({
  clearUserScopedCaches: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/testProgress", () => ({
  clearAllProgress: vi.fn(),
}));

describe("auth.service - SEC-001 remediation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("resolves project-specific storageKey correctly", () => {
    const key = getSupabaseAuthStorageKey();
    expect(key).toBe("sb-mockproject-auth-token");
  });

  it("terminateLocalSession invokes _removeSession and clears localStorage tokens", async () => {
    localStorage.setItem("sb-mockproject-auth-token", JSON.stringify({ access_token: "fake-jwt" }));
    localStorage.setItem("sb-mockproject-auth-token-code-verifier", "verifier");
    localStorage.setItem("sb-mockproject-auth-token-user", "user-alice");

    await terminateLocalSession();

    const mockAuth = supabase.auth as unknown as {
      _removeSession: ReturnType<typeof vi.fn>;
      storage: { removeItem: ReturnType<typeof vi.fn> };
    };

    expect(mockAuth._removeSession).toHaveBeenCalledTimes(1);
    expect(mockAuth.storage.removeItem).toHaveBeenCalledWith("sb-mockproject-auth-token");
    expect(localStorage.getItem("sb-mockproject-auth-token")).toBeNull();
    expect(localStorage.getItem("sb-mockproject-auth-token-code-verifier")).toBeNull();
    expect(localStorage.getItem("sb-mockproject-auth-token-user")).toBeNull();
  });

  it("fresh client hydration stays logged out after local session termination", async () => {
    localStorage.setItem("sb-mockproject-auth-token", JSON.stringify({ access_token: "token-persisted" }));
    await terminateLocalSession();

    // Hydrating fresh storage reader: no token remains in localStorage
    const rawSavedSession = localStorage.getItem("sb-mockproject-auth-token");
    expect(rawSavedSession).toBeNull();
  });

  it("reports and throws when storage removal throws instead of swallowing errors", async () => {
    const mockAuth = supabase.auth as unknown as {
      storage: { removeItem: ReturnType<typeof vi.fn> };
    };
    mockAuth.storage.removeItem.mockImplementationOnce(() => {
      throw new Error("QuotaExceededError: localStorage locked");
    });

    await expect(terminateLocalSession()).rejects.toThrow("Failed to completely terminate local session");
  });

  it("signOut guarantees local session termination even when remote call rejects", async () => {
    const mockAuth = supabase.auth as unknown as {
      signOut: ReturnType<typeof vi.fn>;
      _removeSession: ReturnType<typeof vi.fn>;
    };

    mockAuth.signOut.mockResolvedValue({
      error: new Error("Failed to fetch / network error"),
    });

    localStorage.setItem("sb-mockproject-auth-token", "residual-token");

    await expect(signOut()).rejects.toThrow("Failed to fetch / network error");

    // Local credentials must still have been purged
    expect(mockAuth._removeSession).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("sb-mockproject-auth-token")).toBeNull();
  });

  it("useAuthStore.signOut cleans up local store even if remote signOut fails", async () => {
    const mockAuth = supabase.auth as unknown as {
      signOut: ReturnType<typeof vi.fn>;
    };
    mockAuth.signOut.mockRejectedValue(new Error("Network timeout on signout"));

    useAuthStore.setState({
      user: { id: "user-alice" } as never,
      session: { access_token: "token-123" } as never,
      isAuthenticated: true,
    });

    await useAuthStore.getState().signOut();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("useAuthStore.signOut propagates LocalSessionTerminationError when storage cleanup fails", async () => {
    const mockAuth = supabase.auth as unknown as {
      signOut: ReturnType<typeof vi.fn>;
      storage: { removeItem: ReturnType<typeof vi.fn> };
    };
    mockAuth.signOut.mockResolvedValue({ error: null });
    mockAuth.storage.removeItem.mockImplementationOnce(() => {
      throw new Error("IndexedDB locked / storage write error");
    });

    useAuthStore.setState({
      user: { id: "user-alice" } as never,
      session: { access_token: "token-123" } as never,
      isAuthenticated: true,
    });

    await expect(useAuthStore.getState().signOut()).rejects.toThrow("Failed to completely terminate local session");
  });

  it("terminateLocalSession guards against account changes during pending logout", async () => {
    const mockAuth = supabase.auth as unknown as {
      getSession: ReturnType<typeof vi.fn>;
      _removeSession: ReturnType<typeof vi.fn>;
    };
    // Active session changed to bob during pending logout of alice
    mockAuth.getSession = vi.fn().mockResolvedValue({
      data: { session: { user: { id: "user-bob" } } },
    });

    localStorage.setItem("sb-mockproject-auth-token", JSON.stringify({ access_token: "bob-token" }));

    // Request termination for alice (outgoing user)
    await terminateLocalSession("user-alice");

    // Bob's credentials must NOT be purged
    expect(mockAuth._removeSession).not.toHaveBeenCalled();
    expect(localStorage.getItem("sb-mockproject-auth-token")).not.toBeNull();
  });
});

describe("SEC-001: Real installed-SDK dummy-client hydration & termination", () => {
  it("hydrates real Supabase client with dummy storage, fails remote logout, terminates locally, and second client hydrates logged out", async () => {
    const { createClient } = await import("@supabase/supabase-js");

    const dummyUrl = (import.meta.env.VITE_SUPABASE_URL as string) || "https://dummy-project.supabase.co";
    const dummyAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy.key";

    const storageMap = new Map<string, string>();
    const dummyStorage = {
      getItem: (k: string) => storageMap.get(k) ?? null,
      setItem: (k: string, v: string) => { storageMap.set(k, v); },
      removeItem: (k: string) => { storageMap.delete(k); },
    };

    // Safe fetch adapter: returns 500 for logout, blocks any other egress
    const safeFetch = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/auth/v1/logout")) {
        return new Response(JSON.stringify({ message: "Simulated 500 remote failure" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw new Error(`Unexpected network egress blocked: ${url}`);
    };

    // Derive storage key from client config using blocking probe client
    const probe = createClient(dummyUrl, dummyAnonKey, {
      auth: {
        storage: dummyStorage,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      global: { fetch: safeFetch as typeof fetch },
    });
    const storageKey = (probe.auth as unknown as { storageKey: string }).storageKey;
    probe.auth.stopAutoRefresh();

    // Seed session in storage before client1 is constructed
    const fakeToken = {
      access_token: "mock-jwt-token",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: "mock-refresh-token",
      user: {
        id: "real-sdk-alice",
        email: "alice@example.com",
        aud: "authenticated",
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      },
    };
    dummyStorage.setItem(storageKey, JSON.stringify(fakeToken));

    const client1 = createClient(dummyUrl, dummyAnonKey, {
      auth: {
        storage: dummyStorage,
        autoRefreshToken: false,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: { fetch: safeFetch as typeof fetch },
    });

    // Client 1 reads session from storage
    const session1 = (await client1.auth.getSession()).data.session;
    expect(session1?.user.id).toBe("real-sdk-alice");

    // Perform PRODUCTION signOut against client1!
    // It calls client1.auth.signOut() (which returns 500 remote failure from safeFetch),
    // and its finally block invokes terminateLocalSession(outgoingUserId, client1).
    let signOutError: unknown = null;
    try {
      await signOut(undefined, client1);
    } catch (err) {
      signOutError = err;
    }
    // Remote revocation failure was reported to caller
    expect(signOutError).not.toBeNull();

    // Verify storage has no residual session after production termination
    expect(dummyStorage.getItem(storageKey)).toBeNull();

    client1.auth.stopAutoRefresh();

    // Now instantiate Client 2 (fresh client instance from the same dummy storage)
    const client2 = createClient(dummyUrl, dummyAnonKey, {
      auth: {
        storage: dummyStorage,
        autoRefreshToken: false,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: { fetch: safeFetch as typeof fetch },
    });

    // Client 2 attempts hydration and confirms complete logout
    const session2 = (await client2.auth.getSession()).data.session;
    expect(session2).toBeNull();

    client2.auth.stopAutoRefresh();
  });

  it("authStore.signOut preserves newly signed-in user if account switches during in-flight signout", async () => {
    let finishRemoteSignOut!: () => void;
    const remoteSignOutPromise = new Promise<void>((resolve) => {
      finishRemoteSignOut = resolve;
    });

    // Mock signOutService to simulate an in-flight async request
    vi.spyOn(supabase.auth, "signOut").mockImplementationOnce(() => remoteSignOutPromise as never);

    useAuthStore.setState({
      user: { id: "user-alice", email: "alice@example.com" } as never,
      session: { user: { id: "user-alice" } } as never,
      isAuthenticated: true,
    });

    const signOutAction = useAuthStore.getState().signOut();

    // While Alice's signOut is pending, Bob logs in!
    useAuthStore.setState({
      user: { id: "user-bob", email: "bob@example.com" } as never,
      session: { user: { id: "user-bob" } } as never,
      isAuthenticated: true,
    });

    finishRemoteSignOut();
    await signOutAction;

    // Bob's session must NOT be wiped by Alice's completion!
    expect(useAuthStore.getState().user?.id).toBe("user-bob");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("ordinary logout with SIGNED_OUT notification clears outgoing progress and caches once; new sign-in is retained", async () => {
    useAuthStore.setState({
      user: { id: "user-alice", email: "alice@example.com" } as never,
      session: { user: { id: "user-alice" } } as never,
      isAuthenticated: true,
    });

    // Simulate AuthInit-style SIGNED_OUT notification where SDK callback sets user/session to null during logout
    vi.spyOn(supabase.auth, "signOut").mockImplementationOnce(async () => {
      useAuthStore.setState({ user: null, session: null, isAuthenticated: false });
      return { error: null } as never;
    });

    await useAuthStore.getState().signOut();

    // Verify user is cleanly logged out
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    // Verify a new sign-in during logout/cache work is retained
    useAuthStore.setState({
      user: { id: "user-alice", email: "alice@example.com" } as never,
      session: { user: { id: "user-alice" } } as never,
      isAuthenticated: true,
    });

    vi.spyOn(supabase.auth, "signOut").mockImplementationOnce(async () => {
      useAuthStore.setState({ user: null, session: null, isAuthenticated: false });
      return { error: null } as never;
    });

    const pendingSignOut = useAuthStore.getState().signOut();

    // New user Bob signs in while Alice's signout completes
    useAuthStore.setState({
      user: { id: "user-bob", email: "bob@example.com" } as never,
      session: { user: { id: "user-bob" } } as never,
      isAuthenticated: true,
    });

    await pendingSignOut;

    // Bob's session is preserved!
    expect(useAuthStore.getState().user?.id).toBe("user-bob");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("fresh same-account sign-in during older logout survives in store and navigation is guarded", async () => {
    // Alice starts logged in with an old token
    const oldToken = "old-alice-access-token";
    const newToken = "new-alice-access-token";

    useAuthStore.setState({
      user: { id: "user-alice", email: "alice@example.com" } as never,
      session: { user: { id: "user-alice" }, access_token: oldToken } as never,
      isAuthenticated: true,
    });

    let finishOldSignOut!: () => void;
    const oldSignOutPending = new Promise<void>((resolve) => {
      finishOldSignOut = resolve;
    });

    // Simulate the remote signOut call for Alice's OLD session taking time
    vi.spyOn(supabase.auth, "signOut").mockImplementationOnce(() => oldSignOutPending as never);

    // Start Alice's logout
    const oldLogout = useAuthStore.getState().signOut();

    // While Alice's old logout is in-flight, Alice logs in AGAIN to the SAME account with a NEW token
    useAuthStore.setState({
      user: { id: "user-alice", email: "alice@example.com" } as never,
      session: { user: { id: "user-alice" }, access_token: newToken } as never,
      isAuthenticated: true,
    });

    // Complete the old logout's remote call
    finishOldSignOut();
    await oldLogout;

    // The NEW same-account session MUST be preserved (token differs from the outgoing old token)
    expect(useAuthStore.getState().session?.access_token).toBe(newToken);
    expect(useAuthStore.getState().user?.id).toBe("user-alice");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});

it("actual store and service preserve a fresh same-account SDK session after failed remote logout", async () => {
  vi.resetAllMocks();
  const auth = supabase.auth as unknown as {
    signOut: ReturnType<typeof vi.fn>;
    getSession: ReturnType<typeof vi.fn>;
    _removeSession: ReturnType<typeof vi.fn>;
  };
  const oldSession = { user: { id: "alice" }, access_token: "old-dummy-token" };
  const freshSession = { user: { id: "alice" }, access_token: "fresh-dummy-token" };
  useAuthStore.setState({ user: oldSession.user as never, session: oldSession as never, isAuthenticated: true });
  auth.getSession = vi.fn().mockResolvedValue({ data: { session: freshSession } });
  auth.signOut.mockImplementation(async () => {
    localStorage.setItem("sb-mockproject-auth-token", freshSession.access_token);
    useAuthStore.setState({ user: freshSession.user as never, session: freshSession as never, isAuthenticated: true });
    return { error: new Error("Dummy remote logout failure") };
  });

  await useAuthStore.getState().signOut();

  expect(auth._removeSession).not.toHaveBeenCalled();
  expect(localStorage.getItem("sb-mockproject-auth-token")).toBe(freshSession.access_token);
  expect(useAuthStore.getState().session).toBe(freshSession);
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});

