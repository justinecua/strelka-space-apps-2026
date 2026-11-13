// NASA Human Research Program studies related to each body region, summarized in our own words.
// Shown in a collapsed "NASA research on this" section on the Body page.

export const RESEARCH = [
  {
    id: 'archer',
    name: 'ARCHeR (Artemis II)',
    summary: 'Wrist devices tracked the crew’s sleep, activity and well-being on the trip around the Moon.',
    regions: ['brain', 'muscles'],
  },
  {
    id: 'standard-measures',
    name: 'Standard Measures',
    summary: 'The same set of body and mind measurements is collected from every crew member over time.',
    regions: ['brain', 'heart'],
  },
  {
    id: 'space-gardening',
    name: 'Space Gardening',
    summary: 'Asks whether growing fresh vegetables helps crews cope with isolation.',
    regions: ['brain'],
  },
  {
    id: 'brain-fluid-pressure',
    name: 'Brain Fluid Pressure',
    summary: 'Studies how fluid pressure inside the skull relates to eye and brain changes.',
    regions: ['eyes'],
  },
  {
    id: 'b-complex',
    name: 'B-Complex',
    summary: 'Tests whether a daily B vitamin can prevent or reduce eye and brain changes.',
    regions: ['eyes'],
  },
  {
    id: 'thigh-cuff',
    name: 'Thigh Cuff',
    summary: 'Tests whether tight cuffs on the thighs keep fluid in the legs and protect the eyes.',
    regions: ['eyes'],
  },
  {
    id: 'spinal-fluid-biomarkers',
    name: 'Spinal Fluid Biomarkers',
    summary: 'Looks for markers in spinal fluid linked to eye and brain changes.',
    regions: ['eyes'],
  },
  {
    id: 'manual-piloting',
    name: 'Simulating Manual Piloting',
    summary: 'Tests how gravity changes affect an astronaut’s ability to fly a Moon landing.',
    regions: ['ear'],
  },
  {
    id: 'immune-biomarkers',
    name: 'Immune Biomarkers (Artemis II)',
    summary: 'Blood and saliva samples showed how deep space changes the immune system.',
    regions: ['immune'],
  },
  {
    id: 'altered-immunity',
    name: 'Altered Immunity',
    summary: 'Blood, saliva and urine samples tracked immune changes in long missions.',
    regions: ['immune'],
  },
  {
    id: 'veggie-monitoring',
    name: 'Veggie Monitoring',
    summary: 'Checks for microbes growing on space plant hardware to keep crews safe.',
    regions: ['immune'],
  },
  {
    id: 'venous-haemostasis',
    name: 'Venous Haemostasis',
    summary: 'Studies why blood flow and clotting change in space.',
    regions: ['heart'],
  },
  {
    id: 'food-acceptability',
    name: 'Food Acceptability',
    summary: 'Tracks how long missions change how appealing space food is.',
    regions: ['gut'],
  },
  {
    id: 'food-physiology',
    name: 'Food Physiology',
    summary: 'Tests whether a better diet helps the body adapt to space.',
    regions: ['gut'],
  },
  {
    id: 'zero-t2',
    name: 'Zero T2',
    summary: 'Studies how exercising without a treadmill affects health before deep-space missions.',
    regions: ['bones', 'muscles'],
  },
  {
    id: 'spinal-health',
    name: 'Spinal Health',
    summary: 'Spine scans guide ways to fight bone and muscle loss.',
    regions: ['bones'],
  },
]

export function researchForRegion(regionId) {
  return RESEARCH.filter((study) => study.regions.includes(regionId))
}
