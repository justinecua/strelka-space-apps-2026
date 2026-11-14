// The big white rounded frame around every screen. It always fills the full window height.

// withDock leaves room at the bottom for the fixed bottom navigation.
export default function AppFrame({ withDock = false, children }) {
  return (
    <div className={`px-3 pt-4 sm:px-6 sm:pt-8 ${withDock ? 'pb-28' : 'pb-4 sm:pb-8'}`}>
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] max-w-[1600px] flex-col rounded-[40px] bg-white p-5 sm:min-h-[calc(100dvh-4rem)] sm:p-10">
        {children}
      </div>
    </div>
  )
}
