import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizeClasses = { sm: 'w-7 h-7', md: 'w-9 h-9', lg: 'w-14 h-14' };
  const textSizeClasses = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' };
  const subTextSizeClasses = { sm: 'text-[9px]', md: 'text-[10px]', lg: 'text-xs' };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} relative rounded-xl overflow-hidden ring-1 ring-white/10`}>
        <Image src="/logo.png" alt="Bytes Flare Infotech" fill className="object-contain" priority />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizeClasses[size]} font-bold text-slate-100 leading-tight tracking-tight`}>
            Bytes Flare
          </span>
          <span className={`${subTextSizeClasses[size]} text-indigo-400 font-semibold tracking-[0.15em] uppercase`}>
            Infotech
          </span>
        </div>
      )}
    </div>
  );
}
