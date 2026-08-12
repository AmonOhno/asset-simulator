import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from '@mobile-components/ErrorBoundary'
import { isMobileDevice } from './utils/deviceDetect'

const App = isMobileDevice()
  ? lazy(() => import('@mobile/App'))
  : lazy(() => import('./DesktopApp'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={null}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
)
