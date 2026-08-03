// Thin wrapper around the YouTube Playables SDK (window.ytgame).
// Inside YouTube the real SDK is used; anywhere else (local dev, itch.io,
// Poki, your own site) it falls back to localStorage so the game still works.

const STORAGE_KEY = 'rolling-rush-save';

function sdk() {
  return typeof window !== 'undefined' ? window.ytgame : undefined;
}

export const inYouTube = () => Boolean(sdk());

// Tell YouTube the first frame is visible (dismisses the loading screen).
export function firstFrameReady() {
  try { sdk()?.game.firstFrameReady(); } catch { /* non-fatal */ }
}

// Tell YouTube the game is interactive.
export function gameReady() {
  try { sdk()?.game.gameReady(); } catch { /* non-fatal */ }
}

// Report a score for leaderboards / recommendations.
export function sendScore(value) {
  try { sdk()?.engagement.sendScore({ value: Math.floor(value) }); } catch { /* non-fatal */ }
}

export async function loadSave() {
  const yt = sdk();
  try {
    const raw = yt ? await yt.game.loadData() : localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveSave(data) {
  const raw = JSON.stringify(data);
  const yt = sdk();
  try {
    if (yt) await yt.game.saveData(raw);
    else localStorage.setItem(STORAGE_KEY, raw);
  } catch { /* non-fatal */ }
}

// Register pause/resume callbacks requested by the YouTube app
// (e.g. the user opens the video description over the game).
export function onSystemPause(pause, resume) {
  const yt = sdk();
  if (!yt) return;
  try {
    yt.system.onPause(pause);
    yt.system.onResume(resume);
  } catch { /* non-fatal */ }
}
