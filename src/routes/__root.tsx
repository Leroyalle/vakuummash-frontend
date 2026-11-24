import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Footer } from '@/components/layout/Footer'
import { FloatingContact } from '@/components/layout/FloatingContact'
import { Header } from '@/components/layout/Header'
import { PageTransition } from '@/components/motion/PageTransition'
import { ModalsProvider } from '@/components/forms/ModalsContext'
import { buttonClass } from '@/components/ui/buttonStyles'
import { ToTop } from '@/components/motion/ToTop'
import { SmoothScroll } from '@/components/motion/SmoothScroll'
import { Gauge404 } from '@/components/illustrations/Gauge404'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  const admin = useRouterState({ select: (s) => s.location.pathname.startsWith('/admin') })
  if (admin) return <ModalsProvider><Outlet /></ModalsProvider>
  return (
    <ModalsProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-sm focus:bg-white focus:px-3 focus:py-2">К содержимому</a>
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main id="main" className="flex-1"><PageTransition><Outlet /></PageTransition></main>
        <Footer />
      </div>
      <FloatingContact />
      <ToTop />
      <SmoothScroll />
    </ModalsProvider>
  )
}

export function NotFound() {
  return (
    <div className="container-page grid items-center gap-8 py-20 md:grid-cols-2">
      <div>
        <h1 className="text-4xl md:text-5xl">Страница не найдена</h1>
        <p className="mt-3 max-w-md text-ink-600">Возможно, адрес изменился или страница была удалена. Вернитесь на главную или перейдите в каталог.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/" className={buttonClass('primary', 'lg')}>На главную</Link>
          <Link to="/catalog" className={buttonClass('outline', 'lg')}>Открыть каталог</Link>
        </div>
      </div>
      <Gauge404 className="mx-auto w-full max-w-sm" />
    </div>
  )
}
