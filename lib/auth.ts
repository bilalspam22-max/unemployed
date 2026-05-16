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
  // Accept localhost + any LAN IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x) on any port.
  // Pre-build a generous static list to cover common LAN ranges in dev.
  trustedOrigins: (() => {
    const list: string[] = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ];
    if (process.env.BETTER_AUTH_URL) list.push(process.env.BETTER_AUTH_URL);

    // Generate common LAN IPs (192.168.0.x and 192.168.1.x) on port 3000 — covers most home/Proxmox setups
    for (let i = 1; i <= 254; i++) {
      list.push(`http://192.168.0.${i}:3000`);
      list.push(`http://192.168.1.${i}:3000`);
    }
    return list;
  })(),
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: false,
    },
  },
});
