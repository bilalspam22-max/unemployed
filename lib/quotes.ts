// 50 citations motivantes pour la recherche d'emploi.
// Sélection déterministe par jour : hash(YYYY-MM-DD) % 50.
// La même citation s'affiche toute la journée, change chaque jour.

export interface Quote {
  text: string;
  author: string;
}

const QUOTES: Quote[] = [
  { text: "Le succès, c'est tomber sept fois et se relever huit.", author: "Proverbe japonais" },
  { text: "Une opportunité manquée, c'est une opportunité que personne n'a saisie. Saisis-la.", author: "Anonyme" },
  { text: "Ne dis pas 'je ne peux pas', dis 'je n'ai pas encore essayé'.", author: "Anonyme" },
  { text: "La meilleure façon de prédire l'avenir, c'est de le créer.", author: "Peter Drucker" },
  { text: "Le talent ne suffit pas. Ce qu'il faut, c'est la persévérance.", author: "Walt Disney" },
  { text: "J'ai raté plus de 9 000 tirs dans ma carrière. C'est pour ça que j'ai réussi.", author: "Michael Jordan" },
  { text: "Les obstacles sont ces choses effrayantes qu'on voit quand on détourne les yeux de son objectif.", author: "Henry Ford" },
  { text: "Choisis un travail que tu aimes et tu n'auras pas à travailler un seul jour de ta vie.", author: "Confucius" },
  { text: "La vie est un défi à relever, un bonheur à mériter, une aventure à tenter.", author: "Mère Teresa" },
  { text: "Croyez en vous-même et tout devient possible.", author: "Audrey Hepburn" },
  { text: "Le seul moyen de faire du bon travail, c'est d'aimer ce que vous faites.", author: "Steve Jobs" },
  { text: "Ne laissez personne vous dire que vous ne pouvez pas faire quelque chose.", author: "Will Smith" },
  { text: "La persévérance est la noblesse de l'obstination.", author: "Adrien Decourcelle" },
  { text: "Cela semble toujours impossible, jusqu'à ce que ce soit fait.", author: "Nelson Mandela" },
  { text: "L'échec est simplement l'opportunité de recommencer plus intelligemment.", author: "Henry Ford" },
  { text: "Si vous voulez vraiment quelque chose, vous trouverez un moyen. Sinon, vous trouverez une excuse.", author: "Jim Rohn" },
  { text: "Le futur appartient à ceux qui croient en la beauté de leurs rêves.", author: "Eleanor Roosevelt" },
  { text: "Tu rates 100% des occasions que tu ne saisis pas.", author: "Wayne Gretzky" },
  { text: "La plus grande gloire n'est pas de ne jamais tomber, mais de se relever à chaque chute.", author: "Confucius" },
  { text: "Fais de ta vie un rêve, et d'un rêve une réalité.", author: "Antoine de Saint-Exupéry" },
  { text: "Ce n'est jamais trop tard pour devenir ce que vous auriez voulu être.", author: "George Eliot" },
  { text: "Le succès, c'est aller d'échec en échec sans perdre son enthousiasme.", author: "Winston Churchill" },
  { text: "L'avenir dépend de ce que vous faites aujourd'hui.", author: "Mahatma Gandhi" },
  { text: "Vous ne pouvez pas connecter les points en regardant vers l'avant, vous ne pouvez les connecter qu'en regardant en arrière.", author: "Steve Jobs" },
  { text: "Si vous ne risquez rien, vous risquez encore plus.", author: "Erica Jong" },
  { text: "Tout ce qui peut être imaginé peut être réalisé.", author: "Pablo Picasso" },
  { text: "Une fois que tu as accepté tes erreurs, personne ne pourra jamais les utiliser contre toi.", author: "George Carlin" },
  { text: "Notre plus grande faiblesse réside dans l'abandon. La façon la plus sûre de réussir est d'essayer une fois de plus.", author: "Thomas Edison" },
  { text: "Le voyage de mille lieues commence par un seul pas.", author: "Lao Tseu" },
  { text: "Soyez vous-même, tous les autres sont déjà pris.", author: "Oscar Wilde" },
  { text: "La discipline est le pont entre les buts et les accomplissements.", author: "Jim Rohn" },
  { text: "Les défis sont ce qui rend la vie intéressante. Les surmonter est ce qui lui donne un sens.", author: "Joshua Marine" },
  { text: "N'attendez pas. Le moment ne sera jamais juste.", author: "Napoleon Hill" },
  { text: "Tout ce que vous avez toujours voulu se trouve de l'autre côté de la peur.", author: "George Addair" },
  { text: "Soit vous gérez la journée, soit la journée vous gère.", author: "Jim Rohn" },
  { text: "Le succès n'est pas final, l'échec n'est pas fatal : c'est le courage de continuer qui compte.", author: "Winston Churchill" },
  { text: "Vos limites n'existent que dans votre tête.", author: "Anonyme" },
  { text: "Les grandes choses ne sont jamais réalisées dans la zone de confort.", author: "Anonyme" },
  { text: "Rêvez en grand et osez échouer.", author: "Norman Vaughan" },
  { text: "Faites une chose chaque jour qui vous fait peur.", author: "Eleanor Roosevelt" },
  { text: "La motivation te lance, l'habitude te porte.", author: "Jim Ryun" },
  { text: "Ne comparez pas votre chapitre 1 au chapitre 20 de quelqu'un d'autre.", author: "Anonyme" },
  { text: "Plus tu travailles dur, plus tu auras de chance.", author: "Gary Player" },
  { text: "L'opportunité ne frappe pas, elle se présente quand tu cognes sur la porte.", author: "Kyle Chandler" },
  { text: "Les rêves n'expirent pas. Ils attendent juste que tu sois prêt.", author: "Anonyme" },
  { text: "Ta valeur ne diminue pas selon l'incapacité de quelqu'un à la voir.", author: "Anonyme" },
  { text: "Si tu n'essaies pas, tu as déjà raté.", author: "Wayne Gretzky" },
  { text: "Construis ton propre rêve, ou quelqu'un d'autre t'embauchera pour construire le sien.", author: "Farrah Gray" },
  { text: "Le meilleur moment pour planter un arbre c'était il y a 20 ans. Le deuxième meilleur, c'est maintenant.", author: "Proverbe chinois" },
  { text: "Les actions répétées chaque jour deviennent ton destin.", author: "Anonyme" },
];

// Simple deterministic hash from date string (YYYY-MM-DD)
function dailySeed(dateStr: string): number {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = ((h << 5) - h) + dateStr.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function getDailyQuote(): Quote {
  const today = new Date().toISOString().slice(0, 10);
  const idx = dailySeed(today) % QUOTES.length;
  return QUOTES[idx];
}

export const QUOTES_COUNT = QUOTES.length;

// Random quote, optionally avoiding the previous index (for rotation).
export function getRandomQuote(exceptIndex?: number): { quote: Quote; index: number } {
  let idx = Math.floor(Math.random() * QUOTES.length);
  if (exceptIndex !== undefined && QUOTES.length > 1) {
    while (idx === exceptIndex) idx = Math.floor(Math.random() * QUOTES.length);
  }
  return { quote: QUOTES[idx], index: idx };
}
