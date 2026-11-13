// The four action levels, from "all good" up to "get help now", written in plain words.
// rank decides which level wins when several findings apply.

export const TIERS = {
  nominal: {
    id: 'nominal',
    rank: 0,
    color: 'green',
    label: 'All good',
    who: "No one. You're doing fine.",
    text: 'Everything looks normal today. Keep up your daily routine.',
  },
  self: {
    id: 'self',
    rank: 1,
    color: 'green',
    label: 'Keep an eye on it',
    who: 'Just you',
    text: 'Something moved a little. Try the tips below and check again tomorrow.',
  },
  cmo: {
    id: 'cmo',
    rank: 2,
    color: 'yellow',
    label: 'Tell your crew medic',
    who: 'Your crew medic (the crew member trained in medicine)',
    text: "This has been building for a few days. Share today's report with your crew medic before the end of your shift.",
  },
  surgeon: {
    id: 'surgeon',
    rank: 3,
    color: 'red',
    label: 'Get help now',
    who: 'The doctor on the ground (flight surgeon)',
    text: 'A reading needs attention right away. Start the onboard medical steps and send your data to the ground doctor now.',
  },
}
