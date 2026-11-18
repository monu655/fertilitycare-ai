// A fixed menu of small, practical habit goals. The person chooses; nothing here is a medical target.
export const GOALS = [
  { key: "bedtime_routine", label: "Keep a similar bedtime", hint: "Go to bed around the same time on these days.", topic: "sleep" },
  { key: "wind_down", label: "Wind down before sleep", hint: "Screens off and a calm routine for 30 minutes before bed.", topic: "sleep" },
  { key: "move_daily", label: "Move on purpose", hint: "Any movement you enjoy, such as a walk, for about 20 minutes.", topic: "exercise" },
  { key: "stand_breaks", label: "Break up long sitting", hint: "Stand up and move for a few minutes after long sitting.", topic: "exercise" },
  { key: "fruit_veg", label: "Add fruit or vegetables", hint: "Include some fruit or vegetables in your main meals.", topic: "nutrition" },
  { key: "home_meals", label: "Cook one meal at home", hint: "Choose a meal made from basic ingredients.", topic: "nutrition" },
  { key: "pause_break", label: "Take a relaxing pause", hint: "Ten minutes for something that helps you relax.", topic: "stress" },
  { key: "cooler_habits", label: "Go easy on extra heat", hint: "Shorter hot baths and saunas, and the laptop off your lap.", topic: "heat" },
  { key: "log_days", label: "Log your day", hint: "Fill in the tracker on these days.", topic: "habits" },
] as const;

export type GoalKey = (typeof GOALS)[number]["key"];
export const GOAL_KEYS = GOALS.map((g) => g.key) as [GoalKey, ...GoalKey[]];
export const goalByKey = (key: string) => GOALS.find((g) => g.key === key);

// Suggest goals only from the topics the observations touched. This is a convenience, not advice about results.
export function suggestGoals(topicIds: string[], taken: string[]): (typeof GOALS)[number][] {
  const wanted = GOALS.filter((g) => topicIds.includes(g.topic) && !taken.includes(g.key));
  const fallback = GOALS.filter((g) => ["log_days", "move_daily", "fruit_veg"].includes(g.key) && !taken.includes(g.key));
  return (wanted.length > 0 ? wanted : fallback).slice(0, 3);
}
