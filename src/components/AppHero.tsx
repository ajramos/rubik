import React from "react";

type Props = {
  heroEyebrow: string;
};

export function AppHero({ heroEyebrow }: Props) {
  return (
    <header className="hero">
      <div className="heroLeft">
        <div className="heroBrand">
          <span className="heroBrandMark" aria-hidden="true">◆</span>
          Rubik Knowledge Atlas
        </div>
        <div className="heroEyebrow">{heroEyebrow}</div>
      </div>
    </header>
  );
}
