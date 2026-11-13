export default function MeasureGuide({ indicator }) {
  return (
    <div className="fade-in mt-3 space-y-2 rounded-2xl bg-mint p-4 text-sm">
      <ol className="list-decimal space-y-1 pl-5">
        {indicator.howTo.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="text-muted">
        <span className="text-ink">Why it matters: </span>
        {indicator.why}
      </p>
      <p className="text-muted">
        <span className="text-ink">In space: </span>
        {indicator.spaceEffect}
      </p>
    </div>
  )
}
