import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { isMobileDevice } from './utils/deviceDetect'

const App = isMobileDevice()
  ? lazy(() => import('@mobile/App'))
  : lazy(() => import('./DesktopApp'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <App />
    </Suspense>
  </StrictMode>,
)
