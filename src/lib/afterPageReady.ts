// Let HTML/CSS, the first portrait and fonts win the initial network/paint work.
// Idle timeout also works when the visitor keeps scrolling without pausing.
export function afterPageReady(task: () => void) {
  let cancelled = false;
  let idle: number | undefined;
  let timer: number | undefined;
  let portrait: HTMLImageElement | null = null;
  let portraitTimer: number | undefined;
  const run = () => { if (!cancelled) task(); };
  const schedule = () => {
    if ("requestIdleCallback" in window)
      idle = window.requestIdleCallback(run, { timeout: 800 });
    else timer = setTimeout(run, 120);
  };
  const ready = () => {
    clearTimeout(portraitTimer);
    portrait?.removeEventListener("load", ready);
    portrait?.removeEventListener("error", ready);
    if (!cancelled) schedule();
  };
  const pageLoaded = () => {
    // React may mount this image after window.load has already fired.
    portrait = document.querySelector<HTMLImageElement>(".couple-photo");
    if (!portrait || portrait.complete) ready();
    else {
      portrait.addEventListener("load", ready, { once: true });
      portrait.addEventListener("error", ready, { once: true });
      // A stalled image must not indefinitely prevent music preparation.
      portraitTimer = window.setTimeout(ready, 4000);
    }
  };
  if (document.readyState === "complete") pageLoaded();
  else window.addEventListener("load", pageLoaded, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", pageLoaded);
    portrait?.removeEventListener("load", ready);
    portrait?.removeEventListener("error", ready);
    clearTimeout(portraitTimer);
    if (idle !== undefined) window.cancelIdleCallback(idle);
    clearTimeout(timer);
  };
}
