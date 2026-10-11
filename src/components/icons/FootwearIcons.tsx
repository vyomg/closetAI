// Small, consistent line-art icons for each footwear type offered in
// onboarding's "what footwear do you gravitate to?" step — same 24x24,
// stroke-based, rounded-cap visual language as lucide-react (which supplies
// Sneakers via its own SportShoe icon) so these read as one icon family,
// not a mismatched set of random glyphs.
import type { SVGProps } from "react";

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function LoaferIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 19c0-2.2 1-3.6 3.3-4.5l8.5-3.3c1.6-.6 3.3 0 4.2 1.4l.7 1.1c.7 1.1 1.9 1.8 3.2 2 .4 1.1.6 2.2.6 3.3H2.5Z" />
      <path d="M7 15.3h7" />
    </svg>
  );
}

export function BootIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M6.5 21V5c0-.8.6-1.4 1.4-1.4h1.7c.8 0 1.4.6 1.4 1.4v5.8h2.4c2.8 0 4.6 1.5 4.6 4.2V21H6.5Z" />
      <path d="M6.5 17.3h11.5" />
      <path d="M9 7.3h2" />
    </svg>
  );
}

export function FormalShoeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 19.3c0-3.1 1.5-5 4.9-6.1l5.3-2.5c1.3-.6 2.8-.3 3.7.9l1.7 2.1c.5.6 1.1.9 1.9 1.1.8.2 1.3.9 1.3 1.8v2.7H2.5Z" />
      <path d="M8 14 10.5 15.5M10.5 12.3 13 13.8" />
    </svg>
  );
}

export function SandalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 16.5c0-1.4 1.1-2.2 3-2.2h13c1.9 0 3 .8 3 2.2S20.4 19 18.5 19h-13c-1.9 0-3-1.1-3-2.5Z" />
      <path d="M12 14.3 8.5 9M12 14.3 15.5 9" />
    </svg>
  );
}
