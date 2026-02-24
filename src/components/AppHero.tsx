import React from "react";

type Props = {
  heroEyebrow: string;
  heroLeadText: string;
  ollCount: number;
  pllCount: number;
  primaryPanelModeLabel: string;
};

export function AppHero({
  heroEyebrow,
  ollCount,
  pllCount,
  primaryPanelModeLabel,
}: Props) {
  return (
    <header className="hero">
      <div className="heroLeft">
        <div className="heroBrand">
          <span className="heroBrandMark" aria-hidden="true">◆</span>
          Rubik Knowledge Atlas
        </div>
        <div className="heroEyebrow">{heroEyebrow}</div>
      </div>

      <div className="heroStats">
        <div className="heroBadge heroBadge--oll">
          <span className="heroBadgeLabel">OLL</span>
          <span className="heroBadgeValue">{ollCount}</span>
        </div>
        <div className="heroBadge heroBadge--pll">
          <span className="heroBadgeLabel">PLL</span>
          <span className="heroBadgeValue">{pllCount}</span>
        </div>
        <div className="heroBadge">
          <span className="heroBadgeLabel">Method</span>
          <span className="heroBadgeValue">CFOP</span>
        </div>
        <div className="heroBadge heroBadge--active">
          <span className="heroBadgeLabel">Path</span>
          <span className="heroBadgeValue">{primaryPanelModeLabel}</span>
        </div>
      </div>
    </header>
  );
}
