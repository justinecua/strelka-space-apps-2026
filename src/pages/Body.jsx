import { REGIONS, REGION_BY_ID } from '../data/regions.js'
import BodyFigure from '../components/body/BodyFigure.jsx'
import RegionChips from '../components/body/RegionChips.jsx'
import RegionDetail from '../components/body/RegionDetail.jsx'
import StatusLegend from '../components/body/StatusLegend.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'

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
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="text-5xl sm:text-6xl">Body</h1>
        <RegionChips regionStatus={result.regionStatus} selectedId={region.id} onSelect={onSelectRegion} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card tone="mint" className="flex flex-col justify-between gap-6">
          <p className="text-muted">Tap a dot to see that part of the body.</p>
          <BodyFigure regionStatus={result.regionStatus} selectedId={region.id} onSelect={onSelectRegion} />
          <StatusLegend />
        </Card>

        <RegionDetail region={region} status={result.regionStatus[region.id]} result={result} />
      </div>
    </div>
  )
}
