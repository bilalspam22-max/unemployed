"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function LoginPage() {
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
      const resp = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const code = data?.code as string | undefined;
        const map: Record<string, string> = {
          INVALID_EMAIL_OR_PASSWORD: "Email ou mot de passe incorrect.",
          USER_NOT_FOUND: "Aucun compte trouvé avec cet email.",
          INVALID_PASSWORD: "Mot de passe incorrect.",
          INVALID_EMAIL: "Email invalide.",
        };
        setError(
          (code && map[code]) ||
          data?.message ||
          `Erreur de connexion (code ${resp.status}).`
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
        {/* Brand */}
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

        {/* Card */}
        <div className="card card__pad-lg">
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px 0" }}>Connexion</h1>
          <p className="muted" style={{ fontSize: 13, margin: "0 0 20px 0" }}>
            Pas encore de compte ?{" "}
            <Link href="/register" style={{ color: "var(--primary)", fontWeight: 600 }}>
              Créer un compte
            </Link>
          </p>

          <form onSubmit={handleSubmit}>
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>

        {/* Demo CTA */}
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => { window.location.href = "/dashboard?demo=true"; }}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: "var(--r-lg, 12px)",
              border: "2px solid transparent",
              background: "linear-gradient(var(--bg), var(--bg)) padding-box, linear-gradient(135deg, var(--primary), #8B5CB8, #E08A2B) border-box",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              transition: "transform .15s ease, box-shadow .15s ease",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(61,91,227,.2)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, var(--primary), #8B5CB8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>
              🔍
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                Découvrir avec un compte démo
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
                Explorez l&apos;outil avec des données fictives — aucune inscription requise
              </div>
            </div>
            <div style={{
              marginLeft: "auto", fontSize: 18, color: "var(--primary)", flexShrink: 0,
            }}>
              →
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
