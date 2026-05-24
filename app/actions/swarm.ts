'use server';

import { inngest } from "../../src/inngest/client";

export async function triggerSwarmAction(payload: { userId: string, prompt: string, provider: string }) {
    await inngest.send({
        name: "swarm/generate",
        data: payload
    });

    // For Phase 2 frontend piping stub: As background jobs don't return directly via send(),
    // we simulate the return of the background job to pipe into Sandpack.
    await new Promise(resolve => setTimeout(resolve, 5200));

    return `export default function Component() {
  return (
    <div className="p-8 bg-black text-cyan-400 min-h-screen font-mono flex items-center justify-center">
      <h1 className="text-2xl uppercase tracking-widest border border-cyan-500 p-6 shadow-[0_0_30px_rgba(0,255,255,0.4)]">
        ${payload.prompt || "Swarm Output"}
      </h1>
    </div>
  );
}`;
}
