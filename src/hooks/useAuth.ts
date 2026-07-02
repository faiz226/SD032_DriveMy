import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { signUp, signIn, signInWithGoogle, signOut, getSession } from "@/services/auth.service";

export function useSession() {
  return useQuery({
    queryKey: ["auth", "session"],
    queryFn: getSession,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSignUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => signUp(email, password),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth", "session"] }),
  });
}

export function useSignIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => signIn(email, password),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth", "session"] }),
  });
}

export function useSignInWithGoogle() {
  return useMutation({ mutationFn: signInWithGoogle });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: signOut,
    onSuccess: () => qc.removeQueries({ queryKey: ["auth", "session"] }),
  });
}