/**
 * Google Business Profile OAuth 2.0 scaffold.
 *
 * Flow:
 *  1. User clicks "Connect GBP" → openGBPAuthPopup()
 *  2. Popup redirects to Google OAuth consent screen
 *  3. Google redirects back to our callback URL with ?code=...
 *  4. GBPCallback component captures the code, exchanges for token
 *  5. Token stored in localStorage with expiry
 *
 * This is a scaffold — no real API calls are made. The token exchange
 * would happen server-side in production. For dev, we simulate the
 * exchange after capturing the auth code.
 */

const GBP_STORAGE_KEY = "revaut-gbp-token";

// These would come from env in production
const GBP_CONFIG = {
  clientId: import.meta.env.VITE_GBP_CLIENT_ID || "YOUR_GBP_CLIENT_ID",
  redirectUri: `${window.location.origin}/auth/gbp/callback`,
  scopes: [
    "https://www.googleapis.com/auth/business.manage",
  ],
  authEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

export interface GBPToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // unix timestamp ms
  scope: string;
}

// Step 1: Build the OAuth URL and open popup/redirect
export function openGBPAuthPopup(): Window | null {
  const params = new URLSearchParams({
    client_id: GBP_CONFIG.clientId,
    redirect_uri: GBP_CONFIG.redirectUri,
    response_type: "code",
    scope: GBP_CONFIG.scopes.join(" "),
    access_type: "offline",
    prompt: "consent",
    state: crypto.randomUUID(),
  });

  const authUrl = `${GBP_CONFIG.authEndpoint}?${params.toString()}`;

  // Open popup (550x700 is standard for Google OAuth)
  const popup = window.open(
    authUrl,
    "gbp-oauth",
    "width=550,height=700,left=200,top=100"
  );

  return popup;
}

// Step 2: Simulate token exchange (would be server-side in production)
export async function exchangeCodeForToken(code: string): Promise<GBPToken> {
  // In production, this POST goes to YOUR backend which calls Google's token endpoint
  // with client_secret (never exposed to frontend). For dev, we simulate:
  console.log("[GBP OAuth] Exchanging code for token:", code);

  // Simulated token response
  const token: GBPToken = {
    accessToken: `simulated_access_${Date.now()}`,
    refreshToken: `simulated_refresh_${Date.now()}`,
    expiresAt: Date.now() + 3600 * 1000, // 1 hour from now
    scope: GBP_CONFIG.scopes.join(" "),
  };

  saveToken(token);
  return token;
}

// Step 3: Token persistence
export function saveToken(token: GBPToken): void {
  localStorage.setItem(GBP_STORAGE_KEY, JSON.stringify(token));
}

export function getToken(): GBPToken | null {
  try {
    const raw = localStorage.getItem(GBP_STORAGE_KEY);
    if (!raw) return null;
    const token: GBPToken = JSON.parse(raw);
    if (token.expiresAt < Date.now()) {
      // Token expired — in production, use refreshToken to get new access token
      console.log("[GBP OAuth] Token expired, needs refresh");
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function clearToken(): void {
  localStorage.removeItem(GBP_STORAGE_KEY);
}

export function isConnected(): boolean {
  return getToken() !== null;
}

// Step 4: Parse callback URL (used by the callback page/component)
export function parseCallbackParams(searchParams: URLSearchParams): {
  code: string | null;
  error: string | null;
  state: string | null;
} {
  return {
    code: searchParams.get("code"),
    error: searchParams.get("error"),
    state: searchParams.get("state"),
  };
}
