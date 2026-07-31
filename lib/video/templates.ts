/**
 * Prompt presets shown in the studio. Each one wraps the user's idea in a
 * style direction so a one-line prompt still produces a usable clip.
 *
 * Safe to import from client components — no secrets, no server-only imports.
 */

export interface Template {
  id: string;
  name: string;
  blurb: string;
  /** `{idea}` is replaced with the user's prompt. */
  promptTemplate: string;
  /** Motion direction applied when the still is animated. */
  motionPrompt: string;
  emoji: string;
}

export const TEMPLATES: Template[] = [
  {
    id: 'giant-in-the-city',
    name: 'Giant in the City',
    blurb: 'Everyday subject, scaled to skyscraper size, shot from street level.',
    promptTemplate:
      'A colossal {idea} towering over a busy city street, photographed from ground level with a wide lens, dramatic afternoon light, photorealistic, cinematic depth of field',
    motionPrompt: 'slow upward camera tilt revealing the full scale, subtle ambient motion',
    emoji: '🏙️',
  },
  {
    id: 'product-hero',
    name: 'Product Hero',
    blurb: 'Clean studio shot with punchy lighting, built for ads.',
    promptTemplate:
      'A premium studio product photograph of {idea}, seamless gradient backdrop, crisp rim lighting, glossy reflections, commercial advertising quality, ultra sharp',
    motionPrompt: 'slow orbital camera move around the product, gentle light sweep',
    emoji: '📦',
  },
  {
    id: 'neon-night',
    name: 'Neon Night',
    blurb: 'Rain-slick streets and saturated neon. High contrast, high scroll-stop.',
    promptTemplate:
      'A cinematic night scene of {idea}, drenched in neon signage, wet reflective pavement, heavy atmosphere, teal and magenta palette, anamorphic lens flares',
    motionPrompt: 'slow dolly forward, flickering neon, drifting rain',
    emoji: '🌃',
  },
  {
    id: 'nature-macro',
    name: 'Nature Macro',
    blurb: 'Extreme close-up with shallow focus. Calm, premium, organic.',
    promptTemplate:
      'An extreme macro photograph of {idea}, razor-thin depth of field, dew and fine texture detail, soft natural window light, muted earthy palette',
    motionPrompt: 'very slow push in, delicate drifting particles',
    emoji: '🌿',
  },
  {
    id: 'retro-print',
    name: 'Retro Print',
    blurb: 'Grainy film look with vintage colour. Feels editorial.',
    promptTemplate:
      'A 1970s film photograph of {idea}, visible grain, faded warm colour cast, soft halation, shot on expired 35mm stock, editorial composition',
    motionPrompt: 'subtle handheld drift, gentle film weave and flicker',
    emoji: '📼',
  },
  {
    id: 'clay-world',
    name: 'Clay World',
    blurb: 'Handmade stop-motion charm. Reads instantly as different.',
    promptTemplate:
      'A stop-motion claymation scene of {idea}, visible fingerprints in the clay, miniature handcrafted set, soft studio lighting, tilt-shift perspective',
    motionPrompt: 'choppy stop-motion cadence, small character movements',
    emoji: '🧱',
  },
];

export const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id;

export function getTemplate(id: string | null | undefined): Template | undefined {
  if (!id) return undefined;
  return TEMPLATES.find((t) => t.id === id);
}

/** Expands the user's idea through a template, or passes it through verbatim. */
export function buildPrompt(idea: string, templateId?: string | null): string {
  const template = getTemplate(templateId);
  if (!template) return idea;
  return template.promptTemplate.replace('{idea}', idea);
}
