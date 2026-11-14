// Advice shown when a reading is too high or too low.
// Keys are "<indicator id>_<high|low>".

export const ACTIONS = {
  hr_high: 'Rest for 10 minutes and measure again. Drink water and check for fever or pain.',
  hr_low: 'Measure again after moving gently. Report dizziness or fainting.',
  sbp_high: 'Re-measure after 5 minutes of rest. Limit salt and caffeine, and watch for headache or vision change.',
  sbp_low: 'Drink fluids and add salt as advised. Avoid sudden posture changes.',
  dbp_high: 'Re-measure after rest. If it stays high, let your crew medic know.',
  dbp_low: 'Drink fluids. Report light-headedness.',
  spo2_low: 'Re-measure on a warm finger. Check cabin O₂ and CO₂. Rest and breathe slowly.',
  temp_high: 'Rest, drink fluids and re-check in 4 hours. Limit close contact with crew.',
  temp_low: 'Re-measure. Add a layer and check cabin temperature.',
  glucose_high: 'Re-test fasting tomorrow. Review recent meals and stress.',
  glucose_low: 'Eat a fast-carbohydrate snack now, then re-test in 15 minutes.',
  sleep_low: "Protect tonight's 8.5-hour sleep window. Dim the lights an hour before.",
  mood_low: 'Take a break, call family or a friend, and tell someone you trust how you feel.',
  stress_high: 'Try a 5-minute breathing exercise. Ask if today\'s tasks can be rebalanced.',
  resp_high: 'Rest for 5 minutes and count again. Check your temperature and oxygen, and tell your crew medic if it stays high.',
  resp_low: 'Count again for a full minute. Tell your crew medic if you feel drowsy or confused.',
  sleepQuality_low: 'Check your sleep station for light, noise and airflow. Keep screens off for the last hour.',
  fatigue_high: 'Lighten your next task block if you can, take a short rest and drink water.',
  exercise_low: 'Get back to 90 minutes a day. Missed loading speeds up bone and muscle loss.',
}
