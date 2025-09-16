import type { ReactNode } from 'react'
import handballVideo from '../assets/handball_video.mp4';

export type LayoutProps = {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col text-white relative">
      {/* Full-screen background video with overlay */}
      <div className="fixed top-0 left-0 w-full h-full -z-20 overflow-hidden">
        <video
          className="w-full h-full object-cover blur-[8px] opacity-[0.4]"
          src={handballVideo}
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>
      {/* Global animated gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-30 bg-[radial-gradient(circle_at_20%_20%,#ff8ca6_0%,transparent_40%),radial-gradient(circle_at_80%_30%,#ffcf70_0%,transparent_45%),radial-gradient(circle_at_60%_80%,#a347ff_0%,transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 -z-40 bg-gradient-to-br from-[#3d0d2c] via-[#1e0f2a] to-[#090c1a] opacity-95" />
      <div className="pointer-events-none absolute inset-0 -z-10 mix-blend-overlay bg-[linear-gradient(115deg,rgba(255,255,255,0.08)_0%,transparent_60%),linear-gradient(245deg,rgba(255,255,255,0.04)_0%,transparent_70%)]" />

  {/* Header glass panel */}
  <header className="sticky top-0 z-40 w-full supports-[position:sticky]:sticky supports-[position:sticky]:top-0">
        <div className="relative flex items-center justify-between gap-6 px-5 md:px-10 h-16 md:h-20 backdrop-blur-xl bg-white/6 border-b border-white/15 [@supports(not(position:sticky))]:fixed [@supports(not(position:sticky))]:top-0 [@supports(not(position:sticky))]:left-0 [@supports(not(position:sticky))]:right-0">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="Handball Analyzer" className="h-8 w-8" />
            <span className="hidden sm:inline-block text-sm font-medium tracking-wider text-white/70">HANDBALL TECHNIQUE ANALYZER</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://edufatou.is-a.dev/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Contact</a>
          </div>
          <div className="pointer-events-none absolute inset-0 opacity-[0.15] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.6)_0%,transparent_70%)]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-transparent opacity-60" />
        </div>
      </header>

      {/* Main content area with vertical rhythm */}
      <main className="mx-auto w-[min(96%,1480px)] flex-1 py-10 md:py-14 space-y-10">
        {children}
      </main>

  <footer className="mt-16 bg-white text-gray-900 border-t border-gray-200/70">
        <div className="mx-auto w-[min(96%,1480px)] py-10 md:py-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <img src="/favicon.png" alt="Handball Analyzer" className="h-8 w-8" />
              <span className="text-sm font-semibold tracking-wide text-gray-800">HANDBALL TECHNIQUE ANALYZER</span>
            </div>
            <p className="text-sm text-gray-600 max-w-xs md:max-w-sm leading-relaxed">Elevating training feedback with AI-driven, coach-grade insights for athletes and teams.</p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-4">
            <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
              <a href="https://edufatou.is-a.dev/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">Contact</a>
            </nav>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">© 2025 Edu Fatou</p>
          </div>
        </div>
      </footer>
  </div>
  )
}

export default Layout
