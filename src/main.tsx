import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Ocultar suavemente el preloader inicial al montarse la aplicación
const preloader = document.getElementById('app-preloader');
if (preloader) {
  preloader.style.opacity = '0';
  preloader.style.transition = 'opacity 0.3s ease';
  setTimeout(() => {
    preloader.remove();
  }, 300);
}
