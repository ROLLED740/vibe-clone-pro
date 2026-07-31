/**
 * Model IDs for the generation swarm, in one place and overridable per
 * environment so a provider renaming a model doesn't require a code change.
 */

export const MODELS = {
  /** Primary code generator. */
  anthropic: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
  /** Vision pass that extracts palette/typography from an uploaded screenshot. */
  geminiVision: process.env.GEMINI_VISION_MODEL || 'gemini-2.0-flash',
  /** Text fallback when Anthropic is unavailable. */
  gemini: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  /** Second fallback. */
  xai: process.env.XAI_MODEL || 'grok-2-latest',
} as const;

/** Stylistic twists generated in parallel for every build. */
export const VARIANTS = ['original', 'bold', 'ethereal'] as const;

export type VariantName = (typeof VARIANTS)[number];
