import React from 'react';
import ReactDOM from 'react-dom/client';
import MobileApp from './MobileApp';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <MobileApp />
  </React.StrictMode>
);
