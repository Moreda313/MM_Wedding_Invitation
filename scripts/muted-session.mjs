// Existing opt-in regression scenarios start with a guest's remembered mute.
// Fresh-visit autoplay behavior is covered separately by verify-autoplay.mjs.
export async function mutedSession(page) {
  await page.addInitScript(() => sessionStorage.setItem("mm-music-muted", "1"));
}
