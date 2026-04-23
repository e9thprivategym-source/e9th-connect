import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { initializePWA } from "./lib/pwa";
import { ToastProvider } from "./components/Toast";
import "./index.css";
import { trpc } from "./lib/trpc"; // 修正: インポートを追加


// PWA初期化
if ('serviceWorker' in navigator) {
  initializePWA().catch(err => console.error('[PWA] Initialization failed:', err));
}


const queryClient = new QueryClient();


const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;


  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;


  if (!isUnauthorized) return;


  window.location.href = getLoginUrl();
};


queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});


queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});


/**
 * 本番環境（Vercel）対応の API URL 構築ロジック
 * - ローカル開発: http://localhost:5173/api/trpc
 * - Vercel本番: https://e9th-connect.vercel.app/api/trpc
 */
const getApiUrl = ( ) => {
  if (typeof window === "undefined") {
    return "/api/trpc";
  }
  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}/api/trpc`;
};

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: getApiUrl( ),  // ← 動的に URL を構築
      transformer: superjson,
    }),
  ],
});



createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
