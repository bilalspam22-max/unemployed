import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user:         schema.users,
      session:      schema.sessions,
      account:      schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,
  },
  // Accept localhost, LAN IPs, and production domains dynamically.
  trustedOrigins: (request?: Request) => {
    const list: (string | null)[] = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      process.env.BETTER_AUTH_URL ?? null,
      process.env.NEXT_PUBLIC_APP_URL ?? null,
    ];
    if (request) {
      const origin = request.headers.get("origin");
      if (origin) {
        // Trust any private-network IP
        const privateNet = /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;
        if (privateNet.test(origin)) {
          list.push(origin);
        }
        // Trust any subdomain of the root domain (e.g. www.unemployedxyz.xyz, unemployed.unemployedxyz.xyz)
        const appUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
        if (appUrl) {
          try {
            const rootDomain = new URL(appUrl).hostname.split(".").slice(-2).join(".");
            if (origin.includes(rootDomain)) {
              list.push(origin);
            }
          } catch {}
        }
      }
    }
    return list;
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: process.env.BETTER_AUTH_URL?.startsWith("https") ?? false,
    },
  },
});
