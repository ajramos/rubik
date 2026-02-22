import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Alg } from "cubing/alg";
import { cube3x3x3 } from "cubing/puzzles";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "src", "data", "algs.json");
const OUT_DIR = path.join(ROOT, "public", "thumbs", "generated");
const DISPLAY_ORIENTATION = "z2";
const THUMB_URL_VERSION = "v5";

const MACROS = {
  SEXY: "R U R' U'",
  ANTI_SEXY: "R U' R' U",
  SLEDGEHAMMER: "R' F R F'",
  SLEDGEHMR: "R' F R F'",
  SLEDGEHR: "R' F R F'",
};

function normalizeAlg(input) {
  let s = input.replace(/\[|\]/g, " ");
  for (const [key, value] of Object.entries(MACROS)) {
    s = s.replace(new RegExp(`\\b${key}\\b`, "g"), value);
  }
  return s.replace(/\s+/g, " ").trim();
}

function escapeXml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function extractOriginalColors(svg) {
  const colors = new Map();
  const re = /id="([^"]+)"[^>]*style="[^"]*fill:\s*([^";]+)[^"]*"/g;
  let m;
  while ((m = re.exec(svg))) {
    colors.set(m[1], m[2].trim());
  }
  return colors;
}

function replaceFillById(svg, id, fill) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `(id="${escapedId}"[^>]*style="[^"]*fill:\\s*)([^";]+)([^"]*")`,
    "g"
  );
  return svg.replace(re, `$1${fill}$3`);
}

function colorizeTemplate(templateSvg, pattern, originalColors) {
  let svg = templateSvg;
  for (const orbit of pattern.kpuzzle.definition.orbits) {
    const orbitState = pattern.patternData[orbit.orbitName];
    for (let idx = 0; idx < orbit.numPieces; idx++) {
      for (let orientation = 0; orientation < orbit.numOrientations; orientation++) {
        const id = `${orbit.orbitName}-l${idx}-o${orientation}`;
        const sourceId = `${orbit.orbitName}-l${orbitState.pieces[idx]}-o${
          (orbit.numOrientations - orbitState.orientation[idx] + orientation) %
          orbit.numOrientations
        }`;
        const fill = originalColors.get(sourceId);
        if (fill) svg = replaceFillById(svg, id, fill);
      }
    }
  }
  return svg;
}

function flattenOLLColors(svg) {
  return svg.replace(
    /(id="(?:CORNERS|EDGES|CENTERS)-l\d+-o\d+"[^>]*style="[^"]*fill:\s*)([^";]+)([^"]*")/g,
    (_m, a, fill, b) => {
      const f = String(fill).trim().toLowerCase();
      const isYellow = f === "yellow" || f === "#ff0" || f === "#ffff00";
      return `${a}${isYellow ? "#f2e700" : "#b8b8b8"}${b}`;
    }
  );
}

function forcePLLYellowTop(svg) {
  const ids = [
    "CENTERS-l0-o0",
    "CENTERS-l0-o1",
    "CENTERS-l0-o2",
    "CENTERS-l0-o3",
    "CORNERS-l0-o0",
    "CORNERS-l1-o0",
    "CORNERS-l2-o0",
    "CORNERS-l3-o0",
    "EDGES-l0-o0",
    "EDGES-l1-o0",
    "EDGES-l2-o0",
    "EDGES-l3-o0",
  ];
  for (const id of ids) {
    svg = replaceFillById(svg, id, "#f2e700");
  }
  return svg;
}

function styleCommon(svg, setName) {
  const a = setName === "OLL" ? "#f4b1b1" : "#b6d4f5";
  const b = setName === "OLL" ? "#e6d69d" : "#b9e2b8";
  const defs = `
  <defs>
    <linearGradient id="thumb-top-bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${a}" />
      <stop offset="100%" stop-color="${b}" />
    </linearGradient>
  </defs>
  <rect x="30" y="30" width="196" height="10" rx="6" fill="url(#thumb-top-bar)" opacity="0.95"></rect>
`;
  svg = svg.replace(/<svg([^>]*)>/, `<svg$1>${defs}`);
  svg = svg.replace(/<title>.*?<\/title>\s*/s, "");
  return svg;
}

const PLL_ARROW_OVERRIDES = {
  pll_aa: [
    { from: [64, 64], to: [192, 64], color: "#d43b2d" },
    { from: [192, 64], to: [192, 192], color: "#d43b2d" },
    { from: [192, 192], to: [64, 64], color: "#d43b2d" },
  ],
  pll_ab: [
    { from: [64, 192], to: [192, 192], color: "#d43b2d" },
    { from: [192, 192], to: [192, 64], color: "#d43b2d" },
    { from: [64, 192], to: [192, 64], color: "#d43b2d" },
  ],
  pll_e: [
    { from: [64, 64], to: [64, 192], color: "#d43b2d" },
    { from: [192, 64], to: [192, 192], color: "#d43b2d" },
    { from: [96, 64], to: [160, 64], color: "#d43b2d" },
    { from: [96, 192], to: [160, 192], color: "#d43b2d" },
  ],
  pll_na: [
    { from: [64, 64], to: [192, 192], color: "#d43b2d" },
    { from: [128, 64], to: [128, 192], color: "#3a5fd8" },
  ],
  pll_nb: [
    { from: [64, 192], to: [192, 64], color: "#d43b2d" },
    { from: [128, 64], to: [128, 192], color: "#3a5fd8" },
  ],
  pll_v: [
    { from: [64, 64], to: [192, 192], color: "#d43b2d" },
    { from: [128, 64], to: [192, 128], color: "#3a5fd8" },
  ],
  pll_ga: [
    { from: [64, 192], to: [64, 64], color: "#d43b2d" },
    { from: [64, 64], to: [192, 64], color: "#d43b2d" },
    { from: [192, 64], to: [64, 192], color: "#d43b2d" },
    { from: [64, 128], to: [128, 64], color: "#3a5fd8" },
    { from: [128, 64], to: [192, 128], color: "#3a5fd8" },
    { from: [192, 128], to: [64, 128], color: "#3a5fd8" },
  ],
  pll_gb: [
    { from: [192, 192], to: [192, 64], color: "#d43b2d" },
    { from: [192, 64], to: [64, 64], color: "#d43b2d" },
    { from: [64, 64], to: [192, 192], color: "#d43b2d" },
    { from: [192, 128], to: [128, 64], color: "#3a5fd8" },
    { from: [128, 64], to: [64, 128], color: "#3a5fd8" },
    { from: [64, 128], to: [192, 128], color: "#3a5fd8" },
  ],
  pll_gc: [
    { from: [64, 64], to: [64, 192], color: "#d43b2d" },
    { from: [64, 192], to: [192, 192], color: "#d43b2d" },
    { from: [192, 192], to: [64, 64], color: "#d43b2d" },
    { from: [64, 128], to: [128, 192], color: "#3a5fd8" },
    { from: [128, 192], to: [192, 128], color: "#3a5fd8" },
    { from: [192, 128], to: [64, 128], color: "#3a5fd8" },
  ],
  pll_gd: [
    { from: [192, 64], to: [192, 192], color: "#d43b2d" },
    { from: [192, 192], to: [64, 192], color: "#d43b2d" },
    { from: [64, 192], to: [192, 64], color: "#d43b2d" },
    { from: [192, 128], to: [128, 192], color: "#3a5fd8" },
    { from: [128, 192], to: [64, 128], color: "#3a5fd8" },
    { from: [64, 128], to: [192, 128], color: "#3a5fd8" },
  ],
};

function injectPLLArrows(svg, pattern, solvedDisplayPattern, id) {
  const cornerPoints = {
    0: [192, 192], // BR
    1: [192, 64], // TR
    2: [64, 64], // TL
    3: [64, 192], // BL
  };
  const edgePoints = {
    0: [128, 192], // B
    1: [192, 128], // R
    2: [128, 64], // T
    3: [64, 128], // L
  };

  const curCorners = pattern.patternData.CORNERS.pieces.slice(0, 4);
  const curEdges = pattern.patternData.EDGES.pieces.slice(0, 4);
  const solvedCorners = solvedDisplayPattern.patternData.CORNERS.pieces.slice(0, 4);
  const solvedEdges = solvedDisplayPattern.patternData.EDGES.pieces.slice(0, 4);

  const cornerTarget = new Map(solvedCorners.map((piece, idx) => [piece, idx]));
  const edgeTarget = new Map(solvedEdges.map((piece, idx) => [piece, idx]));

  const segments = [];

  function addArrow(from, to, color, width) {
    const [x1, y1] = from;
    const [x2, y2] = to;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const inset = 10;
    const sx = x1 + (dx / len) * inset;
    const sy = y1 + (dy / len) * inset;
    const ex = x2 - (dx / len) * inset;
    const ey = y2 - (dy / len) * inset;
    // Reverse visual direction so arrows match the training-sheet convention.
    segments.push(
      `<line x1="${ex}" y1="${ey}" x2="${sx}" y2="${sy}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" marker-end="url(#arrow-${color === "#d43b2d" ? "r" : "b"})" opacity="0.95"/>`
    );
  }

  const override = PLL_ARROW_OVERRIDES[id];
  if (override) {
    for (const seg of override) {
      addArrow(seg.from, seg.to, seg.color, seg.color === "#d43b2d" ? 10 : 9);
    }
  } else {
    for (let i = 0; i < 4; i++) {
      const target = cornerTarget.get(curCorners[i]);
      if (target != null && target !== i) addArrow(cornerPoints[i], cornerPoints[target], "#d43b2d", 10);
    }
    for (let i = 0; i < 4; i++) {
      const target = edgeTarget.get(curEdges[i]);
      if (target != null && target !== i) addArrow(edgePoints[i], edgePoints[target], "#3a5fd8", 9);
    }
  }

  if (segments.length === 0) return svg;

  const overlay = `
  <defs>
    <marker id="arrow-r" markerWidth="20" markerHeight="20" refX="16" refY="10" orient="auto" markerUnits="userSpaceOnUse">
      <path d="M0,0 L20,10 L0,20 z" fill="#d43b2d"/>
    </marker>
    <marker id="arrow-b" markerWidth="20" markerHeight="20" refX="16" refY="10" orient="auto" markerUnits="userSpaceOnUse">
      <path d="M0,0 L20,10 L0,20 z" fill="#3a5fd8"/>
    </marker>
  </defs>
  <g id="pll-arrows">${segments.join("")}</g>`;

  return svg.replace("</svg>", `${overlay}\n</svg>`);
}

function errorThumb(id, setName, message) {
  const a = setName === "OLL" ? "#f4b1b1" : "#b6d4f5";
  const b = setName === "OLL" ? "#e6d69d" : "#b9e2b8";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="204" height="204" viewBox="30 30 196 196" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${a}" />
      <stop offset="100%" stop-color="${b}" />
    </linearGradient>
  </defs>
  <rect x="32" y="32" width="192" height="192" rx="10" fill="#f7f7f7" stroke="#d6d6d6"/>
  <rect x="32" y="32" width="192" height="8" rx="6" fill="url(#g)"/>
  <text x="42" y="76" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#111">${escapeXml(id)}</text>
  <text x="42" y="98" font-family="Arial, sans-serif" font-size="12" fill="#777">Error generando SVG</text>
  <text x="42" y="118" font-family="Arial, sans-serif" font-size="10" fill="#999">${escapeXml(
    message.slice(0, 28)
  )}</text>
</svg>`;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const [rawJson, llTemplate, llFaceTemplate, kp] = await Promise.all([
    fs.readFile(DATA_PATH, "utf8"),
    cube3x3x3.llSVG(),
    cube3x3x3.llFaceSVG(),
    cube3x3x3.kpuzzle(),
  ]);

  const algs = JSON.parse(rawJson);
  const llColors = extractOriginalColors(llTemplate);
  const llFaceColors = extractOriginalColors(llFaceTemplate);
  const solvedDisplayPattern = kp.defaultPattern().applyAlg(DISPLAY_ORIENTATION);

  let generated = 0;
  let failed = 0;

  for (const item of algs) {
    const outPath = path.join(OUT_DIR, `${item.id}.svg`);
    try {
      const alg = new Alg(normalizeAlg(item.alg));
      // Rotate first (yellow on top), then apply the case in that rotated frame.
      const casePattern = kp.defaultPattern().applyAlg(DISPLAY_ORIENTATION).applyAlg(alg.invert());

      let svg;
      if (item.set === "PLL") {
        svg = colorizeTemplate(llFaceTemplate, casePattern, llFaceColors);
        svg = forcePLLYellowTop(svg);
        svg = styleCommon(svg, item.set);
        svg = injectPLLArrows(svg, casePattern, solvedDisplayPattern, item.id);
      } else {
        svg = colorizeTemplate(llTemplate, casePattern, llColors);
        svg = flattenOLLColors(svg);
        svg = styleCommon(svg, item.set);
      }

      await fs.writeFile(outPath, svg, "utf8");
      generated++;
    } catch (err) {
      failed++;
      await fs.writeFile(outPath, errorThumb(item.id, item.set, String(err?.message ?? err)), "utf8");
      console.warn(`Failed to generate ${item.id}:`, err?.message ?? err);
    }

    if (!item.thumb || item.thumb.startsWith("/thumbs/generated/")) {
      item.thumb = `/thumbs/generated/${item.id}.svg?${THUMB_URL_VERSION}`;
    }
  }

  await fs.writeFile(DATA_PATH, `${JSON.stringify(algs, null, 2)}\n`, "utf8");
  console.log(`Generated ${generated} thumbnails (${failed} failed).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
