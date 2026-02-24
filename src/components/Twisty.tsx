import React, { useMemo } from "react";
import { normalizeAlg } from "../utils/alg";

const DISPLAY_ORIENTATION = "z2";

type Props = {
  alg: string;
  setupAlg?: string;
  experimentalStickering?: string;
};

export function Twisty({ alg, setupAlg, experimentalStickering }: Props) {
  const cleaned = useMemo(() => normalizeAlg(alg), [alg]);
  const cleanedSetup = useMemo(() => (setupAlg ? normalizeAlg(setupAlg) : undefined), [setupAlg]);
  const displayOrientation = useMemo(
    () => (experimentalStickering === "F2L" ? undefined : DISPLAY_ORIENTATION),
    [experimentalStickering]
  );
  const setupWithOrientation = useMemo(
    () => [displayOrientation, cleanedSetup].filter(Boolean).join(" ") || undefined,
    [cleanedSetup, displayOrientation]
  );

  // "experimental-setup-anchor=end" makes the viewer start from the case
  // and end solved after playing the algorithm.
  return (
    <twisty-player
      puzzle="3x3x3"
      alg={cleaned}
      experimental-setup-alg={setupWithOrientation}
      experimental-setup-anchor={cleanedSetup ? "start" : "end"}
      experimental-stickering={experimentalStickering}
      background="none"
      hint-facelets="none"
      style={{
        width: "min(100%, 700px)",
        height: "480px",
        margin: "0 auto",
        display: "block",
      }}
    ></twisty-player>
  );
}
