export const calculateScore = (data) => {
  const sleep    = Number(data.sleep)    || 6;
  const water    = Number(data.water)    || 6;
  const exercise = Number(data.exercise) || 2;
  const meals    = Number(data.meals)    || 3;
  const stress   = Number(data.stress)   || 5;
  const energy   = Number(data.energy)   || 5;
 
  const moodMap   = { Joyful: 10, Happy: 8, Neutral: 5, Anxious: 3, Sad: 2 };
  const focusMap  = { high: 10, mid: 6, low: 3, "": 5 };
  const socialMap = { high: 9,  mid: 6, low: 2, "": 5 };
 
  const sleepScore    = sleep    >= 7 ? 10 : sleep    >= 6 ? 7 : sleep    >= 5 ? 4 : 2;
  const waterScore    = water    >= 8 ? 10 : water    >= 6 ? 7 : water    >= 4 ? 5 : 3;
  const exerciseScore = exercise >= 5 ? 10 : exercise >= 3 ? 8 : exercise >= 1 ? 5 : 2;
  const mealScore     = meals    >= 3 ?  9 : meals    >= 2 ? 6 : 4;
 
  const physical = Math.round(((sleepScore + waterScore + exerciseScore + mealScore) / 4) * 10) / 10;
 
  const stressScore = 10 - stress;
  const focusScore  = focusMap[data.focus]  ?? 5;
  const mental      = Math.round(((stressScore + focusScore) / 2) * 10) / 10;
 
  const moodScore   = moodMap[data.mood]    ?? 5;
  const socialScore = socialMap[data.social] ?? 5;
  const emotional   = Math.round(((moodScore + socialScore + energy) / 3) * 10) / 10;
 
  const overall = Math.round(((physical + mental + emotional) / 3) * 10) / 10;
 
  return {
    physical,
    mental,
    emotional,
    overall,
    mood: data.mood,
    date: new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  };
};
 
export const getRecommendations = (scores) => {
  const tips = [];
 
  if (scores.physical < 5) {
    tips.push({ dot: "rose",  text: "Physical score needs attention — sleep 7+ hrs and exercise 3× per week." });
    tips.push({ dot: "amber", text: "Increase daily water intake to at least 8 glasses for better hydration." });
  } else if (scores.physical < 8) {
    tips.push({ dot: "amber", text: "Good physical base! Add one more exercise session per week to push above 8." });
  }
 
  if (scores.mental < 5) {
    tips.push({ dot: "rose",  text: "High stress detected. Practice 10 minutes of meditation daily to reduce cortisol." });
    tips.push({ dot: "amber", text: "Try journaling your thoughts before bed — it clears mental load significantly." });
  } else if (scores.mental < 8) {
    tips.push({ dot: "amber", text: "Mental health is moderate. Reduce screen time 1 hr before sleep for better focus." });
  }
 
  if (scores.emotional < 5) {
    tips.push({ dot: "rose",  text: "Emotional score is low. Connect with a friend or loved one today." });
    tips.push({ dot: "amber", text: "Consider speaking with a wellness coach — book a free consultation." });
  }
 
  if (scores.physical >= 8 && scores.mental >= 8 && scores.emotional >= 8) {
    tips.push({ dot: "", text: "Excellent scores! Maintain your routine and continue tracking weekly." });
  }
 
  if (tips.length === 0) {
    tips.push({ dot: "", text: "You're doing well overall. Focus on consistency and book a check-in soon." });
  }
 
  return tips.slice(0, 5);
};
 