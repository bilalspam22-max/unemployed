import Anthropic from "@anthropic-ai/sdk";
import type { AIMessageVariant, AIJobExtraction } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-6";

export async function suggestFollowupMessages(params: {
  firstName: string;
  lastName: string;
  role: string | null;
  company: string | null;
  lastExchangeSummary: string | null;
  signalDetected: string | null;
}): Promise<AIMessageVariant[]> {
  const { firstName, lastName, role, company, lastExchangeSummary, signalDetected } = params;

  const prompt = `Tu es un assistant expert en recherche d'emploi en France.

Génère 3 messages de relance LinkedIn/email pour ce contact, chacun max 80 mots:
- Nom: ${firstName} ${lastName}
- Rôle: ${role ?? "inconnu"}
- Entreprise: ${company ?? "inconnue"}
- Dernier échange: ${lastExchangeSummary ?? "premier contact"}
- Signal détecté: ${signalDetected ?? "aucun"}

Réponds en JSON strict:
[
  {"tone": "cordial", "toneLabel": "Cordial", "message": "..."},
  {"tone": "direct",  "toneLabel": "Direct",  "message": "..."},
  {"tone": "with_value", "toneLabel": "Avec valeur ajoutée", "message": "..."}
]

Règles:
- Tutoyer seulement si le contexte le justifie, sinon vouvoyer
- Mentionner un élément spécifique du profil pour personnaliser
- Jamais de formule générique
- Chaque message doit être légèrement différent en ton`;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const text = resp.content[0].type === "text" ? resp.content[0].text : "[]";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  return JSON.parse(jsonMatch[0]) as AIMessageVariant[];
}

export async function extractJobOffer(rawText: string): Promise<AIJobExtraction> {
  const prompt = `Analyse cette offre d'emploi et extrais les informations clés.

OFFRE:
${rawText.slice(0, 3000)}

Réponds en JSON strict:
{
  "jobTitle": "titre du poste",
  "suggestedSector": "secteur principal parmi: Automation, Energie, Aerospace, Robotics, Data/IA, Software, Life Sciences, autre",
  "keySkills": ["compétence1", "compétence2", ...],
  "recommendedCVKeywords": ["mot-clé1", "mot-clé2", ...],
  "pointsToHighlight": ["point fort à mettre en avant"]
}`;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = resp.content[0].type === "text" ? resp.content[0].text : "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in response");
  return JSON.parse(jsonMatch[0]) as AIJobExtraction;
}

export async function suggestNextAction(params: {
  jobTitle: string;
  companyName: string | null;
  status: string;
  sentDate: string | null;
  feedbackReceived: string | null;
}): Promise<string> {
  const { jobTitle, companyName, status, sentDate, feedbackReceived } = params;
  const prompt = `Pour cette candidature, quelle est la prochaine action recommandée?

Poste: ${jobTitle}
Entreprise: ${companyName ?? "inconnue"}
Statut actuel: ${status}
Date d'envoi: ${sentDate ?? "non définie"}
Feedback reçu: ${feedbackReceived ?? "aucun"}

Réponds en une phrase courte (max 15 mots), actionnable et concrète.
Exemples: "Relancer par LinkedIn le 20 mai", "Préparer entretien technique EPLAN", "Envoyer lettre de motivation révisée"`;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 60,
    messages: [{ role: "user", content: prompt }],
  });

  return resp.content[0].type === "text" ? resp.content[0].text.trim() : "Relancer dans 2 semaines";
}
