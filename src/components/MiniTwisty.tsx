import React, { useMemo } from "react";
import type { AlgSet } from "../types";
import { normalizeAlg } from "../utils/alg";

const DISPLAY_ORIENTATION = "z2";
const runtimeThumbCache = new Map<string, string>();

type Props = {
  set: AlgSet;
  size?: number; // px
  thumb?: string;
  alg?: string;
  setupAlg?: string;
  exactF2L?: boolean;
};

export function MiniTwisty({ set, size = 140, thumb, alg, setupAlg, exactF2L = false }: Props) {
  const cleanedAlg = useMemo(() => (alg ? normalizeAlg(alg) : undefined), [alg]);
  const cleanedSetupAlg = useMemo(
    () => (setupAlg ? normalizeAlg(setupAlg) : undefined),
    [setupAlg]
  );
  const setupWithOrientation = useMemo(
    () => (cleanedSetupAlg ? `${DISPLAY_ORIENTATION} ${cleanedSetupAlg}` : DISPLAY_ORIENTATION),
    [cleanedSetupAlg]
  );
  const f2lStylized = set === "F2L" && !exactF2L;
  const captureSize = set === "F2L" && exactF2L ? 240 : size;
  const experimentalStickering = f2lStylized ? "LS" : undefined;
  const visualization = f2lStylized ? "2D" : undefined;
  const foundationDisplay = f2lStylized ? "none" : undefined;
  const cacheKey = useMemo(
    () =>
      cleanedAlg
        ? `runtime-thumb:v5:${set}:${captureSize}:${exactF2L ? "exact" : "styled"}:${visualization ?? ""}:${experimentalStickering ?? ""}:${foundationDisplay ?? ""}:${cleanedAlg}:${cleanedSetupAlg ?? ""}`
        : null,
    [
      cleanedAlg,
      cleanedSetupAlg,
      experimentalStickering,
      visualization,
      foundationDisplay,
      set,
      captureSize,
      exactF2L,
    ]
  );
  const [runtimeThumb, setRuntimeThumb] = React.useState<string | null>(() =>
    cacheKey ? runtimeThumbCache.get(cacheKey) ?? null : null
  );
  const [renderError, setRenderError] = React.useState(false);

  React.useEffect(() => {
    if (thumb || !cleanedAlg || !cacheKey) return;
    if (runtimeThumbCache.has(cacheKey)) {
      setRuntimeThumb(runtimeThumbCache.get(cacheKey)!);
      return;
    }

    let cancelled = false;
    let host: HTMLDivElement | null = null;

    const cleanup = () => {
      if (host && host.parentNode) host.parentNode.removeChild(host);
      host = null;
    };

    const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
    const raf = () => new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)));

    (async () => {
      try {
        if (!customElements.get("twisty-player")) {
          await customElements.whenDefined("twisty-player");
        }

        host = document.createElement("div");
        Object.assign(host.style, {
          position: "fixed",
          left: "-10000px",
          top: "0",
          width: `${captureSize}px`,
          height: `${captureSize}px`,
          opacity: "0",
          pointerEvents: "none",
          zIndex: "-1",
        });

        const player = document.createElement("twisty-player") as any;
        const applyPlayerAttrs = () => {
          player.setAttribute("puzzle", "3x3x3");
          player.setAttribute("alg", cleanedAlg);
          player.setAttribute("experimental-setup-alg", setupWithOrientation);
          player.setAttribute("experimental-setup-anchor", cleanedSetupAlg ? "start" : "end");
          player.setAttribute("control-panel", "none");
          player.setAttribute("background", "none");
          player.setAttribute("hint-facelets", "none");
          if (visualization) {
            player.setAttribute("visualization", visualization);
          }
          if (experimentalStickering) {
            player.setAttribute("experimental-stickering", experimentalStickering);
          }
          if (foundationDisplay) {
            player.setAttribute("foundation-display", foundationDisplay);
          }
        };
        applyPlayerAttrs();
        Object.assign(player.style, {
          width: `${captureSize}px`,
          height: `${captureSize}px`,
          display: "block",
          background: "#fff",
        });

        host.appendChild(player);
        document.body.appendChild(host);

        // Give the custom element time to upgrade and render before screenshotting.
        await raf();
        await wait(80);
        await raf();
        applyPlayerAttrs();
        await raf();

        if (cleanedSetupAlg && typeof player.jumpToStart === "function") {
          try {
            player.jumpToStart({ flash: false });
          } catch {
            // best effort
          }
          await raf();
          await wait(80);
          await raf();
        }

        const screenshotFn =
          typeof player.experimentalScreenshot === "function"
            ? player.experimentalScreenshot.bind(player)
            : typeof player.screenshot === "function"
              ? player.screenshot.bind(player)
              : null;

        if (!screenshotFn) {
          throw new Error("twisty-player screenshot API unavailable");
        }

        const shot = await screenshotFn({ width: captureSize, height: captureSize });
        let src: string | null = null;
        if (typeof shot === "string") {
          src = shot;
        } else if (shot instanceof Blob) {
          src = URL.createObjectURL(shot);
        }

        if (!src) {
          throw new Error("invalid screenshot result");
        }

        if (!cancelled) {
          runtimeThumbCache.set(cacheKey, src);
          setRuntimeThumb(src);
          setRenderError(false);
        }
      } catch {
        if (!cancelled) setRenderError(true);
      } finally {
        cleanup();
      }
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [
    thumb,
    cleanedAlg,
    cacheKey,
    captureSize,
    setupWithOrientation,
    cleanedSetupAlg,
    experimentalStickering,
    visualization,
    foundationDisplay,
    exactF2L,
  ]);

  return (
    <div
      className={`miniThumb miniThumb--${set.toLowerCase()}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {thumb || runtimeThumb ? (
        <img
          src={thumb ?? runtimeThumb ?? ""}
          alt=""
          className="miniImage"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      ) : cleanedAlg && !renderError ? (
        <div className="miniPlaceholder">
          <span className="miniPlaceholderLabel">Rendering...</span>
        </div>
      ) : (
        <div className="miniPlaceholder">
          <span className="miniPlaceholderLabel">{cleanedAlg ? "Preview error" : "No image"}</span>
        </div>
      )}
    </div>
  );
}
