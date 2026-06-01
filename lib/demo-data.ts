// ─── Demo Data — Realistic job search data for showcasing the app ────────────
// This data represents ~3 months of activity from a fictional software engineer

import type { Company, Contact, Application, Meeting, QuestionItem } from "./types";

// ─── Sectors ────────────────────────────────────────────────────────────────

export const DEMO_SECTORS = [
  { id: "s1", userId: "demo", name: "Tech / SaaS", color: "#3D5BE3", priority: 1, createdAt: new Date("2026-03-01"), updatedAt: new Date("2026-03-01") },
  { id: "s2", userId: "demo", name: "Finance / Fintech", color: "#2A9D6E", priority: 2, createdAt: new Date("2026-03-01"), updatedAt: new Date("2026-03-01") },
  { id: "s3", userId: "demo", name: "Santé / Biotech", color: "#E08A2B", priority: 3, createdAt: new Date("2026-03-05"), updatedAt: new Date("2026-03-05") },
  { id: "s4", userId: "demo", name: "Énergie / Industrie", color: "#8B5CB8", priority: 2, createdAt: new Date("2026-03-10"), updatedAt: new Date("2026-03-10") },
];

// ─── Companies ──────────────────────────────────────────────────────────────

export const DEMO_COMPANIES: Company[] = [
  {
    id: "co1", userId: "demo", sectorId: "s1", name: "Datadog", location: "Paris, France",
    website: "https://datadoghq.com", hasRdOffice: true, technologies: ["Go", "Python", "React", "Kubernetes"],
    status: "interview", priorityScore: 5, notes: "Stack technique impressionnante, culture engineering-first.",
    createdAt: new Date("2026-03-05"), updatedAt: new Date("2026-05-20"),
  },
  {
    id: "co2", userId: "demo", sectorId: "s1", name: "Doctolib", location: "Paris, France",
    website: "https://doctolib.fr", hasRdOffice: true, technologies: ["Ruby on Rails", "React", "PostgreSQL"],
    status: "contacted", priorityScore: 4, notes: "Leader e-santé en Europe. Besoin de senior devs.",
    createdAt: new Date("2026-03-08"), updatedAt: new Date("2026-05-15"),
  },
  {
    id: "co3", userId: "demo", sectorId: "s2", name: "Qonto", location: "Paris, France",
    website: "https://qonto.com", hasRdOffice: true, technologies: ["Go", "React", "TypeScript", "AWS"],
    status: "hot_opportunity", priorityScore: 5, notes: "Licorne fintech, forte croissance. Équipe Engineering top.",
    createdAt: new Date("2026-03-10"), updatedAt: new Date("2026-05-25"),
  },
  {
    id: "co4", userId: "demo", sectorId: "s4", name: "TotalEnergies Digital Factory", location: "Paris La Défense",
    website: "https://totalenergies.com", hasRdOffice: true, technologies: ["Python", "Azure", "Terraform", "React"],
    status: "followed_up", priorityScore: 3, notes: "Équipe innovation. Projets IA et data.",
    createdAt: new Date("2026-03-12"), updatedAt: new Date("2026-05-10"),
  },
  {
    id: "co5", userId: "demo", sectorId: "s1", name: "Mistral AI", location: "Paris, France",
    website: "https://mistral.ai", hasRdOffice: true, technologies: ["Python", "PyTorch", "CUDA", "C++"],
    status: "interview", priorityScore: 5, notes: "Startup IA de pointe. Processus de recrutement exigeant.",
    createdAt: new Date("2026-03-15"), updatedAt: new Date("2026-05-28"),
  },
  {
    id: "co6", userId: "demo", sectorId: "s2", name: "BNP Paribas CIB", location: "Paris, France",
    website: "https://cib.bnpparibas.com", hasRdOffice: false, technologies: ["Java", "Spring", "Angular", "Oracle"],
    status: "rejected", priorityScore: 2, notes: "Refusé — pas assez d'expérience Java enterprise.",
    createdAt: new Date("2026-03-18"), updatedAt: new Date("2026-04-20"),
  },
  {
    id: "co7", userId: "demo", sectorId: "s3", name: "Owkin", location: "Paris / New York",
    website: "https://owkin.com", hasRdOffice: true, technologies: ["Python", "PyTorch", "FastAPI", "GCP"],
    status: "contacted", priorityScore: 4, notes: "ML + santé. Ambiance startup internationale.",
    createdAt: new Date("2026-03-22"), updatedAt: new Date("2026-05-05"),
  },
  {
    id: "co8", userId: "demo", sectorId: "s1", name: "Algolia", location: "Paris, France",
    website: "https://algolia.com", hasRdOffice: true, technologies: ["Go", "C++", "React", "TypeScript"],
    status: "to_contact", priorityScore: 4, notes: "Moteur de recherche en SaaS. Bonne réputation technique.",
    createdAt: new Date("2026-04-01"), updatedAt: new Date("2026-04-01"),
  },
  {
    id: "co9", userId: "demo", sectorId: "s1", name: "Stripe", location: "Dublin / Remote",
    website: "https://stripe.com", hasRdOffice: false, technologies: ["Ruby", "Go", "React", "Scala"],
    status: "contacted", priorityScore: 5, notes: "Top-tier. Process long mais excellent.",
    createdAt: new Date("2026-04-05"), updatedAt: new Date("2026-05-18"),
  },
  {
    id: "co10", userId: "demo", sectorId: "s4", name: "Schneider Electric", location: "Grenoble / Paris",
    website: "https://se.com", hasRdOffice: true, technologies: ["Python", "Azure", "IoT", "React"],
    status: "followed_up", priorityScore: 3, notes: "Division digital, projets IoT industriels.",
    createdAt: new Date("2026-04-10"), updatedAt: new Date("2026-05-12"),
  },
  {
    id: "co11", userId: "demo", sectorId: "s1", name: "Vercel", location: "Remote (SF)",
    website: "https://vercel.com", hasRdOffice: false, technologies: ["TypeScript", "Next.js", "React", "Go"],
    status: "to_contact", priorityScore: 4, notes: "Full remote. Créateurs de Next.js.",
    createdAt: new Date("2026-04-15"), updatedAt: new Date("2026-04-15"),
  },
  {
    id: "co12", userId: "demo", sectorId: "s3", name: "Doctolib (R&D Labo)", location: "Berlin",
    website: "https://doctolib.de", hasRdOffice: true, technologies: ["Python", "Go", "React", "K8s"],
    status: "to_contact", priorityScore: 3, notes: "Branche R&D. Possible relocation Berlin.",
    createdAt: new Date("2026-04-20"), updatedAt: new Date("2026-04-20"),
  },
];

// ─── Contacts ───────────────────────────────────────────────────────────────

export const DEMO_CONTACTS: Contact[] = [
  {
    id: "ct1", userId: "demo", companyId: "co1", firstName: "Sophie", lastName: "Martin",
    role: "Talent Acquisition Manager", email: "sophie.m@datadog.com", linkedinUrl: "https://linkedin.com/in/sophie-martin",
    contactType: "recruiter", temperature: "hot", lastExchangeDate: "2026-05-20",
    lastExchangeSummary: "3e entretien prévu le 02/06. Sophie m'a dit que le feedback de l'équipe était très positif.",
    nextFollowupDate: "2026-06-02", signalDetected: "Process avancé, feedback positif",
    humanNotes: "Très réactive, répond dans la journée.", trustLevel: 5,
    createdAt: new Date("2026-03-05"), updatedAt: new Date("2026-05-20"),
  },
  {
    id: "ct2", userId: "demo", companyId: "co1", firstName: "Alexandre", lastName: "Chen",
    role: "Engineering Manager — Infra", email: null, linkedinUrl: "https://linkedin.com/in/alex-chen-dd",
    contactType: "engineer", temperature: "warm", lastExchangeDate: "2026-05-15",
    lastExchangeSummary: "Entretien technique passé. Questions sur le design system et scaling Go microservices.",
    nextFollowupDate: null, signalDetected: null,
    humanNotes: "Posé et technique. Questions pertinentes.", trustLevel: 4,
    createdAt: new Date("2026-04-10"), updatedAt: new Date("2026-05-15"),
  },
  {
    id: "ct3", userId: "demo", companyId: "co3", firstName: "Léa", lastName: "Dupont",
    role: "Head of Engineering", email: "lea.dupont@qonto.com", linkedinUrl: "https://linkedin.com/in/lea-dupont",
    contactType: "engineer", temperature: "hot", lastExchangeDate: "2026-05-25",
    lastExchangeSummary: "Excellent échange sur la vision produit. Très intéressée par mon expérience en scaling.",
    nextFollowupDate: "2026-06-05", signalDetected: "Poste urgent, équipe en croissance",
    humanNotes: "A mentionné que le poste est prioritaire. Envoi d'un case study demandé.", trustLevel: 5,
    createdAt: new Date("2026-03-10"), updatedAt: new Date("2026-05-25"),
  },
  {
    id: "ct4", userId: "demo", companyId: "co2", firstName: "Thomas", lastName: "Bernard",
    role: "Tech Recruiter", email: "thomas.b@doctolib.fr", linkedinUrl: null,
    contactType: "recruiter", temperature: "warm", lastExchangeDate: "2026-05-12",
    lastExchangeSummary: "Première prise de contact. A partagé la fiche de poste Senior Backend.",
    nextFollowupDate: "2026-06-01", signalDetected: null,
    humanNotes: "Sympathique. Processus standard Doctolib.", trustLevel: 3,
    createdAt: new Date("2026-03-08"), updatedAt: new Date("2026-05-12"),
  },
  {
    id: "ct5", userId: "demo", companyId: "co5", firstName: "Arthur", lastName: "Mensch",
    role: "CTO", email: null, linkedinUrl: "https://linkedin.com/in/arthur-mensch",
    contactType: "engineer", temperature: "hot", lastExchangeDate: "2026-05-28",
    lastExchangeSummary: "Entretien final — 1h de deep dive sur l'architecture de training distribué.",
    nextFollowupDate: "2026-06-03", signalDetected: "Offre possible cette semaine",
    humanNotes: "Brillant. Échange très technique et stimulant.", trustLevel: 5,
    createdAt: new Date("2026-03-15"), updatedAt: new Date("2026-05-28"),
  },
  {
    id: "ct6", userId: "demo", companyId: "co4", firstName: "Claire", lastName: "Nguyen",
    role: "Responsable Innovation Digital", email: "claire.nguyen@totalenergies.com", linkedinUrl: null,
    contactType: "engineer", temperature: "warm", lastExchangeDate: "2026-05-10",
    lastExchangeSummary: "Call de 30 min. Présentation des projets IA/Data de la Digital Factory.",
    nextFollowupDate: "2026-06-08", signalDetected: null,
    humanNotes: "Budget ouvert, mais process RH lent chez Total.", trustLevel: 3,
    createdAt: new Date("2026-03-12"), updatedAt: new Date("2026-05-10"),
  },
  {
    id: "ct7", userId: "demo", companyId: "co6", firstName: "Marc", lastName: "Leblanc",
    role: "Recruteur IT", email: "marc.leblanc@bnpparibas.com", linkedinUrl: null,
    contactType: "recruiter", temperature: "cold", lastExchangeDate: "2026-04-20",
    lastExchangeSummary: "Retour négatif. Profil jugé trop orienté startup pour l'environnement enterprise.",
    nextFollowupDate: null, signalDetected: null,
    humanNotes: "Process terminé.", trustLevel: 2,
    createdAt: new Date("2026-03-18"), updatedAt: new Date("2026-04-20"),
  },
  {
    id: "ct8", userId: "demo", companyId: "co7", firstName: "Julie", lastName: "Moreau",
    role: "ML Engineer", email: null, linkedinUrl: "https://linkedin.com/in/julie-moreau-ml",
    contactType: "referral", temperature: "warm", lastExchangeDate: "2026-05-05",
    lastExchangeSummary: "Ancienne collègue. M'a référé en interne pour le poste MLOps.",
    nextFollowupDate: "2026-06-10", signalDetected: "Référence interne active",
    humanNotes: "Bonne relation. Elle suit mon dossier en interne.", trustLevel: 4,
    createdAt: new Date("2026-03-22"), updatedAt: new Date("2026-05-05"),
  },
  {
    id: "ct9", userId: "demo", companyId: "co9", firstName: "David", lastName: "O'Brien",
    role: "Senior Recruiter EMEA", email: "david@stripe.com", linkedinUrl: null,
    contactType: "recruiter", temperature: "warm", lastExchangeDate: "2026-05-18",
    lastExchangeSummary: "Premier call screening. Processus Stripe = 5 rounds minimum.",
    nextFollowupDate: "2026-06-12", signalDetected: null,
    humanNotes: "Très pro. Process long mais bien structuré.", trustLevel: 4,
    createdAt: new Date("2026-04-05"), updatedAt: new Date("2026-05-18"),
  },
  {
    id: "ct10", userId: "demo", companyId: "co10", firstName: "Paul", lastName: "Girard",
    role: "Digital Transformation Lead", email: "paul.girard@se.com", linkedinUrl: null,
    contactType: "engineer", temperature: "cold", lastExchangeDate: "2026-05-12",
    lastExchangeSummary: "Échange rapide au salon VivaTech. A donné sa carte.",
    nextFollowupDate: "2026-06-15", signalDetected: null,
    humanNotes: "Contact initial — à creuser.", trustLevel: 2,
    createdAt: new Date("2026-04-10"), updatedAt: new Date("2026-05-12"),
  },
  // Some contacts without company (orphans for overview demo)
  {
    id: "ct11", userId: "demo", companyId: null, firstName: "Karim", lastName: "Benzema",
    role: "Tech Lead chez une startup IA", email: null, linkedinUrl: "https://linkedin.com/in/karim-b",
    contactType: "acquaintance", temperature: "warm", lastExchangeDate: "2026-05-01",
    lastExchangeSummary: "Rencontré à un meetup Python Paris. Cherche aussi à recruter.",
    nextFollowupDate: "2026-06-20", signalDetected: "Pourrait me recommander",
    humanNotes: "Contact perso, pas encore lié à une entreprise.", trustLevel: 3,
    createdAt: new Date("2026-04-25"), updatedAt: new Date("2026-05-01"),
  },
  {
    id: "ct12", userId: "demo", companyId: null, firstName: "Émilie", lastName: "Rousseau",
    role: "Consultante RH indépendante", email: "emilie.r@gmail.com", linkedinUrl: null,
    contactType: "consultant", temperature: "warm", lastExchangeDate: "2026-05-22",
    lastExchangeSummary: "M'a envoyé 3 offres potentielles dans le secteur fintech.",
    nextFollowupDate: "2026-06-07", signalDetected: null,
    humanNotes: "Bonne source d'opportunités. Travaille avec plusieurs startups.", trustLevel: 4,
    createdAt: new Date("2026-04-28"), updatedAt: new Date("2026-05-22"),
  },
];

// ─── Applications ───────────────────────────────────────────────────────────

export const DEMO_APPLICATIONS: Application[] = [
  {
    id: "ap1", userId: "demo", companyId: "co1", contactId: "ct1", sectorId: "s1", cvUsedId: null,
    jobTitle: "Senior Software Engineer — Observability", messageSent: null,
    status: "interview", sentDate: "2026-03-10", nextAction: "3e entretien le 02/06",
    feedbackReceived: "Feedback positif aux 2 premiers rounds.", sentVia: "linkedin",
    createdAt: new Date("2026-03-10"), updatedAt: new Date("2026-05-20"),
  },
  {
    id: "ap2", userId: "demo", companyId: "co3", contactId: "ct3", sectorId: "s2", cvUsedId: null,
    jobTitle: "Staff Engineer — Platform", messageSent: null,
    status: "in_discussion", sentDate: "2026-03-15", nextAction: "Envoyer le case study avant le 05/06",
    feedbackReceived: "Très intéressés par le profil scaling.", sentVia: "email",
    createdAt: new Date("2026-03-15"), updatedAt: new Date("2026-05-25"),
  },
  {
    id: "ap3", userId: "demo", companyId: "co5", contactId: "ct5", sectorId: "s1", cvUsedId: null,
    jobTitle: "ML Infrastructure Engineer", messageSent: null,
    status: "interview", sentDate: "2026-03-20", nextAction: "Attendre retour offre",
    feedbackReceived: "Entretien final passé — résultat d'ici fin de semaine.", sentVia: "direct",
    createdAt: new Date("2026-03-20"), updatedAt: new Date("2026-05-28"),
  },
  {
    id: "ap4", userId: "demo", companyId: "co2", contactId: "ct4", sectorId: "s1", cvUsedId: null,
    jobTitle: "Senior Backend Engineer — Ruby", messageSent: null,
    status: "cv_sent", sentDate: "2026-04-01", nextAction: "Relancer Thomas le 01/06",
    feedbackReceived: null, sentVia: "linkedin",
    createdAt: new Date("2026-04-01"), updatedAt: new Date("2026-05-12"),
  },
  {
    id: "ap5", userId: "demo", companyId: "co6", contactId: "ct7", sectorId: "s2", cvUsedId: null,
    jobTitle: "Développeur Java/Spring Senior", messageSent: null,
    status: "rejected", sentDate: "2026-03-25", nextAction: null,
    feedbackReceived: "Profil trop orienté startup. Manque d'expérience enterprise Java.", sentVia: "email",
    createdAt: new Date("2026-03-25"), updatedAt: new Date("2026-04-20"),
  },
  {
    id: "ap6", userId: "demo", companyId: "co4", contactId: "ct6", sectorId: "s4", cvUsedId: null,
    jobTitle: "Data Engineer — Digital Factory", messageSent: null,
    status: "followup_planned", sentDate: "2026-04-05", nextAction: "Relance prévue le 08/06",
    feedbackReceived: null, sentVia: "email",
    createdAt: new Date("2026-04-05"), updatedAt: new Date("2026-05-10"),
  },
  {
    id: "ap7", userId: "demo", companyId: "co7", contactId: "ct8", sectorId: "s3", cvUsedId: null,
    jobTitle: "MLOps Engineer", messageSent: null,
    status: "cv_sent", sentDate: "2026-04-15", nextAction: "Julie suit en interne",
    feedbackReceived: null, sentVia: "referral",
    createdAt: new Date("2026-04-15"), updatedAt: new Date("2026-05-05"),
  },
  {
    id: "ap8", userId: "demo", companyId: "co9", contactId: "ct9", sectorId: "s1", cvUsedId: null,
    jobTitle: "Backend Engineer — Payments", messageSent: null,
    status: "in_discussion", sentDate: "2026-04-10", nextAction: "Phone screen #2 le 12/06",
    feedbackReceived: "Screening call passé avec succès.", sentVia: "linkedin",
    createdAt: new Date("2026-04-10"), updatedAt: new Date("2026-05-18"),
  },
  {
    id: "ap9", userId: "demo", companyId: "co10", contactId: null, sectorId: "s4", cvUsedId: null,
    jobTitle: "Ingénieur IoT — Smart Buildings", messageSent: null,
    status: "to_prepare", sentDate: null, nextAction: "Préparer candidature",
    feedbackReceived: null, sentVia: "email",
    createdAt: new Date("2026-04-20"), updatedAt: new Date("2026-04-20"),
  },
  {
    id: "ap10", userId: "demo", companyId: null, contactId: null, sectorId: "s1", cvUsedId: null,
    jobTitle: "Full Stack Engineer — Startup IA (via Émilie)", messageSent: null,
    status: "cv_sent", sentDate: "2026-05-01", nextAction: "Attendre retour d'Émilie",
    feedbackReceived: null, sentVia: "referral",
    createdAt: new Date("2026-05-01"), updatedAt: new Date("2026-05-22"),
  },
  {
    id: "ap11", userId: "demo", companyId: "co3", contactId: null, sectorId: "s2", cvUsedId: null,
    jobTitle: "Frontend Engineer — Design System", messageSent: null,
    status: "waiting", sentDate: "2026-04-28", nextAction: "En attente de retour",
    feedbackReceived: null, sentVia: "direct",
    createdAt: new Date("2026-04-28"), updatedAt: new Date("2026-05-15"),
  },
  {
    id: "ap12", userId: "demo", companyId: "co1", contactId: "ct2", sectorId: "s1", cvUsedId: null,
    jobTitle: "Site Reliability Engineer", messageSent: null,
    status: "won", sentDate: "2026-03-08", nextAction: null,
    feedbackReceived: "Offre reçue ! Négociation en cours.", sentVia: "linkedin",
    createdAt: new Date("2026-03-08"), updatedAt: new Date("2026-05-30"),
  },
];

// ─── Meetings ───────────────────────────────────────────────────────────────

export const DEMO_MEETINGS: Meeting[] = [
  {
    id: "mt1", userId: "demo", companyId: "co1", contactId: "ct1", applicationId: "ap1",
    title: "Entretien RH — Datadog", date: "2026-04-15",
    companyInfo: "Datadog a 800+ ingénieurs. L'équipe Observability à Paris fait ~40 personnes. Stack : Go microservices, React frontend, Kafka pour le streaming. Forte culture d'ownership.",
    myPitch: "Présenté mon expérience en scaling de systèmes distribués. Mis l'accent sur mon projet de monitoring custom chez mon ancien employeur. Parlé de mon intérêt pour l'observabilité et le DevEx.",
    jobMentioned: "Senior Software Engineer — Observability. Possibilité d'évoluer vers Tech Lead sous 12-18 mois.",
    sentiment: "positive",
    sentimentNotes: "Très bon feeling. Sophie est engageante et transparente sur le process. L'équipe a l'air solide.",
    questionsData: [
      { question: "Est-ce une création de poste ou un remplacement ?", asked: true, answer: "Création de poste — l'équipe double de taille cette année." },
      { question: "Quelle est l'urgence de ce recrutement ?", asked: true, answer: "Priorité haute, objectif d'onboarding avant septembre." },
      { question: "Quelle est la timeline du processus ?", asked: true, answer: "4 rounds total. Résultat final d'ici 3 semaines." },
      { question: "Avez-vous la job description officielle ?", asked: true, answer: "Envoyée par email après le call." },
      { question: "Combien de candidats sont en lice ?", asked: true, answer: "5 candidats shortlistés, 2 déjà éliminés." },
      { question: "Quelle est la composition de l'équipe ?", asked: true, answer: "8 devs + 1 EM + 1 PM. Mostly senior." },
      { question: "Y a-t-il une fourchette de rémunération ?", asked: true, answer: "75-95K€ fixe + equity (BSPCE)." },
      { question: "Quel est le mode de travail ?", asked: true, answer: "Hybride : 3 jours bureau, 2 jours remote." },
    ],
    nextSteps: "Entretien technique le 28/04 avec Alexandre Chen (EM). Préparer system design distributed tracing.",
    notes: "Penser à mentionner mon expérience OpenTelemetry.",
    createdAt: new Date("2026-04-15"), updatedAt: new Date("2026-04-15"),
  },
  {
    id: "mt2", userId: "demo", companyId: "co3", contactId: "ct3", applicationId: "ap2",
    title: "Call avec Léa Dupont — Qonto", date: "2026-05-10",
    companyInfo: "Qonto passe de 1000 à 1500 employés cette année. Plateforme traitant 5M+ transactions/mois. Migration en cours vers une architecture event-driven. Équipe platform = 12 personnes.",
    myPitch: "Axé sur mon expérience en refactoring d'architecture monolithique vers microservices. Présenté mon framework de décision pour le design de systèmes distribués.",
    jobMentioned: "Staff Engineer — Platform. Rôle cross-team, définir les standards d'architecture. Aussi un poste de Senior Frontend open (Design System).",
    sentiment: "positive",
    sentimentNotes: "Léa est impressionnante. Discussion très technique et stimulante. On partage la même vision sur l'architecture.",
    questionsData: [
      { question: "Est-ce une création de poste ou un remplacement ?", asked: true, answer: "Création. Le rôle de Staff est nouveau dans la team Platform." },
      { question: "Quelle est l'urgence ?", asked: true, answer: "Urgente — la migration event-driven est le projet #1 de Q3." },
      { question: "Quelle est la timeline ?", asked: true, answer: "Décision d'ici 2 semaines après le case study." },
      { question: "Y a-t-il une fourchette de rémunération ?", asked: true, answer: "85-110K€ + BSPCE significatifs." },
      { question: "Quel est le mode de travail ?", asked: true, answer: "Hybride flexible, 2-3 jours bureau à Paris." },
    ],
    nextSteps: "Préparer et envoyer le case study (architecture event-driven) avant le 05/06. Léa schedule le panel review.",
    notes: "Qonto est mon top pick si Mistral ne fait pas d'offre.",
    createdAt: new Date("2026-05-10"), updatedAt: new Date("2026-05-10"),
  },
  {
    id: "mt3", userId: "demo", companyId: "co5", contactId: "ct5", applicationId: "ap3",
    title: "Entretien final — Mistral AI", date: "2026-05-28",
    companyInfo: "Mistral = ~150 personnes, 95% d'ingénieurs. Budget infra GPU de plusieurs millions. Travaillent sur les prochaines générations de modèles. Culture très académique et exigeante.",
    myPitch: "Deep dive sur mes contributions open source en ML infra. Présenté mon expérience de training distribué sur clusters GPU multi-node. Discuté de mes papiers lus récemment sur les architectures Mixture-of-Experts.",
    jobMentioned: "ML Infrastructure Engineer. Responsable de l'outillage de training : scheduling, checkpointing, fault tolerance.",
    sentiment: "positive",
    sentimentNotes: "Le plus bel entretien technique de ma carrière. Arthur est brillant, les questions sont profondes. Je sens que le poste est fait pour moi.",
    questionsData: [
      { question: "Est-ce une création de poste ?", asked: true, answer: "Oui, l'équipe infra passe de 4 à 8 cette année." },
      { question: "Quelle est l'urgence ?", asked: true, answer: "Haute — objectif de doubler la capacité de training en Q3." },
      { question: "Fourchette salariale ?", asked: true, answer: "Compétitif FAANG + equity early-stage significative." },
      { question: "Mode de travail ?", asked: true, answer: "100% présentiel à Paris, sauf exceptions." },
      { question: "Prochaines étapes ?", asked: true, answer: "Résultat d'ici vendredi. Si positif, offre la semaine suivante." },
    ],
    nextSteps: "Attendre le résultat vendredi. Préparer mes questions de négociation salariale au cas où.",
    notes: "Ce serait le job de rêve. Mais 100% présentiel est un point de friction.",
    createdAt: new Date("2026-05-28"), updatedAt: new Date("2026-05-28"),
  },
  {
    id: "mt4", userId: "demo", companyId: "co6", contactId: "ct7", applicationId: "ap5",
    title: "Entretien technique — BNP CIB", date: "2026-04-10",
    companyInfo: "Équipe IT de 200+ personnes. Environnement très structuré. Java enterprise, pas de cloud natif.",
    myPitch: "Présenté mon parcours technique avec adaptation vers l'enterprise. N'ai pas pu convaincre sur mon manque d'expérience Spring Boot en production.",
    jobMentioned: "Développeur Java/Spring Senior — équipe Trading Systems.",
    sentiment: "negative",
    sentimentNotes: "Décalage culturel flagrant. Mes expériences startup ne sont pas valorisées. L'interviewer semblait sceptique dès le début.",
    questionsData: [
      { question: "Est-ce un remplacement ?", asked: true, answer: "Remplacement d'un départ." },
      { question: "Urgence ?", asked: true, answer: "Modérée, ils cherchent depuis 2 mois." },
      { question: "Mode de travail ?", asked: true, answer: "100% présentiel La Défense." },
    ],
    nextSteps: "Aucune — refusé.",
    notes: "Leçon apprise : ne pas candidater en enterprise Java sans expérience Spring solide.",
    createdAt: new Date("2026-04-10"), updatedAt: new Date("2026-04-10"),
  },
  {
    id: "mt5", userId: "demo", companyId: "co2", contactId: "ct4", applicationId: "ap4",
    title: "Screening call — Doctolib", date: "2026-05-08",
    companyInfo: "Doctolib recrute 300+ devs cette année. Équipe backend = 80 personnes sur 4 squads. Stack Ruby on Rails avec migration progressive vers des microservices.",
    myPitch: "Pitch classique — parcours + motivations e-santé. Thomas était principalement en mode Q&A.",
    jobMentioned: "Senior Backend Engineer — Ruby. Équipe booking/scheduling.",
    sentiment: "neutral",
    sentimentNotes: "Call standard, rien d'exceptionnel dans un sens ou l'autre. Process classique.",
    questionsData: [
      { question: "Est-ce une création de poste ?", asked: true, answer: "Mix — 2 créations + 1 remplacement." },
      { question: "Timeline ?", asked: true, answer: "3-4 semaines pour le process complet." },
      { question: "Rémunération ?", asked: false, answer: "" },
      { question: "Mode de travail ?", asked: true, answer: "Hybride : 3j bureau Paris + 2j remote." },
    ],
    nextSteps: "Attendre l'envoi du test technique (attendu cette semaine).",
    notes: null,
    createdAt: new Date("2026-05-08"), updatedAt: new Date("2026-05-08"),
  },
  {
    id: "mt6", userId: "demo", companyId: "co9", contactId: "ct9", applicationId: "ap8",
    title: "Phone Screen — Stripe", date: "2026-05-18",
    companyInfo: "Stripe EMEA : ~2000 employés. L'équipe Payments Core à Dublin fait 60 personnes. Très international, en anglais uniquement.",
    myPitch: "En anglais. Focus sur payment systems et transaction processing. David a apprécié mon expérience en idempotency patterns.",
    jobMentioned: "Backend Engineer — Payments Core. Remote possible depuis la France avec déplacements Dublin occasionnels.",
    sentiment: "positive",
    sentimentNotes: "David est très pro. Le process Stripe est long (5 rounds) mais bien structuré. Worth it.",
    questionsData: [
      { question: "Creation or backfill?", asked: true, answer: "Headcount growth — 10 openings in Payments Core this year." },
      { question: "Timeline?", asked: true, answer: "Full process takes 4-6 weeks. Next step: coding exercise." },
      { question: "Comp range?", asked: false, answer: "" },
      { question: "Remote policy?", asked: true, answer: "Remote from France OK, with quarterly Dublin visits." },
    ],
    nextSteps: "Coding exercise à recevoir par email. 1 semaine pour le compléter.",
    notes: "Stripe = backup plan solide si les startups ne fonctionnent pas.",
    createdAt: new Date("2026-05-18"), updatedAt: new Date("2026-05-18"),
  },
  {
    id: "mt7", userId: "demo", companyId: "co4", contactId: "ct6", applicationId: "ap6",
    title: "Réunion découverte — TotalEnergies", date: "2026-04-25",
    companyInfo: "Digital Factory = 100 personnes, ambiance startup dans un grand groupe. Projets : prédiction maintenance, optimisation énergie par IA, dashboards IoT.",
    myPitch: "Orienté data engineering et IA appliquée. Claire était intéressée par mon expérience en pipelines de données temps réel.",
    jobMentioned: "Data Engineer — Digital Factory. Poste en CDI, basé La Défense.",
    sentiment: "neutral",
    sentimentNotes: "Intéressant mais le process RH interne Total est très lent. Claire semble motivée mais dépend de validations hiérarchiques.",
    questionsData: [
      { question: "Création ou remplacement ?", asked: true, answer: "Création, nouveau budget validé en Q2." },
      { question: "Urgence ?", asked: true, answer: "Pas urgente — start Q4 acceptable." },
      { question: "Rémunération ?", asked: true, answer: "Grille grand groupe : 60-75K€ selon expérience." },
      { question: "Mode de travail ?", asked: true, answer: "2j remote par semaine." },
    ],
    nextSteps: "Claire relance les RH pour programmer un entretien formel. Relancer le 08/06 si pas de nouvelles.",
    notes: "Plan C — salaire moins compétitif mais stabilité CDI grand groupe.",
    createdAt: new Date("2026-04-25"), updatedAt: new Date("2026-04-25"),
  },
  {
    id: "mt8", userId: "demo", companyId: null, contactId: "ct11", applicationId: null,
    title: "Café networking — Meetup Python Paris", date: "2026-05-01",
    companyInfo: "Karim travaille dans une startup IA (pas encore identifiée) qui développe des agents conversationnels.",
    myPitch: "Discussion informelle. Parlé de ma recherche et de mes intérêts en ML infrastructure.",
    jobMentioned: "Karim a mentionné qu'ils recrutent un ML Engineer. Pas de fiche de poste formelle encore.",
    sentiment: "positive",
    sentimentNotes: "Bon contact. Karim est ouvert à me recommander quand la fiche de poste sera prête.",
    questionsData: [],
    nextSteps: "Suivre Karim sur LinkedIn. Relancer mi-juin pour voir si le poste est ouvert.",
    notes: "Piste informelle — à suivre.",
    createdAt: new Date("2026-05-01"), updatedAt: new Date("2026-05-01"),
  },
];

// ─── Followups ──────────────────────────────────────────────────────────────

export const DEMO_FOLLOWUPS = [
  { id: "fu1", userId: "demo", contactId: "ct1", scheduledDate: "2026-05-20", status: "completed" as const, messageTemplateUsed: "Relance post-entretien", completedAt: "2026-05-20", createdAt: new Date("2026-05-15") },
  { id: "fu2", userId: "demo", contactId: "ct3", scheduledDate: "2026-05-25", status: "completed" as const, messageTemplateUsed: "Suivi candidature", completedAt: "2026-05-25", createdAt: new Date("2026-05-20") },
  { id: "fu3", userId: "demo", contactId: "ct4", scheduledDate: "2026-06-01", status: "pending" as const, messageTemplateUsed: null, completedAt: null, createdAt: new Date("2026-05-12") },
  { id: "fu4", userId: "demo", contactId: "ct5", scheduledDate: "2026-06-03", status: "pending" as const, messageTemplateUsed: null, completedAt: null, createdAt: new Date("2026-05-28") },
  { id: "fu5", userId: "demo", contactId: "ct6", scheduledDate: "2026-06-08", status: "pending" as const, messageTemplateUsed: null, completedAt: null, createdAt: new Date("2026-05-10") },
  { id: "fu6", userId: "demo", contactId: "ct8", scheduledDate: "2026-06-10", status: "pending" as const, messageTemplateUsed: null, completedAt: null, createdAt: new Date("2026-05-05") },
  { id: "fu7", userId: "demo", contactId: "ct9", scheduledDate: "2026-06-12", status: "pending" as const, messageTemplateUsed: null, completedAt: null, createdAt: new Date("2026-05-18") },
  { id: "fu8", userId: "demo", contactId: "ct7", scheduledDate: "2026-04-25", status: "skipped" as const, messageTemplateUsed: null, completedAt: null, createdAt: new Date("2026-04-20") },
  { id: "fu9", userId: "demo", contactId: "ct1", scheduledDate: "2026-06-02", status: "pending" as const, messageTemplateUsed: null, completedAt: null, createdAt: new Date("2026-05-20") },
  { id: "fu10", userId: "demo", contactId: "ct10", scheduledDate: "2026-06-15", status: "pending" as const, messageTemplateUsed: null, completedAt: null, createdAt: new Date("2026-05-12") },
];

// ─── Trainings ──────────────────────────────────────────────────────────────

export const DEMO_TRAININGS = [
  { id: "tr1", userId: "demo", sectorId: "s1", name: "System Design Interview Prep", certificationAvailable: false, provider: "Educative.io", price: 79, durationHours: 40, marketRecognition: "high" as const, priority: 1, status: "in_progress" as const, roiEstimated: "high" as const, createdAt: new Date("2026-03-01") },
  { id: "tr2", userId: "demo", sectorId: "s1", name: "Advanced Go Programming", certificationAvailable: true, provider: "Ardan Labs", price: 299, durationHours: 24, marketRecognition: "medium" as const, priority: 2, status: "done" as const, roiEstimated: "high" as const, createdAt: new Date("2026-03-05") },
  { id: "tr3", userId: "demo", sectorId: "s1", name: "AWS Solutions Architect", certificationAvailable: true, provider: "AWS", price: 300, durationHours: 80, marketRecognition: "high" as const, priority: 2, status: "to_do" as const, roiEstimated: "medium" as const, createdAt: new Date("2026-04-01") },
];

// ─── CVs ────────────────────────────────────────────────────────────────────

export const DEMO_CVS = [
  { id: "cv1", userId: "demo", sectorId: "s1", versionNumber: 3, lastUpdated: "2026-05-15", mainKeywords: ["Go", "Distributed Systems", "Kubernetes", "React"], strengthsToHighlight: ["Scaling microservices", "Open source contributions", "DevEx tooling"], pdfUrl: null, createdAt: new Date("2026-03-01") },
  { id: "cv2", userId: "demo", sectorId: "s2", versionNumber: 2, lastUpdated: "2026-04-20", mainKeywords: ["Fintech", "Payments", "TypeScript", "PostgreSQL"], strengthsToHighlight: ["Transaction processing", "Idempotency patterns", "PCI compliance"], pdfUrl: null, createdAt: new Date("2026-03-10") },
  { id: "cv3", userId: "demo", sectorId: "s3", versionNumber: 1, lastUpdated: "2026-04-10", mainKeywords: ["Python", "ML", "PyTorch", "Data pipelines"], strengthsToHighlight: ["ML infrastructure", "Distributed training", "Data engineering"], pdfUrl: null, createdAt: new Date("2026-03-15") },
];

// ─── Dashboard stats (pre-computed for demo) ────────────────────────────────

export const DEMO_DASHBOARD = {
  applicationsTotal: 12,
  applicationsDelta: 3,
  followupsThisMonth: 7,
  followupsDelta: 2,
  interviewsPlanned: 3,
  responseRate: 75,
  responseRateDelta: 12,
  applicationsBySector: [
    { sectorName: "Tech / SaaS", count: 7, color: "#3D5BE3" },
    { sectorName: "Finance / Fintech", count: 3, color: "#2A9D6E" },
    { sectorName: "Santé / Biotech", count: 1, color: "#E08A2B" },
    { sectorName: "Énergie / Industrie", count: 2, color: "#8B5CB8" },
  ],
  hotContacts: [],
  todayFollowups: [
    { id: "fu3", contactId: "ct4", scheduledDate: "2026-06-01" },
  ],
};

// ─── Demo user session ──────────────────────────────────────────────────────

export const DEMO_USER = {
  id: "demo",
  name: "Marie Lefevre",
  email: "marie.lefevre@demo.com",
  role: "user",
  image: null,
  emailVerified: true,
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-05-30"),
};
