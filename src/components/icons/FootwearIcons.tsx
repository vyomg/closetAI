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
      <path d="M5 21V8.5c0-1 .7-1.7 1.7-1.7h2.6l1.9 1.9h3.1c2 0 3.2 1.1 3.6 3l.4 1.8c1.5.3 2.2 1.5 2.2 3.1V21H5Z" />
      <path d="M5 16.5h16" />
    </svg>
  );
}

export function FormalShoeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3 19c0-3.3 1.6-5.3 5.2-6.5l5.6-2.7c1.4-.7 3-.3 4 .9l1.8 2.2c.5.6 1.2 1 2 1.2.9.2 1.4 1 1.4 2v3H3Z" />
      <path d="M9.5 13.2 11 14.5M12.5 11.7 14 13" />
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
