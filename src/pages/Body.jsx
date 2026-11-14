import { REGIONS, REGION_BY_ID } from '../data/regions.js'
import BodyFigure from '../components/body/BodyFigure.jsx'
import RegionList from '../components/body/RegionList.jsx'
import RegionDetail from '../components/body/RegionDetail.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'

// One line under the heading, e.g. "1 critical, 2 to watch. Everything else is normal."
function summary(regionStatus) {
  const count = (status) => REGIONS.filter((region) => regionStatus[region.id] === status).length
  const red = count('red')
  const yellow = count('yellow')
  if (!red && !yellow) return 'Every body system looks normal today.'
  const parts = []
  if (red) parts.push(`${red} critical`)
  if (yellow) parts.push(`${yellow} to watch`)
  return `${parts.join(', ')}. Everything else is normal or not measured.`
}

export default function Body({ result, regionId, onSelectRegion, onStartCheckIn }) {
  const region = REGION_BY_ID[regionId] ?? REGIONS[0]

  if (!result.latest) {
    return (
      <Card className="text-center">
        <p className="text-2xl">No readings yet</p>
        <p className="mt-1 text-muted">Do your first check-in to see your body status here.</p>
        <Button onClick={onStartCheckIn} className="mt-5">
          Start check-in
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl sm:text-6xl">Body</h1>
        <p className="mt-2 text-muted">{summary(result.regionStatus)}</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.1fr_1fr]">
        <Card tone="mint" padding="p-6 sm:p-8" className="lg:sticky lg:top-6">
          <div className="grid items-center gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,17rem)]">
            <BodyFigure regionStatus={result.regionStatus} selectedId={region.id} onSelect={onSelectRegion} />
            <RegionList regionStatus={result.regionStatus} selectedId={region.id} onSelect={onSelectRegion} />
          </div>
        </Card>

        <RegionDetail key={region.id} region={region} status={result.regionStatus[region.id]} result={result} />
      </div>
    </div>
  )
}
