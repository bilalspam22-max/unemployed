"use client";
import { createAuthClient } from "better-auth/react";
import { useIsDemo, getDemoSession } from "./demo-provider";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});

const {
  signIn: _signIn,
  signUp: _signUp,
  signOut: _signOut,
  useSession: _useSession,
} = authClient;

export const signIn = _signIn;
export const signUp = _signUp;
export const signOut = _signOut;

// Wrapper around useSession that returns demo data when in demo mode
export function useSession() {
  const isDemo = useIsDemo();
  const realSession = _useSession();

  if (isDemo) {
    return getDemoSession() as unknown as typeof realSession;
  }

  return realSession;
}
