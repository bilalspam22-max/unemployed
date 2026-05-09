"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await signIn.email({ email, password });
    setLoading(false);
    if (err) {
      setError("Email ou mot de passe incorrect.");
    } else {
      router.push("/dashboard");
      router.refresh();
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
    }}>
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
      </div>
    </div>
  );
}
