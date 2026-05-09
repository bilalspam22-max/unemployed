"use client";

import { useEffect, useState } from "react";
import { Bell, TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Donut } from "@/components/ui/donut";
import { TempDot } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { relativeDate, formatDateShort } from "@/lib/utils";
import type { Contact } from "@/lib/types";
import { useSession } from "@/lib/auth-client";

interface DashboardData {
  applicationsTotal: number;
  applicationsDelta: number;
  followupsThisMonth: number;
  followupsDelta: number;
  interviewsPlanned: number;
  responseRate: number;
  responseRateDelta: number;
  applicationsBySector: Array<{ sectorName: string; count: number; color: string }>;
  hotContacts: Contact[];
  todayFollowups: Array<{ id: string; contactId: string | null; scheduledDate: string }>;
}

function CalendarMini() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
  const adjustedFirst = (firstDay + 6) % 7; // Monday-first

  const cells: (number | null)[] = [...Array(adjustedFirst).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const MONTH_NAMES = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
        {MONTH_NAMES[month]} {year}
      </div>
      <div className="cal">
        {DAY_LABELS.map(d => (
          <div key={d} className="cal__head">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={`cal__cell${!day ? " cal__cell--out" : ""}${day === today ? " cal__cell--today" : ""}`}
          >
            {day && <span className="cal__day">{day}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const name = session?.user?.name?.split(" ")[0] ?? "Bilal";
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="main__inner">
      {/* Header */}
      <div className="page-head">
        <div>
          <p className="page-head__sub" style={{ margin: "0 0 2px 0" }}>{today}</p>
          <h1 className="page-head__title">Bonjour, {name} 👋</h1>
        </div>
        <button className="btn">
          <Bell size={14} /> Rappels
        </button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KpiCard
          label="Candidatures envoyées"
          value={loading ? "—" : data?.applicationsTotal ?? 0}
          delta={data?.applicationsDelta}
          sparkData={[3, 5, 4, 8, 6, 10, data?.applicationsTotal ?? 0]}
          sparkColor="var(--primary)"
        />
        <KpiCard
          label="Relances ce mois"
          value={loading ? "—" : data?.followupsThisMonth ?? 0}
          delta={data?.followupsDelta}
          sparkData={[1, 3, 2, 4, 3, 6, data?.followupsThisMonth ?? 0]}
          sparkColor="var(--success)"
        />
        <KpiCard
          label="Entretiens prévus"
          value={loading ? "—" : data?.interviewsPlanned ?? 0}
          sparkData={[0, 1, 1, 2, 1, 3, data?.interviewsPlanned ?? 0]}
          sparkColor="var(--warn)"
        />
        <KpiCard
          label="Taux de réponse"
          value={loading ? "—" : data?.responseRate ?? 0}
          unit="%"
          delta={data?.responseRateDelta}
          sparkData={[0, 5, 8, 10, 12, 15, data?.responseRate ?? 0]}
          sparkColor="var(--plum)"
        />
      </div>

      {/* Mid row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Donut */}
        <div className="card card__pad-lg">
          <div className="section-title" style={{ marginBottom: 16 }}>Candidatures par secteur</div>
          {data?.applicationsBySector?.length ? (
            <Donut data={data.applicationsBySector.map(s => ({ name: s.sectorName, value: s.count, color: s.color }))} />
          ) : (
            <div className="muted" style={{ fontSize: 13, textAlign: "center", padding: "20px 0" }}>
              Aucune candidature pour l'instant
            </div>
          )}
        </div>

        {/* Actions du jour */}
        <div className="card card__pad-lg">
          <div className="section-title" style={{ marginBottom: 12 }}>À faire aujourd'hui</div>
          {data?.todayFollowups?.length ? (
            <div className="col gap-3">
              {data.todayFollowups.map(f => (
                <div key={f.id} className="row gap-3 between" style={{ padding: "10px 12px", background: "var(--warn-soft)", borderRadius: "var(--r-md)" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Relance prévue</div>
                    <div className="muted tiny">{formatDateShort(f.scheduledDate)}</div>
                  </div>
                  <button className="btn btn--sm">Voir</button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "24px 0", textAlign: "center" }}>
              <TrendingUp size={28} strokeWidth={1.5} color="var(--success)" style={{ margin: "0 auto 8px" }} />
              <div className="muted" style={{ fontSize: 13 }}>Tout est à jour !</div>
            </div>
          )}
        </div>

        {/* Contacts chauds */}
        <div className="card card__pad-lg">
          <div className="section-title" style={{ marginBottom: 12 }}>Contacts chauds</div>
          {data?.hotContacts?.length ? (
            <div className="col gap-2">
              {data.hotContacts.map(c => (
                <div key={c.id} className="row gap-3 between" style={{ padding: "8px 0" }}>
                  <Avatar firstName={c.firstName} lastName={c.lastName} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.firstName} {c.lastName}
                    </div>
                    <div className="muted tiny">{c.role ?? "—"}</div>
                  </div>
                  <TempDot temp={c.temperature} />
                </div>
              ))}
            </div>
          ) : (
            <div className="muted" style={{ fontSize: 13, textAlign: "center", padding: "20px 0" }}>
              Pas encore de contacts chauds
            </div>
          )}
        </div>
      </div>

      {/* Calendrier */}
      <div className="card card__pad-lg" style={{ maxWidth: 560 }}>
        <CalendarMini />
      </div>
    </div>
  );
}
