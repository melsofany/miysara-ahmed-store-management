interface LogoProps {
  size?: number;
  withText?: boolean;
  variant?: 'full' | 'compact';
}

export function Logo({ size = 40, withText = true, variant = 'full' }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white shadow-md"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-1/2 w-1/2"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
        </svg>
      </div>
      {withText && (
        <div className="leading-tight">
          <p className="text-base font-extrabold tracking-tight text-slate-800">
            MIYSARA <span className="text-teal-700">Ahmed</span>
          </p>
          {variant === 'full' && (
            <p className="text-[11px] font-medium text-slate-400">ميسرة أحمد — إدارة المتاجر</p>
          )}
        </div>
      )}
    </div>
  );
}
