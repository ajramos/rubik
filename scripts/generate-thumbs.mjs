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
const THUMB_URL_VERSION = "v11";

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

function sourceStickerIdForPattern(pattern, orbitName, idx, orientation) {
  const orbit = pattern.kpuzzle.definition.orbits.find((o) => o.orbitName === orbitName);
  if (!orbit) return null;
  const orbitState = pattern.patternData[orbitName];
  return `${orbitName}-l${orbitState.pieces[idx]}-o${
    (orbit.numOrientations - orbitState.orientation[idx] + orientation) % orbit.numOrientations
  }`;
}

function stickerIsYellow(pattern, originalColors, id) {
  const m = id.match(/^([A-Z]+)-l(\d+)-o(\d+)$/);
  if (!m) return false;
  const [, orbitName, idxRaw, oriRaw] = m;
  const sourceId = sourceStickerIdForPattern(pattern, orbitName, Number(idxRaw), Number(oriRaw));
  if (!sourceId) return false;
  const fill = (originalColors.get(sourceId) || "").trim().toLowerCase();
  return fill === "yellow" || fill === "#ff0" || fill === "#ffff00";
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

function addOLLPerimeterInfo(svg, pattern, originalColors) {
  const slots = [
    { id: "CORNERS-l2-o2", x: 46, y: 22, w: 36, h: 8 },  // top-left
    { id: "EDGES-l2-o1", x: 110, y: 22, w: 36, h: 8 },   // top-mid
    { id: "CORNERS-l1-o1", x: 174, y: 22, w: 36, h: 8 }, // top-right

    { id: "CORNERS-l1-o2", x: 226, y: 46, w: 8, h: 36 }, // right-top
    { id: "EDGES-l1-o1", x: 226, y: 110, w: 8, h: 36 },  // right-mid
    { id: "CORNERS-l0-o1", x: 226, y: 174, w: 8, h: 36 }, // right-bottom

    { id: "CORNERS-l0-o2", x: 174, y: 226, w: 36, h: 8 }, // bottom-right
    { id: "EDGES-l0-o1", x: 110, y: 226, w: 36, h: 8 },   // bottom-mid
    { id: "CORNERS-l3-o1", x: 46, y: 226, w: 36, h: 8 },  // bottom-left

    { id: "CORNERS-l3-o2", x: 22, y: 174, w: 8, h: 36 }, // left-bottom
    { id: "EDGES-l3-o1", x: 22, y: 110, w: 8, h: 36 },   // left-mid
    { id: "CORNERS-l2-o1", x: 22, y: 46, w: 8, h: 36 },  // left-top
  ];

  const bars = slots.map((slot) => {
    const isYellow = stickerIsYellow(pattern, originalColors, slot.id);
    return `<rect x="${slot.x}" y="${slot.y}" width="${slot.w}" height="${slot.h}" rx="2" fill="${
      isYellow ? "#f2e700" : "#e7e7e7"
    }" stroke="#1e1e1e" stroke-width="1.5"/>`;
  });

  return svg.replace("</svg>", `<g id="oll-perimeter">${bars.join("")}</g>\n</svg>`);
}

function addPLLPerimeterInfo(svg, pattern, originalColors) {
  const slots = [
    { id: "CORNERS-l2-o2", x: 46, y: 22, w: 36, h: 8 },  // top-left
    { id: "EDGES-l2-o1", x: 110, y: 22, w: 36, h: 8 },   // top-mid
    { id: "CORNERS-l1-o1", x: 174, y: 22, w: 36, h: 8 }, // top-right

    { id: "CORNERS-l1-o2", x: 226, y: 46, w: 8, h: 36 }, // right-top
    { id: "EDGES-l1-o1", x: 226, y: 110, w: 8, h: 36 },  // right-mid
    { id: "CORNERS-l0-o1", x: 226, y: 174, w: 8, h: 36 }, // right-bottom

    { id: "CORNERS-l0-o2", x: 174, y: 226, w: 36, h: 8 }, // bottom-right
    { id: "EDGES-l0-o1", x: 110, y: 226, w: 36, h: 8 },   // bottom-mid
    { id: "CORNERS-l3-o1", x: 46, y: 226, w: 36, h: 8 },  // bottom-left

    { id: "CORNERS-l3-o2", x: 22, y: 174, w: 8, h: 36 }, // left-bottom
    { id: "EDGES-l3-o1", x: 22, y: 110, w: 8, h: 36 },   // left-mid
    { id: "CORNERS-l2-o1", x: 22, y: 46, w: 8, h: 36 },  // left-top
  ];

  const bars = slots.map((slot) => {
    const sourceId = sourceStickerIdForPattern(
      pattern,
      slot.id.split("-")[0],
      Number(slot.id.match(/-l(\d+)-/)?.[1]),
      Number(slot.id.match(/-o(\d+)$/)?.[1])
    );
    const fill = sourceId ? originalColors.get(sourceId) || "#e7e7e7" : "#e7e7e7";
    return `<rect x="${slot.x}" y="${slot.y}" width="${slot.w}" height="${slot.h}" rx="2" fill="${fill}" stroke="#1e1e1e" stroke-width="1.5"/>`;
  });

  return svg.replace("</svg>", `<g id="pll-perimeter">${bars.join("")}</g>\n</svg>`);
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

function styleCommon(svg) {
  const frame = `
  <rect x="16" y="16" width="224" height="224" rx="14" fill="#ffffff" stroke="#d8d8d8" stroke-width="1.5"></rect>
`;
  svg = svg.replace(/<svg([^>]*)>/, `<svg$1>${frame}`);
  svg = svg.replace(/viewBox="30 30 196 196"/, 'viewBox="16 16 224 224"');
  svg = svg.replace(/width="204px"/, 'width="224px"');
  svg = svg.replace(/height="204px"/, 'height="224px"');
  svg = svg.replace(/<title>.*?<\/title>\s*/s, "");
  svg = svg.replace(/stroke-width="16px"/g, 'stroke-width="6px"');
  svg = svg.replace(/stroke="#000000"/g, 'stroke="#1e1e1e"');
  svg = svg.replace(/stroke="black"/g, 'stroke="#1e1e1e"');
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
    { from: [64, 64], to: [64, 192], color: "#d43b2d", double: true },
    { from: [192, 64], to: [192, 192], color: "#d43b2d", double: true },
  ],
  pll_na: [
    { from: [64, 64], to: [192, 192], color: "#d43b2d" },
    { from: [128, 64], to: [128, 192], color: "#3a5fd8", double: true },
  ],
  pll_nb: [
    { from: [64, 192], to: [192, 64], color: "#d43b2d" },
    { from: [128, 64], to: [128, 192], color: "#3a5fd8", double: true },
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

  const mk = (seg, width) => ({
    ...seg,
    width,
  });

  function addArrow(from, to, color, width, double = false) {
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
    const kind = color === "#d43b2d" ? "r" : "b";
    const markerAttrs = double
      ? `marker-start="url(#arrow-${kind})" marker-end="url(#arrow-${kind})"`
      : `marker-end="url(#arrow-${kind})"`;
    // Reverse visual direction so arrows match the training-sheet convention.
    segments.push(
      `<line x1="${ex}" y1="${ey}" x2="${sx}" y2="${sy}" stroke="${color}" stroke-width="${width}" stroke-linecap="square" stroke-linejoin="round" vector-effect="non-scaling-stroke" ${markerAttrs} opacity="0.95"/>`
    );
  }

  function addArrowSet(rows) {
    for (const seg of rows) {
      addArrow(seg.from, seg.to, seg.color, seg.width, Boolean(seg.double));
    }
  }

  function cycleArrows(points, mapping, color, width) {
    const visited = new Set();
    for (let i = 0; i < mapping.length; i++) {
      if (visited.has(i) || mapping[i] == null || mapping[i] === i) continue;
      const cycle = [];
      let cur = i;
      while (!visited.has(cur) && mapping[cur] != null) {
        visited.add(cur);
        cycle.push(cur);
        cur = mapping[cur];
      }

      if (cycle.length === 2 && mapping[cycle[0]] === cycle[1] && mapping[cycle[1]] === cycle[0]) {
        addArrow(points[cycle[0]], points[cycle[1]], color, width, true);
        continue;
      }

      for (const fromIdx of cycle) {
        const toIdx = mapping[fromIdx];
        if (toIdx != null && toIdx !== fromIdx) {
          addArrow(points[fromIdx], points[toIdx], color, width, false);
        }
      }
    }
  }

  const override = PLL_ARROW_OVERRIDES[id];
  if (override) {
    addArrowSet(
      override.map((seg) => mk(seg, seg.color === "#d43b2d" ? 10 : 9))
    );
  } else {
    const cornerMapping = curCorners.map((piece) => cornerTarget.get(piece));
    const edgeMapping = curEdges.map((piece) => edgeTarget.get(piece));
    cycleArrows(cornerPoints, cornerMapping, "#d43b2d", 10);
    cycleArrows(edgePoints, edgeMapping, "#3a5fd8", 9);
  }

  if (segments.length === 0) return svg;

  const overlay = `
  <defs>
    <marker id="arrow-r" markerWidth="20" markerHeight="20" refX="16" refY="10" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
      <path d="M0,0 L20,10 L0,20 z" fill="#d43b2d"/>
    </marker>
    <marker id="arrow-b" markerWidth="20" markerHeight="20" refX="16" refY="10" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
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

  const [rawJson, llFaceTemplate, kp] = await Promise.all([
    fs.readFile(DATA_PATH, "utf8"),
    cube3x3x3.llFaceSVG(),
    cube3x3x3.kpuzzle(),
  ]);

  const algs = JSON.parse(rawJson);
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
        svg = styleCommon(svg);
        svg = addPLLPerimeterInfo(svg, casePattern, llFaceColors);
        svg = injectPLLArrows(svg, casePattern, solvedDisplayPattern, item.id);
      } else {
        svg = colorizeTemplate(llFaceTemplate, casePattern, llFaceColors);
        svg = flattenOLLColors(svg);
        svg = styleCommon(svg);
        svg = addOLLPerimeterInfo(svg, casePattern, llFaceColors);
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
