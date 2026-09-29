import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc.js";
import { ENV } from "../_core/env.js";

const GOOGLE_AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places";

const geoRequestBucket = new Map<string, number[]>();

/** Fixed-window guard for the paid Places proxy: 30 requests per IP per minute. */
export function geoRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (geoRequestBucket.get(ip) ?? []).filter((timestamp) => now - timestamp < 60_000);
  if (hits.length >= 30) {
    geoRequestBucket.set(ip, hits);
    return true;
  }
  hits.push(now);
  geoRequestBucket.set(ip, hits);
  return false;
}

export type SupportedProvince = "AB" | "BC" | "ON";

/** Maps Google's administrative_area_level_1 short code to the product's supported provinces. */
export function mapGoogleProvince(shortCode?: string | null): SupportedProvince | null {
  if (shortCode === "AB" || shortCode === "BC" || shortCode === "ON") return shortCode;
  return null;
}

function clientIp(ctx: { req?: { ip?: string } }): string {
  return ctx.req?.ip ?? "unknown";
}

function requireApiKey(): string {
  if (!ENV.googlePlacesApiKey) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Address lookup is temporarily unavailable." });
  }
  return ENV.googlePlacesApiKey;
}

async function googleJson(url: string, init: RequestInit, apiKey: string): Promise<any> {
  try {
    const appUrl = process.env.APP_URL;
    const response = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        "X-Goog-Api-Key": apiKey,
        "Content-Type": "application/json",
        ...(appUrl ? { Referer: `${appUrl.replace(/\/$/, "")}/` } : {}),
      },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("[Geo] Google Places request failed", response.status, body);
      throw new TRPCError({ code: "BAD_GATEWAY", message: "Address lookup is temporarily unavailable." });
    }
    return body;
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    console.error("[Geo] Google Places network error", error);
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Address lookup is temporarily unavailable." });
  }
}

export const geoRouter = router({
  autocomplete: publicProcedure
    .input(z.object({ query: z.string().trim().min(2).max(200), sessionToken: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      if (geoRateLimited(clientIp(ctx))) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait before searching for another address." });
      }
      const apiKey = requireApiKey();
      const body = await googleJson(GOOGLE_AUTOCOMPLETE_URL, {
        method: "POST",
        body: JSON.stringify({
          input: input.query,
          sessionToken: input.sessionToken,
          includedRegionCodes: ["ca"],
          includedPrimaryTypes: ["street_address"],
        }),
      }, apiKey);
      return {
        predictions: (body.suggestions ?? [])
          .map((suggestion: any) => suggestion.placePrediction)
          .filter(Boolean)
          .map((prediction: any) => ({
            placeId: prediction.placeId as string,
            description: prediction.text?.text as string,
            mainText: prediction.structuredFormat?.mainText?.text as string | undefined,
            secondaryText: prediction.structuredFormat?.secondaryText?.text as string | undefined,
          }))
          .filter((prediction: { placeId?: string; description?: string }) => prediction.placeId && prediction.description),
      };
    }),

  resolveAddress: publicProcedure
    .input(z.object({ placeId: z.string().min(1).max(300), sessionToken: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      if (geoRateLimited(clientIp(ctx))) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait before looking up another address." });
      }
      const apiKey = requireApiKey();
      const body = await googleJson(`${GOOGLE_PLACES_URL}/${encodeURIComponent(input.placeId)}?sessionToken=${encodeURIComponent(input.sessionToken)}`, {
        method: "GET",
        headers: { "X-Goog-FieldMask": "addressComponents,formattedAddress,location" },
      }, apiKey);
      const components = Array.isArray(body.addressComponents) ? body.addressComponents : [];
      const findComponent = (type: string) => components.find((component: any) => component.types?.includes(type));
      const provinceComponent = findComponent("administrative_area_level_1");
      const municipalityComponent = findComponent("locality")
        ?? findComponent("sublocality")
        ?? findComponent("postal_town");
      return {
        province: mapGoogleProvince(provinceComponent?.shortText ?? provinceComponent?.longText),
        municipality: municipalityComponent?.longText ?? null,
        formattedAddress: body.formattedAddress ?? null,
        lat: typeof body.location?.latitude === "number" ? body.location.latitude : null,
        lng: typeof body.location?.longitude === "number" ? body.location.longitude : null,
      };
    }),
});
