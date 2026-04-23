/**
 * LINE ログインボタンコンポーネント
 * 
 * ユーザーが LINE アカウントでログインできるボタンです。
 */

import { useEffect, useState } from 'react';
import { useToast } from './Toast';

interface LineLoginButtonProps {
  onLoginSuccess?: () => void;
  onLoginError?: (error: Error) => void;
  className?: string;
}

export function LineLoginButton({
  onLoginSuccess,
  onLoginError,
  className = '',
}: LineLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [liffReady, setLiffReady] = useState(false);
  const { showToast } = useToast();

  // LIFF SDK を初期化
  useEffect(() => {
    const initLIFF = async () => {
      try {
        const liffId = import.meta.env.VITE_LINE_LIFF_ID;
        if (!liffId) {
          console.warn('[LINE] LIFF ID not configured');
          return;
        }

        // LIFF SDK をロード
        const script = document.createElement('script');
        script.src = 'https://d.line-scdn.net/liff/edge/2/sdk.js';
        script.async = true;

        script.onload = async () => {
          try {
            await (window as any).liff.init({ liffId });
            setLiffReady(true);
            console.log('[LINE] LIFF initialized');
          } catch (error) {
            console.error('[LINE] Failed to initialize LIFF:', error);
          }
        };

        script.onerror = () => {
          console.error('[LINE] Failed to load LIFF SDK');
        };

        document.body.appendChild(script);
      } catch (error) {
        console.error('[LINE] Error initializing LIFF:', error);
      }
    };

    initLIFF();
  }, []);

  const handleLineLogin = async () => {
    try {
      setIsLoading(true);

      const liff = (window as any).liff;
      if (!liff || !liff.isLoggedIn()) {
        // LIFF ログインを実行
        liff.login();
        return;
      }

      // ID トークンを取得
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error('Failed to get ID token from LINE');
      }

      // バックエンドに送信
      const response = await fetch('/api/trpc/auth.lineLogin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with LINE');
      }

      showToast('LINE でログインしました', 'success');
      onLoginSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      console.error('[LINE] Login error:', err);
      showToast(`ログインエラー: ${err.message}`, 'error');
      onLoginError?.(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!liffReady) {
    return null;
  }

  return (
    <button
      onClick={handleLineLogin}
      disabled={isLoading}
      className={`
        flex items-center justify-center gap-2 px-6 py-3 rounded-lg
        bg-green-500 hover:bg-green-600 text-white font-semibold
        transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <span className="animate-spin">⟳</span>
          ログイン中...
        </>
      ) : (
        <>
          <span>💬</span>
          LINE でログイン
        </>
      )}
    </button>
  );
}
