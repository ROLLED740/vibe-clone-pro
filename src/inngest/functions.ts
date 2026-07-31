import { inngest } from "./client";
import { runBuild } from "@/lib/generate";

/**
 * Background build worker. Shares `runBuild` with the synchronous /api/clone
 * route so both paths generate, meter and persist identically.
 */
export const runSwarmGeneration = inngest.createFunction(
  { id: "run-swarm-generation", triggers: [{ event: "swarm/generate" }] },
  async ({ event, step }) => {
    const { userId, prompt, imageBase64 } = event.data as {
      userId: string;
      prompt?: string;
      imageBase64?: string;
    };

    if (!userId) {
      throw new Error("swarm/generate requires a userId");
    }

    const result = await step.run("run-build", () =>
      runBuild({ userId, idea: prompt, imageBase64 })
    );

    return result;
  }
);
