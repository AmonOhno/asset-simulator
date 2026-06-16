import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { isMobileDevice } from './utils/deviceDetect';
const App = isMobileDevice()
    ? lazy(() => import('@mobile/App'))
    : lazy(() => import('./DesktopApp'));
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(Suspense, { fallback: null, children: _jsx(App, {}) }) }));
