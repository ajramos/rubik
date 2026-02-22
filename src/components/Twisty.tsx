import React, { useMemo } from "react";
import { normalizeAlg } from "../utils/alg";

const DISPLAY_ORIENTATION = "z2";

type Props = {
  alg: string;
};

export function Twisty({ alg }: Props) {
  const cleaned = useMemo(() => normalizeAlg(alg), [alg]);

  // "experimental-setup-anchor=end" makes the viewer start from the case
  // and end solved after playing the algorithm.
  return (
    <twisty-player
      puzzle="3x3x3"
      alg={cleaned}
      experimental-setup-alg={DISPLAY_ORIENTATION}
      experimental-setup-anchor="end"
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
