// "Step 2 of 3" label, a progress bar and the step title.

const TOTAL_STEPS = 3

export default function StepHeader({ step, title, text }) {
  return (
    <div className="text-center">
      <p className="text-muted">
        Step {step} of {TOTAL_STEPS}
      </p>
      <div className="mt-2 flex gap-1.5">
        {[1, 2, 3].map((number) => (
          <span key={number} className={`h-2 flex-1 rounded-full ${number <= step ? 'bg-good' : 'bg-field'}`} />
        ))}
      </div>
      <h1 className="mt-6 text-5xl">{title}</h1>
      {text && <p className="mt-2 text-muted">{text}</p>}
    </div>
  )
}
