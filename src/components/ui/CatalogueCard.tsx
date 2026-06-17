'use client';

import Link from 'next/link';

interface CatalogueCardProps {
  id: string;
  title: string;
  subtitle: string;
  tag?: string;
  href: string;
  isActive: boolean;
  locale: string;
  browseLabel?: string;
  comingSoonLabel?: string;
}

export default function CatalogueCard({
  id,
  title,
  subtitle,
  tag,
  href,
  isActive,
  locale,
  browseLabel = 'Browse →',
  comingSoonLabel = 'Coming Soon',
}: CatalogueCardProps) {
  const inner = (
    <div
      className={`relative rounded-xl border h-full transition-all duration-200 ${
        isActive
          ? 'bg-[#FAF6EE] border-[#B8860B]/40 hover:border-[#B8860B] hover:shadow-[0_4px_20px_rgba(184,134,11,0.18)] hover:-translate-y-0.5 cursor-pointer'
          : 'border-dashed border-gray-300 opacity-70 cursor-default'
      }`}
      style={isActive ? undefined : { background: '#f5f5f5' }}
    >
      {!isActive && (
        <div className="absolute top-2 end-2 text-[9px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 font-medium">
          {comingSoonLabel}
        </div>
      )}
      <div className="p-5">
        {tag && (
          <div className="text-[10px] text-[#B8860B]/70 tracking-widest uppercase font-medium mb-2">
            {tag}
          </div>
        )}
        <div className={`font-amiri text-[15px] leading-snug mb-1.5 ${isActive ? 'text-amber-900' : 'text-gray-400'}`}>
          {title}
        </div>
        <div className={`text-[11px] mb-3 ${isActive ? 'text-amber-700/70' : 'text-gray-400'}`}>
          {subtitle}
        </div>
        {isActive && (
          <div className="inline-flex items-center gap-1 text-[11px] text-[#B8860B] font-medium border border-[#B8860B]/40 rounded-full px-2.5 py-0.5">
            {browseLabel}
          </div>
        )}
      </div>
    </div>
  );

  if (isActive && href) {
    return (
      <Link key={id} href={`/${locale}${href}`} className="block h-full">
        {inner}
      </Link>
    );
  }
  return <div key={id}>{inner}</div>;
}
