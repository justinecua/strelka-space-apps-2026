// A yes/no question in the app, used instead of the browser's confirm box so it can be answered by voice:
// "yes" or "confirm" does it, "no" or "cancel" keeps things as they are.

import { useVoiceEvent } from '../../lib/voiceEvents.js'
import Button from './Button.jsx'
import Modal from './Modal.jsx'

export default function ConfirmDialog({ title, text, confirmLabel = 'Yes', danger = false, onConfirm, onCancel }) {
  useVoiceEvent('answer', ({ yes }) => (yes ? onConfirm() : onCancel()))

  return (
    <Modal title={title} onClose={onCancel}>
      {text && <p className="mt-3 text-muted">{text}</p>}
      <p className="mt-3 text-sm text-muted">You can also say “yes” or “no”.</p>
      <div className="mt-8 flex flex-wrap justify-end gap-2">
        <Button variant="light" onClick={onCancel}>
          Cancel
        </Button>
        {danger ? (
          <button type="button" onClick={onConfirm} className="rounded-full bg-danger px-5 py-2.5 text-white transition hover:opacity-90">
            {confirmLabel}
          </button>
        ) : (
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        )}
      </div>
    </Modal>
  )
}
