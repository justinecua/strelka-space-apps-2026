// The big white rounded frame around every screen. It always fills the full window height.

export default function AppFrame({ children }) {
  return (
    <div className="px-3 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] max-w-[1600px] flex-col rounded-[40px] bg-white p-5 sm:min-h-[calc(100dvh-4rem)] sm:p-10">
        {children}
      </div>
    </div>
  )
}
