// The four check-ins. Each one is a list of sections, and each section a list of fields.
// Field kinds: indicator (a health reading with live status), number, scale (1–5), choice (pick one),
// toggles (pick any), symptoms (the symptom list), datetime, text and textarea.
// Morning and before-sleep are required daily; post-exercise and symptom reports can be sent any time.

const FATIGUE_LABELS = ['Rested', 'Slightly tired', 'Tired', 'Very tired', 'Exhausted']
const SEVERITY_LABELS = ['Very mild', 'Mild', 'Moderate', 'Severe', 'Very severe']

export const SYMPTOM_REPORT_OPTIONS = [
  { id: 'headache', label: 'Headache' },
  { id: 'dizziness', label: 'Dizziness' },
  { id: 'nausea', label: 'Nausea' },
  { id: 'vision', label: 'Blurred vision' },
  { id: 'chestpain', label: 'Chest pain' },
  { id: 'breath', label: 'Shortness of breath' },
  { id: 'backpain', label: 'Back pain' },
  { id: 'musclepain', label: 'Muscle pain' },
  { id: 'tired', label: 'Fatigue' },
  { id: 'congestion', label: 'Stuffy nose or congestion' },
  { id: 'rash', label: 'Skin rash' },
  { id: 'other', label: 'Other' },
]

export const CHECKIN_TYPES = {
  morning: {
    id: 'morning',
    submitLabel: 'Submit morning check-in',
    title: 'Morning check-in',
    short: 'Morning',
    when: 'After waking up',
    required: true,
    icon: 'sun',
    purpose: 'How your body woke up, and whether it is ready for the day.',
    sections: [
      { title: 'Heart', fields: [{ key: 'hr', kind: 'indicator', required: true }, { key: 'sbp', kind: 'indicator', required: true }, { key: 'dbp', kind: 'indicator', required: true }] },
      {
        title: 'Breathing & temperature',
        fields: [{ key: 'spo2', kind: 'indicator', required: true }, { key: 'resp', kind: 'indicator', required: true }, { key: 'temp', kind: 'indicator', required: true }],
      },
      { title: 'Sleep', fields: [{ key: 'sleep', kind: 'indicator', required: true }, { key: 'sleepQuality', kind: 'indicator', required: true }] },
      { title: 'Blood sugar', optional: true, fields: [{ key: 'glucose', kind: 'indicator' }] },
    ],
  },

  exercise: {
    id: 'exercise',
    submitLabel: 'Submit exercise check-in',
    title: 'Post-exercise check-in',
    short: 'Post-exercise',
    when: 'After a workout',
    required: false,
    icon: 'muscle',
    purpose: 'How hard the session was and how well you are recovering.',
    sections: [
      {
        title: 'Session',
        fields: [
          {
            key: 'exerciseType',
            kind: 'choice',
            label: 'Exercise type',
            required: true,
            options: [
              { id: 'treadmill', label: 'Treadmill' },
              { id: 'cycle', label: 'Cycle' },
              { id: 'resistive', label: 'Resistive (weights)' },
              { id: 'other', label: 'Other' },
            ],
          },
          { key: 'duration', kind: 'number', label: 'Duration', unit: 'min', min: 1, max: 300, required: true },
        ],
      },
      {
        title: 'Recovery',
        fields: [
          { key: 'hrPost', kind: 'number', label: 'Heart rate right after exercise', unit: 'bpm', min: 40, max: 230, required: true },
          { key: 'hrRecovery', kind: 'number', label: 'Heart rate 1 minute later', hint: 'Rest for one minute, then measure again.', unit: 'bpm', min: 40, max: 230, required: true },
          { key: 'fatigue', kind: 'scale', label: 'Fatigue level', labels: FATIGUE_LABELS, required: true },
          {
            key: 'warnings',
            kind: 'toggles',
            label: 'Did you have any of these?',
            hint: 'Leave empty if not.',
            options: [
              { id: 'dizziness', label: 'Dizziness' },
              { id: 'breath', label: 'Trouble breathing' },
            ],
          },
        ],
      },
    ],
  },

  evening: {
    id: 'evening',
    submitLabel: 'Submit before-sleep check-in',
    title: 'Before-sleep check-in',
    short: 'Before sleep',
    when: 'Before going to sleep',
    required: true,
    icon: 'moon',
    purpose: 'How your body and mind feel at the end of the day.',
    sections: [
      {
        title: 'How you feel',
        fields: [
          { key: 'hrEvening', kind: 'indicator', indicator: 'hr', label: 'Heart rate', required: true },
          { key: 'fatigue', kind: 'indicator', required: true },
          { key: 'stress', kind: 'indicator', required: true },
          { key: 'mood', kind: 'indicator', label: 'Overall condition', required: true },
        ],
      },
      {
        title: 'Symptoms today',
        fields: [
          {
            key: 'headDizzy',
            kind: 'toggles',
            label: 'Headache or dizziness?',
            hint: 'Leave empty if not.',
            options: [
              { id: 'headache', label: 'Headache' },
              { id: 'dizziness', label: 'Dizziness' },
            ],
          },
          { key: 'symptoms', kind: 'symptoms', label: 'Anything else during the day?', exclude: ['headache', 'dizziness'] },
        ],
      },
      { title: 'Water', optional: true, fields: [{ key: 'water', kind: 'indicator' }] },
    ],
  },

  symptom: {
    id: 'symptom',
    submitLabel: 'Submit symptom report',
    title: 'Symptom report',
    short: 'Symptom',
    when: 'When something feels off',
    required: false,
    icon: 'body',
    purpose: 'Report anything unusual as soon as you notice it.',
    sections: [
      {
        title: 'What is it?',
        fields: [
          { key: 'symptom', kind: 'choice', label: 'Symptom', options: SYMPTOM_REPORT_OPTIONS, required: true },
          { key: 'startedAt', kind: 'datetime', label: 'When did it start?', required: true, defaultNow: true },
          { key: 'severity', kind: 'scale', label: 'How bad is it?', labels: SEVERITY_LABELS, required: true },
          { key: 'location', kind: 'text', label: 'Where does it hurt?', placeholder: 'e.g. left side of the head' },
          { key: 'description', kind: 'textarea', label: 'What happened?', placeholder: 'What were you doing when it started?', requiredIf: { symptom: 'other' } },
        ],
      },
      {
        title: 'Vital signs',
        optional: true,
        collapsed: true,
        fields: ['hr', 'sbp', 'dbp', 'spo2', 'resp', 'temp'].map((key) => ({ key, kind: 'indicator' })),
      },
      { title: 'Notes', optional: true, fields: [{ key: 'notes', kind: 'textarea', label: 'Anything else', placeholder: 'Optional' }] },
    ],
  },
}

export const CHECKIN_TYPE_LIST = Object.values(CHECKIN_TYPES)

export function allFields(type) {
  return type.sections.flatMap((section) => section.fields)
}
