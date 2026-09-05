/** Marca decorativa: o nome acessível pertence ao link ou texto que a acompanha. */
export function CraterLogo({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      height="64"
      viewBox="0 0 64 64"
      width="64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4">
        <path d="M45 10C36 3 21 5 13 14C4 23 3 37 10 47C18 59 36 61 48 51" />
        <path d="M40 17C33 12 24 14 18 20C12 27 12 37 18 44C24 51 35 52 42 46" />
        <path d="M35 24C31 21 25 24 23 28C20 34 24 42 31 43C34 43 37 42 39 40" />
        <path d="M46 16V25C46 30 56 30 56 25V16M51 16V47" />
      </g>
    </svg>
  );
}
