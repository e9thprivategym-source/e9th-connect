/**
 * PWA (Progressive Web App) 初期化・管理モジュール
 * Service Worker の登録、インストールプロンプト管理、オフライン検出
 */

/**
 * Service Worker を登録
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    console.log('[PWA] Service Worker registered:', registration);

    // 更新チェック（1時間ごと）
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    // 新しいバージョンが利用可能になった時の通知
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // 新しいバージョンが利用可能
          console.log('[PWA] New version available');
          notifyUpdateAvailable();
        }
      });
    });

    return registration;
  } catch (err) {
    console.error('[PWA] Failed to register Service Worker:', err);
    return null;
  }
}

/**
 * インストールプロンプトを管理
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function setupInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('[PWA] Install prompt deferred');
    notifyInstallPromptReady();
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed');
    deferredPrompt = null;
  });
}

/**
 * インストールプロンプトを表示（ユーザーが明示的に呼び出す）
 */
export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.warn('[PWA] Install prompt not available');
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`[PWA] User response to install prompt: ${outcome}`);

  deferredPrompt = null;
  return outcome === 'accepted';
}

/**
 * インストール可能かどうかを判定
 */
export function isInstallable(): boolean {
  return deferredPrompt !== null;
}

/**
 * PWAがスタンドアロンモード（ホーム画面から起動）で実行中かを判定
 */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * オンライン/オフライン状態を監視
 */
export function setupOnlineStatusListener(callback: (isOnline: boolean) => void): void {
  const handleOnline = () => {
    console.log('[PWA] Online');
    callback(true);
  };

  const handleOffline = () => {
    console.log('[PWA] Offline');
    callback(false);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // 初期状態を通知
  callback(navigator.onLine);
}

/**
 * バックグラウンド同期をリクエスト
 */
export async function requestBackgroundSync(tag: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.warn('[PWA] Background Sync not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await (registration as any).sync.register(tag);
    console.log('[PWA] Background sync registered:', tag);
    return true;
  } catch (err) {
    console.error('[PWA] Failed to register background sync:', err);
    return false;
  }
}

/**
 * プッシュ通知の許可をリクエスト
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[PWA] Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    console.log('[PWA] Notification permission:', permission);
    return permission;
  }

  return Notification.permission;
}

/**
 * プッシュ通知を表示
 */
export async function showNotification(title: string, options?: NotificationOptions): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service Worker not available');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, options);
  } catch (err) {
    console.error('[PWA] Failed to show notification:', err);
  }
}

/**
 * IndexedDB にオフラインデータを保存
 */
export async function saveOfflineData(storeName: string, data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('e9th-connect', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const putRequest = store.put(data);

      putRequest.onerror = () => reject(putRequest.error);
      putRequest.onsuccess = () => resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
  });
}

/**
 * IndexedDB からオフラインデータを取得
 */
export async function getOfflineData(storeName: string, key?: any): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('e9th-connect', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);

      const getRequest = key ? store.get(key) : store.getAll();

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        resolve(key ? [getRequest.result] : getRequest.result);
      };
    };
  });
}

/**
 * IndexedDB からオフラインデータを削除
 */
export async function removeOfflineData(storeName: string, key: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('e9th-connect', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(key);

      deleteRequest.onerror = () => reject(deleteRequest.error);
      deleteRequest.onsuccess = () => resolve();
    };
  });
}

/**
 * 内部関数：インストール可能な状態を通知
 */
function notifyInstallPromptReady(): void {
  // イベントを発火させてコンポーネント側で購読できるようにする
  window.dispatchEvent(new CustomEvent('pwa-install-prompt-ready'));
}

/**
 * 内部関数：アップデート利用可能を通知
 */
function notifyUpdateAvailable(): void {
  window.dispatchEvent(new CustomEvent('pwa-update-available'));
}

/**
 * PWA初期化（アプリ起動時に呼び出す）
 */
export async function initializePWA(): Promise<void> {
  console.log('[PWA] Initializing...');

  // Service Worker を登録
  await registerServiceWorker();

  // インストールプロンプトをセットアップ
  setupInstallPrompt();

  // オンライン/オフライン状態を監視
  setupOnlineStatusListener((isOnline) => {
    if (isOnline) {
      // オンライン復帰時にバックグラウンド同期をリクエスト
      requestBackgroundSync('sync-meals');
    }
  });

  console.log('[PWA] Initialized');
}
