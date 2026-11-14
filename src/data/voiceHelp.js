// Everything you can say, grouped by where it works. Shown when you say "help" or "what can I say".
// Keep this in step with lib/voiceCommands.js.

export const VOICE_HELP = [
  {
    title: 'Voice',
    phrases: ['enable voice command', 'disable voice command', 'turn off the microphone', 'help'],
  },
  {
    title: 'Getting around',
    phrases: ['go to today', 'open check-in', 'go to body', 'open history', 'relax', 'go back', 'go to the home page', 'scroll down', 'go to the top'],
  },
  {
    title: 'Today',
    phrases: [
      'open the heart card',
      'expand sleep and mood',
      'full screen blood',
      'open mission log',
      'open do next',
      'open readings',
      'close',
      'list view',
      'grid view',
      'show the glucose chart',
      'mark 1 done',
      'mark all done',
      'share report',
      'copy report',
      'why compare with my normal',
    ],
  },
  {
    title: 'Check-in',
    phrases: [
      'morning',
      'post-exercise',
      'before sleep',
      'symptom',
      'heart rate 62',
      'blood pressure 118 over 76',
      'I slept 7 hours',
      'treadmill for 30 minutes',
      'severity 3',
      'review',
      'submit',
      'cancel',
      'clear the form',
    ],
  },
  {
    title: 'Body',
    phrases: ['show brain', 'open lungs', 'go to eyes', 'what is space radiation', 'tell me about isolation'],
  },
  {
    title: 'History',
    phrases: ['show day 5', 'edit day 5', 'add day 5', 'delete day 5', 'add a missed day', 'show more', 'export PDF', 'export day 5', 'export all'],
  },
  {
    title: 'Relax',
    phrases: ['start breathing', 'stop breathing'],
  },
  {
    title: 'Settings',
    phrases: ['dark mode', 'light mode', 'toggle theme', 'switch to Mars surface', 'open my profile', 'log out', 'exit demo', 'yes', 'no'],
  },
]
