function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function calculateAyurvedaInsight(data) {
  const sleep = Number(data.sleep) || 6;
  const water = Number(data.water) || 6;
  const exercise = Number(data.exercise) || 2;
  const meals = Number(data.meals) || 3;
  const stress = Number(data.stress) || 5;
  const energy = Number(data.energy) || 5;
  const mood = data.mood || "Neutral";

  const vata = clamp(
    (sleep < 6 ? 20 : sleep < 7 ? 10 : 0)
      + (meals < 3 ? 16 : 4)
      + (stress > 7 ? 22 : stress > 5 ? 12 : 4)
      + (mood === "Anxious" || mood === "Sad" ? 18 : mood === "Neutral" ? 8 : 3)
      + (energy < 5 ? 14 : energy < 7 ? 7 : 3)
      + (water < 6 ? 10 : 3),
    0,
    100
  );

  const pitta = clamp(
    (stress > 7 ? 24 : stress > 5 ? 14 : 6)
      + (data.focus === "high" ? 10 : data.focus === "mid" ? 6 : 3)
      + (sleep < 6 ? 12 : 4)
      + (water < 6 ? 10 : 3)
      + (exercise >= 5 ? 8 : exercise >= 3 ? 5 : 2)
      + (mood === "Anxious" ? 12 : mood === "Joyful" ? 6 : 4),
    0,
    100
  );

  const kapha = clamp(
    (exercise <= 1 ? 22 : exercise <= 2 ? 12 : 4)
      + (sleep > 9 ? 16 : sleep > 8 ? 10 : 4)
      + (energy < 5 ? 16 : energy < 7 ? 9 : 4)
      + (mood === "Neutral" || mood === "Sad" ? 10 : 4)
      + (meals > 3 ? 8 : 4),
    0,
    100
  );

  const entries = [
    ["Vata", vata],
    ["Pitta", pitta],
    ["Kapha", kapha],
  ].sort((a, b) => b[1] - a[1]);

  const dominantDosha = entries[0][0];
  const spread = entries[0][1] - entries[2][1];
  const balanceScore = clamp(100 - spread, 0, 100);

  const guidanceByDosha = {
    Vata: {
      label: "Vata may be elevated",
      summary: "Your pattern suggests irregular rhythm. Stabilize with routine and calming habits.",
      routine: ["Keep meal timing consistent", "Prioritize 7 to 8 hours sleep", "Use a 5-minute breathing pause in evening"],
    },
    Pitta: {
      label: "Pitta may be elevated",
      summary: "Your pattern suggests high intensity and pressure. Add cooling pauses and recovery blocks.",
      routine: ["Add short mid-day recovery breaks", "Hydrate consistently through day", "Avoid late-night work sprint"],
    },
    Kapha: {
      label: "Kapha may be elevated",
      summary: "Your pattern suggests low activation. Add movement and energizing structure.",
      routine: ["Start day with movement", "Keep sleep and wake time steady", "Use shorter, more active breaks"],
    },
  };

  return {
    dominantDosha,
    balanceScore,
    scores: { vata, pitta, kapha },
    ...guidanceByDosha[dominantDosha],
    note: "Indicative lifestyle signal based on your assessment, not a medical diagnosis.",
  };
}

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
  const ayurveda = calculateAyurvedaInsight(data);
 
  return {
    physical,
    mental,
    emotional,
    overall,
    ayurveda,
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

  if (scores?.ayurveda?.dominantDosha === "Vata") {
    tips.push({ dot: "amber", text: "Ayurveda insight: Vata pattern is high. Keep fixed meal/sleep timing and use calming evening routines." });
  }

  if (scores?.ayurveda?.dominantDosha === "Pitta") {
    tips.push({ dot: "amber", text: "Ayurveda insight: Pitta pattern is high. Add cooling breaks, hydration, and avoid late intense work sessions." });
  }

  if (scores?.ayurveda?.dominantDosha === "Kapha") {
    tips.push({ dot: "amber", text: "Ayurveda insight: Kapha pattern is high. Use energizing movement blocks to avoid sluggishness." });
  }
 
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
 