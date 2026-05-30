"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Database, Archive, User, ScrollText, Shield,
  RefreshCw, Trash2, Download, Eye, EyeOff,
  KeyRound, AlertTriangle, CheckCircle2, Copy,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { Tabs } from "@/components/ui/tabs";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/lib/store";
import { formatDate, formatDateShort } from "@/lib/utils";

type TabId = "data" | "backups" | "accounts" | "logs";

// ════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════════════════════

export default function AdminPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [activeTab, setActiveTab] = useState<TabId>("data");

  // Redirect non-admins
  useEffect(() => {
    if (isPending) return;
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== "admin") router.replace("/dashboard");
  }, [session, isPending, router]);

  if (isPending || !session) {
    return <div className="main__inner"><div className="muted">Chargement…</div></div>;
  }

  return (
    <div className="main__inner">
      <div className="page-head">
        <div>
          <h1 className="page-head__title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Shield size={24} strokeWidth={1.75} /> Administration
          </h1>
          <p className="page-head__sub">Gestion système, backups, comptes, audit</p>
        </div>
      </div>

      <Tabs<TabId>
        tabs={[
          { id: "data",     label: "Données", icon: Database },
          { id: "backups",  label: "Backups", icon: Archive },
          { id: "accounts", label: "Comptes", icon: User },
          { id: "logs",     label: "Logs",    icon: ScrollText },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "data"     && <DataTab />}
      {activeTab === "backups"  && <BackupsTab />}
      {activeTab === "accounts" && <AccountsTab />}
      {activeTab === "logs"     && <LogsTab />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  TAB 1 — DATA
// ════════════════════════════════════════════════════════════════════════

interface DbStats {
  totalSizeBytes: number;
  totalSizeMb:    number;
  tables:         Record<string, { count: number }>;
}
interface DiskStats {
  totalGb: number;
  freeGb:  number;
  usedGb:  number;
  usedPercent: number;
}
interface StatsResponse {
  db:   DbStats;
  disk: DiskStats | null;
  estimatedDaysUntilFull: number | null;
}

function DataTab() {
  const { showToast } = useToast();
  const [stats, setStats]     = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/stats");
    const j = await r.json();
    setStats(j.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCleanupLogs() {
    if (!confirm("Supprimer les logs de plus de 30 jours ?")) return;
    setCleaning(true);
    const r = await fetch("/api/admin/cleanup-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ daysToKeep: 30 }),
    });
    const j = await r.json();
    setCleaning(false);
    if (r.ok) {
      showToast(`${j.data.logsDeleted} logs supprimés ✓`);
      load();
    } else {
      showToast("Erreur cleanup");
    }
  }

  if (loading) return <div className="muted">Chargement des statistiques…</div>;
  if (!stats)  return <div className="muted">Erreur : aucune donnée</div>;

  const dbPercent = stats.disk ? Math.min(100, (stats.db.totalSizeBytes / (stats.disk.totalGb * 1024 ** 3)) * 100) : 0;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Disk usage */}
      <div className="card card__pad-lg">
        <div className="section-title" style={{ marginBottom: 12 }}>Stockage disque</div>
        {stats.disk ? (
          <>
            <ProgressBar
              value={stats.disk.usedPercent}
              label={`${stats.disk.usedGb} Go utilisés`}
              sublabel={`${stats.disk.freeGb} Go libres / ${stats.disk.totalGb} Go total`}
            />
            {stats.estimatedDaysUntilFull !== null && stats.estimatedDaysUntilFull < 10000 && (
              <div className="muted tiny" style={{ marginTop: 8 }}>
                Saturation estimée dans ~{stats.estimatedDaysUntilFull} jours (au rythme actuel)
              </div>
            )}
          </>
        ) : (
          <div className="muted tiny">Info disque indisponible (env non-Linux ?)</div>
        )}
      </div>

      {/* DB size */}
      <div className="card card__pad-lg">
        <div className="row between" style={{ marginBottom: 12 }}>
          <div className="section-title" style={{ margin: 0 }}>Base de données</div>
          <button className="btn btn--sm" onClick={load}><RefreshCw size={12} /> Rafraîchir</button>
        </div>
        <ProgressBar value={dbPercent} label={`${stats.db.totalSizeMb} Mo`} sublabel="Taille fichier recherche.db" />

        <div className="divider" />

        <div className="section-title">Répartition par table</div>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={{ textAlign: "left", padding: "8px 4px", color: "var(--ink-3)", fontWeight: 600 }}>Table</th>
              <th style={{ textAlign: "right", padding: "8px 4px", color: "var(--ink-3)", fontWeight: 600 }}>Records</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.db.tables).map(([name, info]) => (
              <tr key={name} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 4px", fontFamily: "var(--f-mono)" }}>{name}</td>
                <td style={{ padding: "8px 4px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{info.count.toLocaleString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="row gap-2 mt-4">
          <button className="btn" onClick={handleCleanupLogs} disabled={cleaning}>
            <Trash2 size={13} /> {cleaning ? "Nettoyage…" : "Nettoyer logs > 30j"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  TAB 2 — BACKUPS
// ════════════════════════════════════════════════════════════════════════

interface BackupItem {
  filename:  string;
  sizeMb:    number;
  createdAt: string;
  hash:      string | null;
  status:    "success";
}
interface BackupsResp {
  backups:    BackupItem[];
  lastBackup: BackupItem | null;
  backupDir:  string;
  settings:   { autoBackupIntervalHours: number; retentionDays: number };
}

function BackupsTab() {
  const { showToast } = useToast();
  const [data, setData] = useState<BackupsResp | null>(null);
  const [loading, setLoading]     = useState(true);
  const [working, setWorking]     = useState(false);
  const [confirmRestore, setConfirmRestore] = useState<BackupItem | null>(null);
  const [restoreInput, setRestoreInput]     = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/backups");
    const j = await r.json();
    setData(j.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleBackupNow() {
    setWorking(true);
    const r = await fetch("/api/admin/backup-now", { method: "POST" });
    const j = await r.json();
    setWorking(false);
    if (r.ok) {
      showToast(`Backup créé : ${j.data.filename} ✓`);
      load();
    } else {
      showToast("Erreur backup : " + (j.error ?? "inconnue"));
    }
  }

  async function handleRestore() {
    if (!confirmRestore) return;
    if (restoreInput !== "RESTORE") {
      showToast('Tape "RESTORE" pour confirmer');
      return;
    }
    setWorking(true);
    const r = await fetch("/api/admin/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ backupFile: confirmRestore.filename, confirmation: "RESTORE" }),
    });
    const j = await r.json();
    setWorking(false);
    setConfirmRestore(null);
    setRestoreInput("");
    if (r.ok) {
      showToast("Restauration OK — rechargement de la page…");
      setTimeout(() => window.location.reload(), 2000);
    } else {
      showToast("Erreur restore : " + (j.error ?? "inconnue"));
    }
  }

  if (loading) return <div className="muted">Chargement des backups…</div>;
  if (!data)   return <div className="muted">Erreur</div>;

  return (
    <>
      <div style={{ display: "grid", gap: 16 }}>
        {/* Last backup status */}
        <div className="card card__pad-lg">
          <div className="row between" style={{ marginBottom: 12 }}>
            <div className="section-title" style={{ margin: 0 }}>Dernière sauvegarde</div>
            <button className="btn btn--primary btn--sm" onClick={handleBackupNow} disabled={working}>
              <Archive size={13} /> {working ? "En cours…" : "Backup maintenant"}
            </button>
          </div>
          {data.lastBackup ? (
            <div>
              <div className="row gap-3" style={{ alignItems: "center" }}>
                <CheckCircle2 size={20} color="var(--success)" />
                <div>
                  <div className="semi" style={{ fontSize: 14 }}>{formatDate(data.lastBackup.createdAt)}</div>
                  <div className="muted tiny">{data.lastBackup.sizeMb} Mo · {data.lastBackup.filename}</div>
                </div>
                <Badge tone="success">SUCCESS</Badge>
              </div>
              {data.lastBackup.hash && (
                <div className="muted tiny" style={{ fontFamily: "var(--f-mono)", marginTop: 8 }}>
                  SHA256: {data.lastBackup.hash.slice(0, 16)}…{data.lastBackup.hash.slice(-8)}
                </div>
              )}
            </div>
          ) : (
            <div className="row gap-3">
              <AlertTriangle size={20} color="var(--warn)" />
              <div className="muted">Aucun backup encore créé.</div>
            </div>
          )}

          <div className="divider" />
          <div className="row gap-4 tiny muted">
            <span>📍 Dossier : <code style={{ fontFamily: "var(--f-mono)" }}>{data.backupDir}</code></span>
            <span>⏱ Auto : toutes les {data.settings.autoBackupIntervalHours}h</span>
            <span>🗑 Rétention : {data.settings.retentionDays} jours</span>
          </div>
        </div>

        {/* History */}
        <div className="card card__pad-lg">
          <div className="section-title" style={{ marginBottom: 12 }}>Historique ({data.backups.length})</div>
          {data.backups.length === 0 ? (
            <div className="muted">Aucun backup</div>
          ) : (
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "8px 4px", color: "var(--ink-3)", fontWeight: 600 }}>Date</th>
                  <th style={{ textAlign: "left", padding: "8px 4px", color: "var(--ink-3)", fontWeight: 600 }}>Fichier</th>
                  <th style={{ textAlign: "right", padding: "8px 4px", color: "var(--ink-3)", fontWeight: 600 }}>Taille</th>
                  <th style={{ textAlign: "right", padding: "8px 4px", color: "var(--ink-3)", fontWeight: 600 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.backups.map(b => (
                  <tr key={b.filename} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 4px" }}>{formatDateShort(b.createdAt)}</td>
                    <td style={{ padding: "8px 4px", fontFamily: "var(--f-mono)", fontSize: 12 }}>{b.filename}</td>
                    <td style={{ padding: "8px 4px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{b.sizeMb} Mo</td>
                    <td style={{ padding: "8px 4px", textAlign: "right" }}>
                      <button
                        className="btn btn--sm"
                        style={{ color: "var(--danger)" }}
                        onClick={() => setConfirmRestore(b)}
                      >
                        <Download size={11} /> Restaurer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Restore confirmation modal */}
      <Modal
        open={!!confirmRestore}
        onClose={() => { setConfirmRestore(null); setRestoreInput(""); }}
        title="⚠️ Confirmer la restauration"
        footer={
          <>
            <button className="btn" onClick={() => { setConfirmRestore(null); setRestoreInput(""); }}>Annuler</button>
            <button
              className="btn btn--primary"
              onClick={handleRestore}
              disabled={restoreInput !== "RESTORE" || working}
              style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
            >
              {working ? "Restauration…" : "Confirmer la restauration"}
            </button>
          </>
        }
      >
        <div className="ai-card" style={{ background: "var(--danger-soft)", borderColor: "rgba(212,74,92,.25)" }}>
          <div className="ai-card__label" style={{ color: "#9b2e3e" }}>Action destructive</div>
          <div className="ai-card__text" style={{ color: "#9b2e3e" }}>
            La DB actuelle sera remplacée par <strong>{confirmRestore?.filename}</strong> ({formatDateShort(confirmRestore?.createdAt ?? "")}).
            Un backup de sécurité de la DB actuelle sera créé automatiquement avant.
          </div>
        </div>
        <div className="field" style={{ marginTop: 16 }}>
          <label className="label">Tape <code>RESTORE</code> pour confirmer :</label>
          <input
            className="input"
            value={restoreInput}
            onChange={e => setRestoreInput(e.target.value)}
            placeholder="RESTORE"
            autoFocus
          />
        </div>
      </Modal>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  TAB 3 — ACCOUNTS
// ════════════════════════════════════════════════════════════════════════

interface AccountInfo {
  email:                  string;
  name:                   string;
  role:                   string;
  passwordMasked:         string;
  anthropicKeyMasked:     string;
  anthropicKeyConfigured: boolean;
  createdAt:              string | null;
  lastLogin:              string | null;
  status:                 string;
}

function AccountsTab() {
  const { showToast } = useToast();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState<string | null>(null);

  const [showChangeModal, setShowChangeModal] = useState(false);
  const [showResetModal, setShowResetModal]   = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [resetConfirm, setResetConfirm] = useState("");
  const [revealConfirm, setRevealConfirm] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/account");
    const j = await r.json();
    setAccount(j.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-hide secrets after 10s
  useEffect(() => {
    if (!revealedKey) return;
    const t = setTimeout(() => setRevealedKey(null), 10000);
    return () => clearTimeout(t);
  }, [revealedKey]);
  useEffect(() => {
    if (!resetPassword) return;
    const t = setTimeout(() => setResetPassword(null), 10000);
    return () => clearTimeout(t);
  }, [resetPassword]);

  async function handleRevealKey() {
    if (revealConfirm !== "SHOW") return;
    const r = await fetch("/api/admin/reveal-secret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secretType: "anthropic_key", confirmation: "SHOW" }),
    });
    const j = await r.json();
    if (r.ok) {
      setRevealedKey(j.data.value);
      setShowRevealModal(false);
      setRevealConfirm("");
    } else {
      showToast(j.error ?? "Erreur");
    }
  }

  async function handleResetPassword() {
    if (resetConfirm !== "RESET") return;
    const r = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation: "RESET" }),
    });
    const j = await r.json();
    if (r.ok) {
      setResetPassword(j.data.newPassword);
      setShowResetModal(false);
      setResetConfirm("");
      showToast("Mot de passe réinitialisé. Mémorise-le maintenant ⚠️");
    } else {
      showToast(j.error ?? "Erreur");
    }
  }

  if (!account) return <div className="muted">Chargement…</div>;

  return (
    <>
      <div className="card card__pad-lg">
        <div className="section-title" style={{ marginBottom: 16 }}>Identifiants & comptes</div>

        <AccountRow label="Nom complet" value={account.name} />
        <AccountRow label="Email" value={account.email} />
        <AccountRow label="Rôle" value={
          <Badge tone={account.role === "admin" ? "primary" : "neutral"}>
            {account.role.toUpperCase()}
          </Badge>
        } />

        <div className="divider" />

        <AccountRow
          label="Mot de passe"
          value={
            resetPassword ? (
              <RevealedSecret value={resetPassword} onCopy={() => showToast("Copié ✓")} />
            ) : (
              <span style={{ fontFamily: "var(--f-mono)" }}>{account.passwordMasked}</span>
            )
          }
          actions={
            <div className="row gap-2">
              <button className="btn btn--sm" onClick={() => setShowChangeModal(true)}>
                <KeyRound size={12} /> Changer
              </button>
              <button
                className="btn btn--sm"
                style={{ color: "var(--danger)" }}
                onClick={() => setShowResetModal(true)}
              >
                <RefreshCw size={12} /> Reset
              </button>
            </div>
          }
        />

        <div className="divider" />

        <AccountRow
          label="Clé API Anthropic"
          value={
            revealedKey ? (
              <RevealedSecret value={revealedKey} onCopy={() => showToast("Copié ✓")} />
            ) : (
              <span style={{ fontFamily: "var(--f-mono)" }}>{account.anthropicKeyMasked}</span>
            )
          }
          actions={
            account.anthropicKeyConfigured ? (
              <button className="btn btn--sm" onClick={() => setShowRevealModal(true)}>
                {revealedKey ? <EyeOff size={12} /> : <Eye size={12} />}
                {revealedKey ? "Masquer" : "Afficher"}
              </button>
            ) : null
          }
        />

        <div className="divider" />

        <AccountRow label="Créé le" value={account.createdAt ? formatDate(account.createdAt) : "—"} />
        <AccountRow label="Dernière connexion" value={account.lastLogin ? formatDate(account.lastLogin) : "—"} />
        <AccountRow label="Statut" value={<Badge tone="success" dot>ACTIVE</Badge>} />
      </div>

      {/* Change password modal */}
      {showChangeModal && (
        <ChangePasswordModal onClose={() => setShowChangeModal(false)} onSuccess={() => { setShowChangeModal(false); load(); }} />
      )}

      {/* Reset password modal */}
      <Modal
        open={showResetModal}
        onClose={() => { setShowResetModal(false); setResetConfirm(""); }}
        title="⚠️ Réinitialiser le mot de passe"
        footer={
          <>
            <button className="btn" onClick={() => { setShowResetModal(false); setResetConfirm(""); }}>Annuler</button>
            <button
              className="btn btn--primary"
              onClick={handleResetPassword}
              disabled={resetConfirm !== "RESET"}
              style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
            >
              Confirmer
            </button>
          </>
        }
      >
        <div className="ai-card" style={{ background: "var(--warn-soft)", borderColor: "rgba(224,138,43,.25)" }}>
          <div className="ai-card__label" style={{ color: "#95571a" }}>Génération d'un nouveau mot de passe</div>
          <div className="ai-card__text" style={{ color: "#95571a" }}>
            Un mot de passe aléatoire de 16 caractères sera généré et affiché <strong>une seule fois pendant 10 secondes</strong>.
            Mémorise-le immédiatement.
          </div>
        </div>
        <div className="field" style={{ marginTop: 16 }}>
          <label className="label">Tape <code>RESET</code> pour confirmer :</label>
          <input
            className="input"
            value={resetConfirm}
            onChange={e => setResetConfirm(e.target.value)}
            placeholder="RESET"
            autoFocus
          />
        </div>
      </Modal>

      {/* Reveal API key modal */}
      <Modal
        open={showRevealModal}
        onClose={() => { setShowRevealModal(false); setRevealConfirm(""); }}
        title="Afficher la clé API"
        footer={
          <>
            <button className="btn" onClick={() => { setShowRevealModal(false); setRevealConfirm(""); }}>Annuler</button>
            <button className="btn btn--primary" onClick={handleRevealKey} disabled={revealConfirm !== "SHOW"}>
              Afficher
            </button>
          </>
        }
      >
        <div className="ai-card">
          <div className="ai-card__label">Confidentialité</div>
          <div className="ai-card__text">
            La clé sera affichée pendant <strong>10 secondes</strong> puis re-masquée automatiquement.
            Cette action est enregistrée dans les logs d'audit.
          </div>
        </div>
        <div className="field" style={{ marginTop: 16 }}>
          <label className="label">Tape <code>SHOW</code> pour confirmer :</label>
          <input
            className="input"
            value={revealConfirm}
            onChange={e => setRevealConfirm(e.target.value)}
            placeholder="SHOW"
            autoFocus
          />
        </div>
      </Modal>
    </>
  );
}

function AccountRow({ label, value, actions }: { label: string; value: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "160px 1fr auto",
      gap: 16,
      alignItems: "center",
      padding: "12px 0",
    }}>
      <div className="muted" style={{ fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 13.5 }}>{value}</div>
      <div>{actions}</div>
    </div>
  );
}

function RevealedSecret({ value, onCopy }: { value: string; onCopy: () => void }) {
  return (
    <div className="row gap-2" style={{ alignItems: "center" }}>
      <span style={{
        fontFamily: "var(--f-mono)",
        background: "var(--warn-soft)",
        color: "#95571a",
        padding: "4px 8px",
        borderRadius: "var(--r-sm)",
        fontSize: 13,
      }}>{value}</span>
      <button
        className="btn btn--sm"
        onClick={() => { navigator.clipboard.writeText(value); onCopy(); }}
        title="Copier"
      >
        <Copy size={11} />
      </button>
      <span className="muted tiny">⏱ 10s</span>
    </div>
  );
}

function ChangePasswordModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { showToast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [working, setWorking] = useState(false);

  async function handle() {
    if (next.length < 8) { showToast("Nouveau mdp ≥ 8 caractères"); return; }
    if (next !== confirm) { showToast("Les mots de passe ne correspondent pas"); return; }
    setWorking(true);
    const r = await fetch("/api/admin/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const j = await r.json();
    setWorking(false);
    if (r.ok) {
      showToast("Mot de passe modifié ✓");
      onSuccess();
    } else {
      showToast(j.error ?? "Erreur");
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Changer le mot de passe"
      footer={
        <>
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn btn--primary" onClick={handle} disabled={working}>
            {working ? "…" : "Changer"}
          </button>
        </>
      }
    >
      <div className="field">
        <label className="label">Mot de passe actuel</label>
        <input className="input" type="password" value={current} onChange={e => setCurrent(e.target.value)} autoFocus />
      </div>
      <div className="field">
        <label className="label">Nouveau mot de passe</label>
        <input className="input" type="password" value={next} onChange={e => setNext(e.target.value)} minLength={8} />
      </div>
      <div className="field">
        <label className="label">Confirmer</label>
        <input className="input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  TAB 4 — LOGS
// ════════════════════════════════════════════════════════════════════════

interface LogEntry {
  id:          string;
  action:      string;
  description: string | null;
  ipAddress:   string | null;
  metadata:    Record<string, unknown> | null;
  createdAt:   string;
  userName:    string | null;
  userEmail:   string | null;
}

const ACTION_LABELS: Record<string, { label: string; tone: "primary" | "success" | "warn" | "danger" | "info" }> = {
  backup_created:   { label: "Backup créé",            tone: "success" },
  backup_restored:  { label: "Restauration",            tone: "warn" },
  password_changed: { label: "Mdp modifié",             tone: "info" },
  password_reset:   { label: "Mdp reset",               tone: "warn" },
  secret_revealed:  { label: "Secret révélé",           tone: "warn" },
  logs_cleanup:     { label: "Nettoyage logs",          tone: "info" },
};

function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const url = filter ? `/api/admin/logs?action=${encodeURIComponent(filter)}` : "/api/admin/logs";
    const r = await fetch(url);
    const j = await r.json();
    setLogs(j.data.logs ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const uniqueActions = Array.from(new Set(Object.keys(ACTION_LABELS)));

  return (
    <div className="card card__pad-lg">
      <div className="row between" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ margin: 0 }}>Audit trail ({logs.length})</div>
        <div className="row gap-2">
          <select className="input" style={{ width: 220 }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">Toutes les actions</option>
            {uniqueActions.map(a => <option key={a} value={a}>{ACTION_LABELS[a]?.label ?? a}</option>)}
          </select>
          <button className="btn btn--sm" onClick={load}>
            <RefreshCw size={12} /> Rafraîchir
          </button>
        </div>
      </div>

      {loading ? (
        <div className="muted">Chargement…</div>
      ) : logs.length === 0 ? (
        <div className="muted">Aucun log pour ce filtre</div>
      ) : (
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={{ textAlign: "left", padding: "8px 4px", color: "var(--ink-3)", fontWeight: 600 }}>Date</th>
              <th style={{ textAlign: "left", padding: "8px 4px", color: "var(--ink-3)", fontWeight: 600 }}>Action</th>
              <th style={{ textAlign: "left", padding: "8px 4px", color: "var(--ink-3)", fontWeight: 600 }}>Description</th>
              <th style={{ textAlign: "left", padding: "8px 4px", color: "var(--ink-3)", fontWeight: 600 }}>Utilisateur</th>
              <th style={{ textAlign: "left", padding: "8px 4px", color: "var(--ink-3)", fontWeight: 600 }}>IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => {
              const cfg = ACTION_LABELS[l.action];
              return (
                <tr key={l.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 4px", whiteSpace: "nowrap" }}>{formatDateShort(l.createdAt)}</td>
                  <td style={{ padding: "8px 4px" }}>
                    <Badge tone={cfg?.tone ?? "neutral"} dot>{cfg?.label ?? l.action}</Badge>
                  </td>
                  <td style={{ padding: "8px 4px" }} className="muted">{l.description ?? "—"}</td>
                  <td style={{ padding: "8px 4px", fontSize: 12 }}>{l.userName ?? l.userEmail ?? "—"}</td>
                  <td style={{ padding: "8px 4px", fontFamily: "var(--f-mono)", fontSize: 11 }} className="muted">{l.ipAddress ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
