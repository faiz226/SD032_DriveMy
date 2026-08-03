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

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
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

/** Resend the signup confirmation email. */
export async function resendEmailConfirmation(email: string, captchaToken?: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      captchaToken,
    },
  });
  if (error) throw error;
}

/** Update the authenticated user's password (called after clicking the reset link). */
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}
