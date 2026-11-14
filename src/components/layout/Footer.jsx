export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className=" text-center">
      <p className="text-sm text-muted sm:text-base">
        © {year} Strelka Space App. All rights reserved.
      </p>
    </footer>
  )
}