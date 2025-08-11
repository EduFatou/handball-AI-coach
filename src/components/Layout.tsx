import type { ReactNode } from 'react'
import LearnHandballLogo from '../assets/Learn Handball logo.svg'
import AthleraLogo from '../assets/Athlera-white.logo.png'

export type LayoutProps = {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <header
        className="border-b border-[#e5204c]/30 text-white"
        style={{
          backgroundImage: 'linear-gradient(300deg, #e5204c, #d56948 55%, #f7d871)',
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-center p-4 sm:p-5">
          <h1 className="flex items-center gap-3 sm:gap-4" aria-label="Athlera × Learn Handball">
            <img
              src={AthleraLogo}
              alt="Athlera"
              className="h-5 w-auto sm:h-6"
            />
            <span className="text-white/100">×</span>
            <img
              src={LearnHandballLogo}
              alt="Learn Handball"
              className="h-6 w-auto sm:h-7"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </h1>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">{children}</main>
      <footer
        className="text-center text-white"
        style={{
          backgroundImage: 'linear-gradient(300deg, #e5204b, #8f2668)',
        }}
      >
        <div className="mx-auto max-w-5xl p-4">
          <p className="text-xs md:text-sm">Developed by <strong>Edu Fatou</strong>. 2025</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
