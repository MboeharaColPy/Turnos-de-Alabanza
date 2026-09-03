import { useState, useEffect, useCallback } from 'react';
import { registerSW } from 'virtual:pwa-register';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWA() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateFunction, setUpdateFunction] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  // Install state
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Detect if running in standalone mode (already installed PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // 2. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // 3. Register Service Worker with vite-plugin-pwa
    let refreshing = false;
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        console.log('[PWA] Nuevo Service Worker activado. Recargando para aplicar cambios...');
        window.location.reload();
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    }

    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('[PWA] Nueva versión detectada disponible para actualizar');
        setNeedRefresh(true);
      },
      onOfflineReady() {
        console.log('[PWA] Aplicación lista para funcionar sin conexión');
        setOfflineReady(true);
      },
      onRegisteredSW(swUrl, r) {
        console.log('[PWA] Service Worker registrado en:', swUrl);
        if (r) {
          // Chequeo inmediato al iniciar la app
          r.update().catch(err => console.log('[PWA] Chequeo inicial:', err));

          // Si ya hay un worker esperando en segundo plano, activarlo
          if (r.waiting) {
            r.waiting.postMessage({ type: 'SKIP_WAITING' });
            setNeedRefresh(true);
          }

          // Chequeo periódico cada 60 segundos
          const interval = setInterval(() => {
            r.update().catch(err => console.log('[PWA] Error al chequear actualización periódica:', err));
          }, 60 * 1000);

          // Chequeo cuando la app pasa al primer plano (ideal para móviles instalados)
          const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
              r.update().catch(err => console.log('[PWA] Error al chequear en visibilidad:', err));
            }
          };

          // Chequeo cuando la ventana vuelve a tener foco
          const onFocus = () => {
            r.update().catch(err => console.log('[PWA] Error al chequear actualización en foco:', err));
          };

          // Chequeo cuando el dispositivo recupera conexión a internet
          const onOnline = () => {
            r.update().catch(err => console.log('[PWA] Error al chequear actualización online:', err));
          };

          document.addEventListener('visibilitychange', onVisibilityChange);
          window.addEventListener('focus', onFocus);
          window.addEventListener('online', onOnline);

          return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('online', onOnline);
          };
        }
      },
      onRegisterError(error) {
        console.warn('[PWA] Error en registro de Service Worker:', error);
      },
    });

    setUpdateFunction(() => updateSW);

    // 4. Capture Install Prompt event for custom UI button
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Update App to newest version immediately
  const updateApp = useCallback(async () => {
    if (updateFunction) {
      await updateFunction(true);
    } else {
      window.location.reload();
    }
  }, [updateFunction]);

  // Dismiss update prompt temporarily
  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
  }, []);

  // Manual Check for Updates
  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    setIsCheckingUpdate(true);
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            setNeedRefresh(true);
            setIsCheckingUpdate(false);
            return true;
          }
          await registration.update();
          // Wait a moment for worker state change
          await new Promise(r => setTimeout(r, 1200));
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            setNeedRefresh(true);
            setIsCheckingUpdate(false);
            return true;
          }
        }
      }
    } catch (e) {
      console.warn('[PWA] Error buscando actualizaciones manualmente:', e);
    }
    setIsCheckingUpdate(false);
    return false;
  }, []);

  // Install app prompt
  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  return {
    needRefresh,
    offlineReady,
    isCheckingUpdate,
    updateApp,
    dismissUpdate,
    checkForUpdates,
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    installApp,
  };
}
