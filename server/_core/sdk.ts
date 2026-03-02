import { ForbiddenError } from "@shared/_core/errors";
import axios, { type AxiosInstance } from "axios";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import type {
  ExchangeTokenRequest,
  ExchangeTokenResponse,
  GetUserInfoResponse,
  GetUserInfoWithJwtRequest,
  GetUserInfoWithJwtResponse,
} from "./types/manusTypes";
// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

const EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
const GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
const GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;

class OAuthService {
  constructor(private client: ReturnType<typeof axios.create>) {
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }

  private decodeState(state: string): string {
    try {
      console.log("[SDK] Decoding state...");
      const redirectUri = atob(state);
      console.log("[SDK] Decoded state (redirect URI):", redirectUri);
      return redirectUri;
    } catch (error) {
      console.error("[SDK] Failed to decode state:", error);
      throw new Error("Invalid state parameter");
    }
  }

  async getTokenByCode(
    code: string,
    state: string
  ): Promise<ExchangeTokenResponse> {
    console.log("[SDK] Exchanging code for token");
    console.log("[SDK] Code length:", code.length);
    console.log("[SDK] State length:", state.length);
    console.log("[SDK] OAuth server URL:", ENV.oAuthServerUrl);
    
    const payload: ExchangeTokenRequest = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state),
    };
    
    console.log("[SDK] Exchange payload:", {
      clientId: payload.clientId ? "SET" : "MISSING",
      grantType: payload.grantType,
      redirectUri: payload.redirectUri
    });

    try {
      const { data } = await this.client.post<ExchangeTokenResponse>(
        EXCHANGE_TOKEN_PATH,
        payload
      );
      
      console.log("[SDK] Token exchange response received");
      console.log("[SDK] Response keys:", Object.keys(data));
      
      return data;
    } catch (error) {
      console.error("[SDK] Token exchange failed");
      console.error("[SDK] Error:", error);
      throw error;
    }
  }

  async getUserInfoByToken(
    token: ExchangeTokenResponse
  ): Promise<GetUserInfoResponse> {
    console.log("[SDK] Fetching user info with token");
    console.log("[SDK] Access token length:", token.accessToken?.length || 0);
    
    try {
      const { data } = await this.client.post<GetUserInfoResponse>(
        GET_USER_INFO_PATH,
        {
          accessToken: token.accessToken,
        }
      );
      
      console.log("[SDK] User info response received");
      console.log("[SDK] User info keys:", Object.keys(data));
      
      return data;
    } catch (error) {
      console.error("[SDK] Failed to fetch user info");
      console.error("[SDK] Error:", error);
      throw error;
    }
  }

  private parseCookies(cookieHeader?: string): Map<string, string> {
    if (!cookieHeader) {
      return new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private async verifySession(sessionToken?: string): Promise<SessionPayload | null> {
    if (!sessionToken) {
      console.log("[SDK] No session token provided");
      return null;
    }

    try {
      console.log("[SDK] Verifying session token...");
      const secret = new TextEncoder().encode(ENV.jwtSecret);
      const { payload } = await jwtVerify(sessionToken, secret);
      console.log("[SDK] Session verified successfully");
      console.log("[SDK] Session payload keys:", Object.keys(payload));
      return payload as unknown as SessionPayload;
    } catch (error) {
      console.error("[SDK] Session verification failed:", error);
      return null;
    }
  }

  async exchangeCodeForToken(
    code: string,
    state: string
  ): Promise<ExchangeTokenResponse> {
    return this.getTokenByCode(code, state);
  }

  async getUserInfo(accessToken: string): Promise<GetUserInfoResponse> {
    try {
      const { data } = await this.client.post<GetUserInfoResponse>(
        GET_USER_INFO_PATH,
        { accessToken }
      );
      return data;
    } catch (error) {
      console.error("[SDK] getUserInfo failed:", error);
      throw error;
    }
  }

  async getUserInfoWithJwt(jwt: string): Promise<GetUserInfoWithJwtResponse> {
    console.log("[SDK] Fetching user info with JWT");
    
    try {
      const { data } = await this.client.post<GetUserInfoWithJwtResponse>(
        GET_USER_INFO_WITH_JWT_PATH,
        { jwt }
      );
      
      console.log("[SDK] User info with JWT response received");
      return data;
    } catch (error) {
      console.error("[SDK] Failed to fetch user info with JWT");
      console.error("[SDK] Error:", error);
      throw error;
    }
  }

  async createSessionToken(
    openId: string,
    options: { name?: string; expiresInMs?: number }
  ): Promise<string> {
    console.log("[SDK] Creating session token");
    console.log("[SDK] OpenId:", openId);
    console.log("[SDK] Expires in:", options.expiresInMs, "ms");
    
    try {
      const secret = new TextEncoder().encode(ENV.jwtSecret);
      const token = await new SignJWT({
        openId,
        appId: ENV.appId,
        name: options.name || "",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(
          Math.floor(Date.now() / 1000) +
            (options.expiresInMs ? options.expiresInMs / 1000 : 31536000)
        )
        .sign(secret);

      console.log("[SDK] Session token created successfully");
      console.log("[SDK] Token length:", token.length);
      return token;
    } catch (error) {
      console.error("[SDK] Failed to create session token:", error);
      throw error;
    }
  }

  async authenticateRequest(req: Request): Promise<User> {
    // Regular authentication flow
    console.log("[Auth] authenticateRequest called");
    console.log("[Auth] Request headers:", {
      cookie: req.headers.cookie ? "present" : "missing",
      origin: req.headers.origin,
      referer: req.headers.referer,
    });
    
    const cookies = this.parseCookies(req.headers.cookie);
    console.log("[Auth] Parsed cookies count:", cookies.size);
    console.log("[Auth] Cookie names:", Array.from(cookies.keys()));
    
    const COOKIE_NAME = "manus_session";
    const sessionCookie = cookies.get(COOKIE_NAME);
    console.log("[Auth] Looking for cookie:", COOKIE_NAME);
    console.log("[Auth] Session cookie found:", !!sessionCookie);
    console.log("[Auth] Session cookie length:", sessionCookie?.length || 0);
    
    const session = await this.verifySession(sessionCookie);
    console.log("[Auth] Session verified:", !!session);

    if (!session) {
      console.error("[Auth] FAILED: Invalid session cookie");
      throw ForbiddenError("Invalid session cookie");
    }

    const sessionUserId = session.openId;
    const signedInAt = new Date();
    let user = await db.getUserByOpenId(sessionUserId);

    // If user not in DB, sync from OAuth server automatically
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await db.upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt,
        });
        user = await db.getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }

    if (!user) {
      throw ForbiddenError("User not found");
    }

    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt,
    });

    return user;
  }
}

export const sdk = new OAuthService(
  axios.create({
    baseURL: ENV.oAuthServerUrl,
    timeout: 10000,
  })
);
