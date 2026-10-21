import { supabase } from "@/lib/supabase";

/**
 * `captchaToken` must be forwarded to Supabase on every endpoint that
 * Supabase's captcha protection covers (sign-up, sign-in, password reset and
 * confirmation resend). Collecting the token in the UI without sending it here
 * leaves the captcha purely decorative — and if captcha is enabled on the
 * hosted project, omitting it makes the request fail outright.
 */

export async function signUp(email: string, password: string, captchaToken?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { captchaToken },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string, captchaToken?: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken },
  });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle(nextUrl?: string) {
  const redirectParams = nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : '';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback${redirectParams}` },
  });
  if (error) throw error;
  return data;
}

/**
 * Resolve the project-specific storage key used by the Supabase client.
 * Prefer the active client's configured key; fall back to parsing the configured project URL.
 */
export function getSupabaseAuthStorageKey(): string {
  const auth = supabase.auth as unknown as { storageKey?: string };
  if (typeof auth?.storageKey === "string" && auth.storageKey.length > 0) {
    return auth.storageKey;
  }

  const url = import.meta.env.VITE_SUPABASE_URL as string;
  if (url) {
    try {
      const parsed = new URL(url);
      const ref = parsed.hostname.split(".")[0];
      if (ref) return `sb-${ref}-auth-token`;
    } catch {
      // Fallback below
    }
  }

  return "sb-default-auth-token";
}

export class LocalSessionTerminationError extends Error {
  constructor(message: string, public readonly errors: Error[] = []) {
    super(message);
    this.name = "LocalSessionTerminationError";
  }
}

/**
 * Terminate local SDK session state and purge stored credentials.
 * Ensures the client cannot restore credentials upon browser reload even if remote revocation failed.
 */
export async function terminateLocalSession(
  outgoingSessionOrToken?: { token?: string; userId?: string } | string,
  targetClient = supabase
): Promise<void> {
  const auth = targetClient.auth as unknown as {
    _removeSession?: () => Promise<void>;
    storageKey?: string;
    storage?: { removeItem: (key: string) => Promise<void> | void };
    getSession?: () => Promise<{ data: { session: { user?: { id?: string }; access_token?: string } | null } }>;
  };

  // Outgoing-session guard: if an account switch or session refresh occurred during pending logout, do not wipe the new session
  if (outgoingSessionOrToken && typeof auth.getSession === "function") {
    try {
      const current = await auth.getSession();
      const currentSession = current?.data?.session;
      if (currentSession) {
        const currentUserId = currentSession.user?.id;
        const currentToken = currentSession.access_token;

        let isNewSession = false;
        if (typeof outgoingSessionOrToken === "string") {
          // If identifier matches neither token nor user ID, it's a new session
          const matchesToken = currentToken && currentToken === outgoingSessionOrToken;
          const matchesUser = currentUserId && currentUserId === outgoingSessionOrToken;
          if (!matchesToken && !matchesUser) {
            isNewSession = true;
          }
        } else {
          const { token, userId } = outgoingSessionOrToken;
          if (token && currentToken && currentToken !== token) {
            isNewSession = true;
          } else if (userId && currentUserId && currentUserId !== userId) {
            isNewSession = true;
          }
        }

        if (isNewSession) {
          console.warn(`[auth] Account/session change race during pending logout; skipping termination.`);
          return;
        }
      }
    } catch {
      // Continue with cleanup if session read fails
    }
  }

  const cleanupErrors: Error[] = [];

  // 1. Invoke SDK internal session removal if present to reset in-memory state and notify listeners
  if (typeof auth?._removeSession === "function") {
    try {
      await auth._removeSession();
    } catch (err) {
      cleanupErrors.push(err instanceof Error ? err : new Error(String(err)));
    }
  }

  // 2. Explicitly purge auth tokens, code verifiers, and user keys from storage adapter and localStorage
  const storageKey = auth?.storageKey || getSupabaseAuthStorageKey();
  const storage = auth?.storage;
  const keysToRemove = [storageKey, `${storageKey}-code-verifier`, `${storageKey}-user`];

  for (const k of keysToRemove) {
    if (storage && typeof storage.removeItem === "function") {
      try {
        await storage.removeItem(k);
      } catch (err) {
        cleanupErrors.push(err instanceof Error ? err : new Error(String(err)));
      }
    }
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(k);
      } catch (err) {
        cleanupErrors.push(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }

  if (cleanupErrors.length > 0) {
    console.error("[auth] Encountered errors during local session termination:", cleanupErrors);
    throw new LocalSessionTerminationError(
      `Failed to completely terminate local session: ${cleanupErrors.map((e) => e.message).join("; ")}`,
      cleanupErrors
    );
  }
}

export async function signOut(
  outgoingSessionOrToken?: { token?: string; userId?: string } | string,
  targetClient = supabase
) {
  let remoteError: Error | null = null;
  let localError: Error | null = null;
  let resolvedSession = outgoingSessionOrToken;

  if (!resolvedSession) {
    try {
      const sessionRes = await targetClient.auth.getSession();
      const s = sessionRes?.data?.session;
      if (s) {
        resolvedSession = { token: s.access_token, userId: s.user?.id };
      }
    } catch {
      // Continue
    }
  }

  try {
    const res = await targetClient.auth.signOut();
    if (res?.error) {
      remoteError = res.error;
    }
  } catch (err) {
    remoteError = err instanceof Error ? err : new Error(String(err));
  } finally {
    try {
      // Guarantee local session termination even when remote revocation fails
      await terminateLocalSession(resolvedSession, targetClient);
    } catch (err) {
      localError = err instanceof Error ? err : new Error(String(err));
    }
  }

  if (localError) {
    throw localError;
  }
  if (remoteError) {
    throw remoteError;
  }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/** Send a password-reset email. redirectTo must be the /reset-password page. */
export async function sendPasswordResetEmail(email: string, captchaToken?: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
    captchaToken,
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return data;
}

export async function resendEmailConfirmation(email: string, captchaToken?: string) {
  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
      captchaToken,
    },
  });
  if (error) throw error;
  return data;
}

export { resendEmailConfirmation as resendConfirmationEmail };
