// What Strelka asks for each check-in field in simulation mode, one question at a time.
// A check-in can word a question its own way (keyed "type.field"), e.g. the morning heart rate is a resting one.

const QUESTIONS = {
  'morning.hr': 'What is your resting heart rate?',
  hr: 'What is your heart rate?',
  hrEvening: 'What is your heart rate now?',
  sbp: 'What is your blood pressure? You can say both numbers, like 118 over 76.',
  dbp: 'And the bottom number of your blood pressure?',
  spo2: 'What is your oxygen level, in percent?',
  resp: 'How many breaths do you take in one minute?',
  temp: 'What is your body temperature?',
  sleep: 'How long did you sleep?',
  sleepQuality: 'How well did you sleep, from 1 to 5?',
  glucose: 'What is your blood sugar? Say skip if you did not measure it.',
  exerciseType: 'What exercise did you do? Treadmill, cycle, weights or other?',
  duration: 'How many minutes did you exercise?',
  hrPost: 'What was your heart rate right after exercise?',
  hrRecovery: 'Rest for one minute. What is your heart rate now?',
  fatigue: 'How tired are you, from 1 to 5?',
  warnings: 'Did you feel dizzy or have trouble breathing? Say none if not.',
  stress: 'How stressed do you feel, from 1 to 5?',
  mood: 'How do you feel overall, from 1 to 5?',
  headDizzy: 'Did you have a headache or dizziness today? Say none if not.',
  symptoms: 'Anything else during the day? Say the symptoms, or none.',
  water: 'How much water did you drink today, in liters? Say skip if you are not sure.',
  symptom: 'What symptom do you have?',
  startedAt: 'When did it start? Say next if it started just now.',
  severity: 'How bad is it, from 1 to 5?',
  location: 'Where does it hurt? Say skip if it does not hurt in one place.',
  description: 'What happened? What were you doing when it started?',
  notes: 'Anything else to add? Say skip if not.',
}

export function questionFor(type, field, label) {
  return QUESTIONS[`${type.id}.${field.key}`] ?? QUESTIONS[field.key] ?? `${label}?`
}
