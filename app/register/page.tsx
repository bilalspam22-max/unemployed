"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10000);
    try {
      const resp = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const code = data?.code as string | undefined;
        const map: Record<string, string> = {
          USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Cet email est déjà utilisé. Connecte-toi ou utilise un autre email.",
          USER_ALREADY_EXISTS: "Cet email est déjà utilisé. Connecte-toi ou utilise un autre email.",
          PASSWORD_TOO_SHORT: "Mot de passe trop court (8 caractères minimum).",
          PASSWORD_TOO_LONG: "Mot de passe trop long.",
          INVALID_EMAIL: "Email invalide.",
        };
        setError(
          (code && map[code]) ||
          data?.message ||
          `Erreur lors de la création du compte (code ${resp.status}).`
        );
        setLoading(false);
        return;
      }
      window.location.href = "/dashboard";
    } catch (e: unknown) {
      clearTimeout(t);
      const isAbort = (e as Error)?.name === "AbortError";
      setError(isAbort ? "Le serveur ne répond pas (timeout)." : "Erreur réseau. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      position: "relative",
    }}>
      <div style={{ position: "absolute", top: 16, right: 16 }}>
        <ThemeToggle />
      </div>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, var(--primary) 0%, #6E83F0 100%)",
            margin: "0 auto 12px auto",
            boxShadow: "0 2px 8px rgba(61,91,227,.3)",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", inset: 9,
              background: "white", borderRadius: 5,
              clipPath: "polygon(0 0, 100% 0, 100% 65%, 65% 65%, 65% 100%, 0 100%)",
            }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>recherche.</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>CRM personnel · job search</div>
        </div>

        <div className="card card__pad-lg">
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px 0" }}>Créer un compte</h1>
          <p className="muted" style={{ fontSize: 13, margin: "0 0 20px 0" }}>
            Déjà un compte ?{" "}
            <Link href="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>
              Se connecter
            </Link>
          </p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label" htmlFor="name">Nom complet</label>
              <input
                id="name"
                type="text"
                className="input"
                placeholder="Bilal Naciri"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="vous@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="Minimum 8 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div style={{
                background: "var(--danger-soft)", color: "#9b2e3e",
                borderRadius: "var(--r-md)", padding: "8px 12px",
                fontSize: 13, marginBottom: 12,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn--primary btn--full"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading ? "Création…" : "Créer mon compte"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
