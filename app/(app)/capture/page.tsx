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
function q(s,r){try{return (r||document).querySelector(s);}catch(_){return null;}}
function txt(e){return e?(e.textContent||"").trim().replace(/\\s+/g," "):"";}
function meta(n){var e=q('meta[property="'+n+'"]')||q('meta[name="'+n+'"]');return e?(e.getAttribute("content")||"").trim():"";}
var title="",company="",url=location.href,h=location.hostname;
var sel=(window.getSelection?(window.getSelection()+""):"").replace(/\\r/g,"").trim();
if(sel){var L=sel.split("\\n").map(function(x){return x.trim();}).filter(Boolean);title=L[0]||"";if(L.length>1)company=L[1]||"";}
if(!title){var S=document.querySelectorAll('script[type="application/ld+json"]');
for(var i=0;i<S.length;i++){try{var d=JSON.parse(S[i].textContent);var a=Array.isArray(d)?d:(d["@graph"]||[d]);for(var j=0;j<a.length;j++){var o=a[j];if(!o)continue;var ty=o["@type"];if(ty==="JobPosting"||(Array.isArray(ty)&&ty.indexOf("JobPosting")>-1)){title=o.title||title;var ho=o.hiringOrganization;if(ho&&!company)company=(typeof ho==="string"?ho:ho.name)||"";}}}catch(e){}}}
if(h.indexOf("linkedin")>-1){
  var pane=q(".jobs-search__job-details")||q(".scaffold-layout__detail")||q(".jobs-semantic-search__job-details")||q(".job-view-layout");
  if(!title)title=txt(q(".job-details-jobs-unified-top-card__job-title",pane||document))||txt(q(".jobs-unified-top-card__job-title",pane||document));
  if(!title&&pane)title=txt(q("h1",pane))||txt(q("h2",pane));
  if(!company)company=txt(q(".job-details-jobs-unified-top-card__company-name a",pane||document))||txt(q(".job-details-jobs-unified-top-card__company-name",pane||document))||txt(q('a[href*="/company/"]',pane||document));
}else if(h.indexOf("indeed")>-1){
  if(!title)title=txt(q("h1.jobsearch-JobInfoHeader-title"))||txt(q('[data-testid="jobsearch-JobInfoHeader-title"]'))||txt(q("h1"));
  if(!company)company=txt(q('[data-testid="inlineHeader-companyName"]'))||txt(q('[data-company-name="true"]'))||txt(q(".jobsearch-CompanyInfoContainer a"));
}
var og=meta("og:title");
if(og&&(!title||!company)){var mm=og.match(/^(.+?)\\s+hiring\\s+(.+?)(?:\\s+in\\s+.+?)?\\s*\\|/i);if(mm){if(!company)company=mm[1].trim();if(!title)title=mm[2].trim();}else if(!title){title=og.replace(/\\s*\\|\\s*LinkedIn.*$/i,"").trim();}}
if(!title)title=(document.title||"").replace(/^\\(\\d+\\+?\\)\\s*/,"").replace(/\\s*\\|.*$/,"").trim();
if(company)company=company.replace(/\\s*[·|].*$/,"").trim();
var dt=new Date();var today=dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");
var via=h.indexOf("linkedin")>-1?"linkedin":"direct";
var qs="?new=1&via="+via+"&sent="+today+"&url="+encodeURIComponent(url)+"&title="+encodeURIComponent(title)+"&company="+encodeURIComponent(company);
window.open(O+"/applications"+qs,"_blank");
}catch(e){window.open(${JSON.stringify(origin)}+"/applications?new=1","_blank");}})();`;
  return "javascript:" + encodeURIComponent(code);
}

function buildContactBookmarklet(origin: string): string {
  const code = `(function(){try{
var O=${JSON.stringify(origin)};
function q(s,r){try{return (r||document).querySelector(s);}catch(_){return null;}}
function txt(e){return e?(e.textContent||"").trim().replace(/\\s+/g," "):"";}
function meta(n){var e=q('meta[property="'+n+'"]')||q('meta[name="'+n+'"]');return e?(e.getAttribute("content")||"").trim():"";}
function stripLi(s){return (s||"").replace(/^\\(\\d+\\+?\\)\\s*/,"").replace(/\\s*[|\\u00b7]\\s*LinkedIn.*$/i,"").replace(/\\s*\\|\\s*LinkedIn.*$/i,"").trim();}
var name="",headline="";
var sel=(window.getSelection?(window.getSelection()+""):"").replace(/\\r/g,"").trim();
if(sel){var L=sel.split("\\n").map(function(x){return x.trim();}).filter(Boolean);name=L[0]||"";if(L.length>1)headline=L[1]||"";}
if(!name){var og=stripLi(meta("og:title"));
if(og){var parts=og.split(/\\s[-\\u2013\\u2014]\\s/);name=parts[0].trim();if(parts.length>1&&!headline)headline=parts.slice(1).join(" - ").trim();}}
if(!name||/^linkedin$/i.test(name))name=txt(q("h1"));
if(!name||/^linkedin$/i.test(name)){var ct=stripLi(document.title);var cp=ct.split(/\\s[-\\u2013\\u2014]\\s/);name=cp[0].trim();if(!headline&&cp.length>1)headline=cp.slice(1).join(" - ").trim();}
if(!headline)headline=txt(q(".text-body-medium.break-words"))||txt(q(".text-body-medium"));
headline=headline.replace(/\\s*\\|\\s*LinkedIn.*$/i,"").trim();
var role=headline,company="";
var m=headline.split(/\\s+(?:chez|at|@|\\u00b7|\\|)\\s+/i);
if(m.length>1){role=m[0].trim();company=m.slice(1).join(" ").trim();}
if(!company){var cl=q('a[href*="/company/"]');if(cl)company=txt(cl).replace(/\\s*[·|].*$/,"").trim();}
var p=name.split(" ").filter(Boolean);var first=p.shift()||"";var last=p.join(" ");
var url=location.href.split("?")[0];
var qs="?new=1&firstName="+encodeURIComponent(first)+"&lastName="+encodeURIComponent(last)+"&role="+encodeURIComponent(role)+"&company="+encodeURIComponent(company)+"&linkedin="+encodeURIComponent(url);
window.open(O+"/contacts"+qs,"_blank");
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
          <li>Sur l&apos;offre (ou le profil), <strong>surligne avec ta souris</strong> le texte à capturer, puis clique le favori.</li>
          <li>Le formulaire s&apos;ouvre <strong>pré-rempli</strong> → tu cliques Enregistrer 🎉.</li>
        </ol>

        <div style={{ marginTop: 14, padding: "12px 14px", background: "var(--primary-soft)", borderRadius: "var(--r-md)", fontSize: 12.5, color: "var(--primary-ink)" }}>
          <strong>💡 Astuce sélection (le plus fiable) :</strong>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18, lineHeight: 1.7 }}>
            <li><strong>Candidature</strong> : surligne le <strong>titre du poste</strong> (et, si tu veux, mets la <strong>société sur la 2ᵉ ligne</strong> de ta sélection).</li>
            <li><strong>Contact</strong> : surligne le <strong>nom de la personne</strong> (et son <strong>poste/société</strong> sur la 2ᵉ ligne si tu veux).</li>
          </ul>
          La sélection est lue en priorité → ça marche à coup sûr, même sur LinkedIn. Sans sélection, l&apos;appli essaie quand même de deviner automatiquement.
        </div>

        <div className="row gap-2" style={{ marginTop: 12, fontSize: 12, color: "var(--muted)" }}>
          <MousePointerClick size={13} /> 100% gratuit, aucune installation, aucune donnée envoyée à un tiers — le favori ouvre directement ton appli.
        </div>
        <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--warn-soft)", borderRadius: "var(--r-md)", fontSize: 12.5, color: "#95571a" }}>
          <strong>Tu avais déjà ajouté un favori ?</strong> Le code a changé (v3 — capture par sélection).
          Supprime tes anciens favoris et glisse à nouveau les boutons ci-dessous, sinon tu utilises l&apos;ancien code.
        </div>
      </div>

      {/* Bookmarklets */}
      <div className="form-grid" style={{ marginBottom: 20 }}>
        {/* Job */}
        <div className="card card__pad-lg">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Clipper une offre</div>
          <div className="muted tiny" style={{ marginBottom: 14 }}>Surligne le titre du poste → nouvelle candidature pré-remplie (lien + date du jour inclus).</div>
          {jobBm && <BookmarkletLink href={jobBm} label="📋 Clip → Candidature" icon={Briefcase} color="var(--primary)" />}
          <button className="btn btn--sm" style={{ marginTop: 10 }} onClick={() => copy(jobBm, "job")} disabled={!jobBm}>
            {copied === "job" ? <><Check size={12} /> Copié</> : <><Copy size={12} /> Copier le code</>}
          </button>
        </div>

        {/* Contact */}
        <div className="card card__pad-lg">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Clipper un contact</div>
          <div className="muted tiny" style={{ marginBottom: 14 }}>Surligne le nom (et son poste sur la 2ᵉ ligne) → nouveau contact pré-rempli avec l&apos;URL du profil.</div>
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
