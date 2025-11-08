import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 4.97-3 9-6 9s-6-4.03-6-9" />
      <path d="M12 17v4" />
      <path d="M4 14a4 4 0 0 1 8 0" />
      <path d="M16 14a4 4 0 0 1 8 0" />
    </svg>
  );
}
