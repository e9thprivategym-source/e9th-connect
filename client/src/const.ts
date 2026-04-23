export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * LINE Login OAuth 2.1 の認可URLを生成する
 * VITE_LINE_CHANNEL_ID は LINE Developers Console の「チャネルID」を設定する
 */
export const getLoginUrl = () => {
  const clientId = import.meta.env.VITE_LINE_CHANNEL_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  if (!clientId) {
    console.error("[Auth] VITE_LINE_CHANNEL_ID is not set");
    return "/";
  }

  const url = new URL("https://access.line.me/oauth2/v2.1/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", "profile openid");

  return url.toString();
};
