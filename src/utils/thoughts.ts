export const thoughts = [
  "You are capable of amazing things.",
  "Your potential to succeed is infinite.",
  "Every moment is a fresh beginning.",
  "You are stronger than you think, and braver than you believe.",
  "Your light makes the world a brighter place.",
  "Embrace the glorious mess that you are.",
  "You have a heart full of gold and a mind full of wonders.",
  "Slow progress is still progress. Be proud of yourself.",
  "The world needs the special gift that only you have.",
  "You are deserving of all the love and happiness in the world.",
  "Take a deep breath. You are safe, you are loved, you matter.",
  "Your kindness creates ripples of joy across the universe.",
  "Even on cloudy days, your inner sunshine is there.",
  "Believe in yourself as much as we believe in you.",
  "You are a beautiful masterpiece, constantly in the making.",
  "Your presence alone brings comfort to those around you.",
  "It's okay to rest. Your worth is not tied to your productivity.",
  "You radiate warmth, and your soul is beautiful.",
  "Do not forget to be as gentle with yourself as you are with others.",
  "You are enough, just as you are, right in this very moment."
];

export function getDailyThought(): string {
  // Use the current date to select a thought, so it changes every day
  const index = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % thoughts.length;
  return thoughts[index];
}
