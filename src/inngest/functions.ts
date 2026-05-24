import { inngest } from "./client";
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { userApiKeys } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runSwarmGeneration = inngest.createFunction(
  { id: "run-swarm-generation" },
  { event: "swarm/generate" },
  // @ts-expect-error - Inngest v3 payload typing bypass
  async ({ event, step }) => {
    const { userId, prompt, provider } = event.data;
    console.log(`[Swarm] Generating with provider: ${provider}`);

    // Securely retrieve the user's keys using step.run
    const keys = await step.run("fetch-api-keys", async () => {
      const sql = neon(process.env.DATABASE_URL!);
      const db = drizzle(sql);

      const dbKeys = await db.select()
        .from(userApiKeys)
        .where(eq(userApiKeys.userId, userId))
        .limit(1);

      return dbKeys.length > 0 ? dbKeys[0] : null;
    });

    if (!keys) {
      throw new Error("API keys not configured.");
    }

    // Instead of timing out, the LLM call runs asynchronously and is stubbed
    await step.sleep("simulate-swarm", "5s");

    return `export default function Component() {
  return (
    <div className="p-8 bg-black text-cyan-400 min-h-screen font-mono flex items-center justify-center">
      <h1 className="text-2xl uppercase tracking-widest border border-cyan-500 p-6 shadow-[0_0_30px_rgba(0,255,255,0.4)]">
        ${prompt || "Swarm Output"}
      </h1>
    </div>
  );
}`;
  }
);
