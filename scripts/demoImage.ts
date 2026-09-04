// Generates simple, tasteful flat-silhouette SVGs for demo wardrobe items so
// the app looks populated out of the box without needing real product
// photography (which we have no rights to bundle). Real user uploads are
// always actual photos processed by Claude vision — these are clearly
// schematic and only ever used for the seeded demo account.

const COLOR_HEX: Record<string, string> = {
  Black: "#1c1b18",
  White: "#f6f4ee",
  Grey: "#9c988c",
  Navy: "#212d45",
  Blue: "#3d5a85",
  Beige: "#d8c6a1",
  Brown: "#6b4a30",
  Tan: "#c9a878",
  Olive: "#6b6b47",
  Green: "#4a6741",
  Red: "#a33d3d",
  Burgundy: "#6d2c3a",
  Pink: "#d99aa6",
  Purple: "#6c5c8c",
  Yellow: "#d9b64a",
  Orange: "#c97a3a",
  Cream: "#efe6d3",
};

export function colorHex(name: string): string {
  return COLOR_HEX[name] ?? "#a8a296";
}

function shirtPath(sleeve: "short" | "long" = "short") {
  const sleeveEnd = sleeve === "long" ? 340 : 210;
  return `M150,90 L170,60 L230,60 L250,90 L${sleeve === "long" ? 330 : 300},${sleeveEnd - 40}
    L${sleeve === "long" ? 300 : 280},${sleeveEnd} L250,150 L250,420 L150,420 L150,150
    L${sleeve === "long" ? 100 : 120},${sleeveEnd} L${sleeve === "long" ? 70 : 100},${sleeveEnd - 40} Z`;
}

function jacketPath() {
  return `M140,85 L170,55 L200,80 L230,55 L260,85 L300,120 L275,165 L250,140 L250,430 L150,430
    L150,140 L125,165 L100,120 Z`;
}

function pantsPath() {
  return `M150,60 L250,60 L260,420 L215,420 L200,220 L185,420 L140,420 Z`;
}

function shortsPath() {
  return `M150,60 L250,60 L255,240 L215,240 L205,180 L195,240 L145,240 Z`;
}

function shoePath() {
  return `M90,340 L90,300 Q90,270 130,265 L200,255 L260,220 Q300,200 320,225 Q335,250 300,270
    L310,320 Q315,345 280,350 L110,350 Q90,350 90,340 Z`;
}

function bagPath() {
  return `M130,180 Q130,120 200,120 Q270,120 270,180 L270,180 L300,180 L310,400 L90,400 L100,180 Z
    M155,180 Q155,145 200,145 Q245,145 245,180`;
}

function accessoryShape(sub: string) {
  switch (sub) {
    case "Watch":
      return `<circle cx="200" cy="250" r="70" /><rect x="185" y="90" width="30" height="70" rx="8" /><rect x="185" y="330" width="30" height="70" rx="8" />`;
    case "Belt":
      return `<rect x="60" y="220" width="280" height="45" rx="8" /><rect x="180" y="212" width="40" height="60" rx="6" fill="#ffffff" opacity="0.35" />`;
    case "Cap":
      return `<path d="M110,260 Q110,150 200,150 Q290,150 290,260 Z" /><rect x="90" y="255" width="130" height="24" rx="10" />`;
    case "Sunglasses":
      return `<circle cx="150" cy="250" r="55" /><circle cx="270" cy="250" r="55" /><rect x="195" y="240" width="30" height="14" />`;
    case "Jewellery":
      return `<circle cx="200" cy="230" r="80" fill="none" stroke-width="14" /><circle cx="200" cy="310" r="16" />`;
    default:
      return bagPath().replace("M130,180", "M130,180").length
        ? `<path d="${bagPath()}" />`
        : "";
  }
}

export function silhouettePath(category: string, subcategory: string): string {
  if (category === "Tops") {
    return shirtPath(subcategory === "Sweater" || subcategory === "Hoodie" || subcategory === "Crewneck" ? "long" : "short");
  }
  if (category === "Outerwear") return jacketPath();
  if (category === "Bottoms") return subcategory === "Shorts" ? shortsPath() : pantsPath();
  if (category === "Shoes") return shoePath();
  return ""; // Accessories use accessoryShape() with custom markup instead
}

export function buildDemoSvg({
  category,
  subcategory,
  primaryColor,
  pattern,
}: {
  category: string;
  subcategory: string;
  primaryColor: string;
  pattern: string;
}): string {
  const fill = colorHex(primaryColor);
  const isAccessory = category === "Accessories";
  const shapeMarkup = isAccessory
    ? `<g fill="${fill}" stroke="${fill}">${accessoryShape(subcategory)}</g>`
    : `<path d="${silhouettePath(category, subcategory)}" fill="${fill}" stroke="#00000022" stroke-width="2" />`;

  const stripes =
    pattern === "Striped"
      ? Array.from({ length: 8 })
          .map((_, i) => `<rect x="0" y="${i * 60}" width="400" height="14" fill="#ffffff" opacity="0.18" />`)
          .join("")
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
    <rect width="400" height="500" fill="#f2efe6" />
    <g>${shapeMarkup}</g>
    <g>${stripes}</g>
  </svg>`;
}
