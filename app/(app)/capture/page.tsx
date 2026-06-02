"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Briefcase, UserPlus, Check, Copy, MousePointerClick } from "lucide-react";
import { useToast } from "@/lib/store";

// ─── Bookmarklet builders ─────────────────────────────────────────────────────
// The bookmarklet runs IN the job page, scrapes the offer (JSON-LD first, then
// LinkedIn/Indeed selectors, then document.title), and opens the SaaS prefilled
// form. `origin` is injected from window.location.origin → points to the user's
// own server automatically.

function buildJobBookmarklet(origin: string): string {
  const code = `(function(){try{
var O=${JSON.stringify(origin)};
function t(s){var e=document.querySelector(s);return e?e.textContent.trim().replace(/\\s+/g," "):"";}
var title="",company="",url=location.href,h=location.hostname;
var S=document.querySelectorAll('script[type="application/ld+json"]');
for(var i=0;i<S.length;i++){try{var d=JSON.parse(S[i].textContent);var a=Array.isArray(d)?d:(d["@graph"]||[d]);for(var j=0;j<a.length;j++){var o=a[j];if(!o)continue;var ty=o["@type"];if(ty==="JobPosting"||(Array.isArray(ty)&&ty.indexOf("JobPosting")>-1)){title=o.title||title;var ho=o.hiringOrganization;if(ho)company=(typeof ho==="string"?ho:ho.name)||company;}}}catch(e){}}
if(!title){if(h.indexOf("linkedin")>-1)title=t(".job-details-jobs-unified-top-card__job-title")||t(".top-card-layout__title")||t("h1");else if(h.indexOf("indeed")>-1)title=t("h1.jobsearch-JobInfoHeader-title")||t('[data-testid="jobsearch-JobInfoHeader-title"]')||t("h1");else title=t("h1");}
if(!company){if(h.indexOf("linkedin")>-1)company=t(".job-details-jobs-unified-top-card__company-name a")||t(".job-details-jobs-unified-top-card__company-name")||t(".topcard__org-name-link");else if(h.indexOf("indeed")>-1)company=t('[data-testid="inlineHeader-companyName"]')||t('[data-company-name="true"]')||t(".jobsearch-CompanyInfoContainer a");}
if(!title)title=(document.title||"").replace(/\\s*[|\\-\\u2013].*$/,"").trim();
var via=h.indexOf("linkedin")>-1?"linkedin":"direct";
var q="?new=1&via="+via+"&url="+encodeURIComponent(url)+"&title="+encodeURIComponent(title)+"&company="+encodeURIComponent(company);
window.open(O+"/applications"+q,"_blank");
}catch(e){window.open(${JSON.stringify(origin)}+"/applications?new=1","_blank");}})();`;
  return "javascript:" + encodeURIComponent(code);
}

function buildContactBookmarklet(origin: string): string {
  const code = `(function(){try{
var O=${JSON.stringify(origin)};
function t(s){var e=document.querySelector(s);return e?e.textContent.trim().replace(/\\s+/g," "):"";}
var name=t("h1")||"";var p=name.split(" ");var first=p.shift()||"";var last=p.join(" ");
var hl=t(".text-body-medium.break-words")||t(".text-body-medium")||"";
var role=hl,company="";var m=hl.split(/\\s+(?:at|chez|@|\\|)\\s+/i);if(m.length>1){role=m[0].trim();company=m[1].trim();}
var url=location.href.split("?")[0];
var q="?new=1&firstName="+encodeURIComponent(first)+"&lastName="+encodeURIComponent(last)+"&role="+encodeURIComponent(role)+"&company="+encodeURIComponent(company)+"&linkedin="+encodeURIComponent(url);
window.open(O+"/contacts"+q,"_blank");
}catch(e){window.open(${JSON.stringify(origin)}+"/contacts?new=1","_blank");}})();`;
  return "javascript:" + encodeURIComponent(code);
}

// ─── Draggable bookmarklet button (href set via ref to bypass React's javascript: sanitization) ──

function BookmarkletLink({ href, label, icon: Icon, color }: {
  href: string; label: string; icon: React.ElementType; color: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.setAttribute("href", href);
  }, [href]);
  return (
    <a
      ref={ref}
      draggable
      onClick={e => e.preventDefault()}
      className="capture-bm"
      style={{ borderColor: color }}
      title="Glisse-moi dans ta barre de favoris"
    >
      <span className="capture-bm__icon" style={{ background: color }}>
        <Icon size={16} strokeWidth={2} color="#fff" />
      </span>
      {label}
    </a>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CapturePage() {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => { setOrigin(window.location.origin); }, []);

  const jobBm     = origin ? buildJobBookmarklet(origin) : "";
  const contactBm = origin ? buildContactBookmarklet(origin) : "";

  async function copy(code: string, which: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(which);
      showToast("Code copié ✓");
      setTimeout(() => setCopied(null), 2000);
    } catch { showToast("Impossible de copier", "error"); }
  }

  return (
    <div className="main__inner">
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Capture rapide</h1>
          <p className="page-head__sub">Ajoute une offre ou un contact en un clic depuis n&apos;importe quel site</p>
        </div>
      </div>

      {/* How it works */}
      <div className="card card__pad-lg" style={{ marginBottom: 20 }}>
        <div className="row gap-2" style={{ marginBottom: 12 }}>
          <Sparkles size={16} color="var(--primary)" />
          <span style={{ fontWeight: 700, fontSize: 14 }}>Comment ça marche</span>
        </div>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.9 }}>
          <li><strong>Affiche ta barre de favoris</strong> (Chrome/Edge : <kbd>Ctrl/⌘ + Shift + B</kbd>).</li>
          <li><strong>Glisse</strong> un des deux boutons ci-dessous dans ta barre de favoris.</li>
          <li>Sur une <strong>offre LinkedIn/Indeed</strong> (ou un profil), clique le favori → le formulaire s&apos;ouvre <strong>pré-rempli</strong> → tu cliques Enregistrer 🎉.</li>
        </ol>
        <div className="row gap-2" style={{ marginTop: 12, fontSize: 12, color: "var(--muted)" }}>
          <MousePointerClick size={13} /> 100% gratuit, aucune installation, aucune donnée envoyée à un tiers — le favori ouvre directement ton appli.
        </div>
      </div>

      {/* Bookmarklets */}
      <div className="form-grid" style={{ marginBottom: 20 }}>
        {/* Job */}
        <div className="card card__pad-lg">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Clipper une offre</div>
          <div className="muted tiny" style={{ marginBottom: 14 }}>Titre, société et lien capturés automatiquement → nouvelle candidature.</div>
          {jobBm && <BookmarkletLink href={jobBm} label="📋 Clip → Candidature" icon={Briefcase} color="var(--primary)" />}
          <button className="btn btn--sm" style={{ marginTop: 10 }} onClick={() => copy(jobBm, "job")} disabled={!jobBm}>
            {copied === "job" ? <><Check size={12} /> Copié</> : <><Copy size={12} /> Copier le code</>}
          </button>
        </div>

        {/* Contact */}
        <div className="card card__pad-lg">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Clipper un contact</div>
          <div className="muted tiny" style={{ marginBottom: 14 }}>Sur un profil LinkedIn : nom, rôle, société et URL → nouveau contact.</div>
          {contactBm && <BookmarkletLink href={contactBm} label="👤 Clip → Contact" icon={UserPlus} color="var(--success)" />}
          <button className="btn btn--sm" style={{ marginTop: 10 }} onClick={() => copy(contactBm, "contact")} disabled={!contactBm}>
            {copied === "contact" ? <><Check size={12} /> Copié</> : <><Copy size={12} /> Copier le code</>}
          </button>
        </div>
      </div>

      {/* Test link */}
      <div className="card card__pad-lg">
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Tester sans aller sur LinkedIn</div>
        <div className="muted tiny" style={{ marginBottom: 12 }}>Ouvre un formulaire pré-rempli d&apos;exemple pour voir le flux.</div>
        <a
          className="btn btn--primary"
          style={{ textDecoration: "none" }}
          href="/applications?new=1&title=Ing%C3%A9nieur%20Backend&company=Airbus&via=linkedin&url=https%3A%2F%2Fexample.com%2Fjob"
        >
          Tester avec un exemple
        </a>
      </div>
    </div>
  );
}
