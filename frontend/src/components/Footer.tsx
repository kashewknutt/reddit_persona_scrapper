// components/Footer.tsx
export default function Footer() {
  return (
    <footer className="text-center py-8 text-slate-500 text-sm font-sans bg-slate-50 border-t border-slate-200">
      &copy; {new Date().getFullYear()} Reddit<span className="text-emerald-500 font-semibold">Profiler</span> — Built with love by{' '}
      <a
        href="https://portfolio-rajatdisawal.vercel.app"
        className="underline text-emerald-600 hover:text-emerald-700 transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        Rajat Disawal
      </a>
    </footer>
  )
}
