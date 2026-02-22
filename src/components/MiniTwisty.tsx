import React from "react";
import type { AlgSet } from "../types";

type Props = {
  set: AlgSet;
  size?: number; // px
  thumb?: string;
};

export function MiniTwisty({ set, size = 140, thumb }: Props) {
  return (
    <div
      className={`miniThumb miniThumb--${set.toLowerCase()}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {thumb ? (
        <img
          src={thumb}
          alt=""
          className="miniImage"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      ) : (
        <div className="miniPlaceholder">
          <span className="miniPlaceholderLabel">Sin imagen</span>
        </div>
      )}
    </div>
  );
}

