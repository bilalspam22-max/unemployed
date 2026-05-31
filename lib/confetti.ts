/**
 * Lance une animation de confetti. Lazy-importée pour éviter d'ajouter
 * la lib au bundle initial. Utilisée uniquement sur les "Gagnée".
 */
export async function celebrate(): Promise<void> {
  if (typeof window === "undefined") return;
  // Respect prefers-reduced-motion
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  try {
    const confetti = (await import("canvas-confetti")).default;
    const colors = ["#3D5BE3", "#2A9D6E", "#E08A2B", "#8B5CB8", "#D44A5C", "#3B83C9"];

    // Burst central
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors,
      ticks: 200,
    });

    // Burst gauche + droite légèrement décalés pour effet plus riche
    setTimeout(() => {
      confetti({ particleCount: 40, angle: 60,  spread: 55, origin: { x: 0, y: 0.7 },   colors });
      confetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: 1, y: 0.7 },   colors });
    }, 200);
  } catch {
    // Lib absente ou erreur de chargement : silencieux
  }
}
