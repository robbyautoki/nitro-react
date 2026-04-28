// AlignUI Avatar Empty Icons — ported into nitro-react

import * as React from 'react';

export function IconEmptyUser(props: React.SVGProps<SVGSVGElement>) {
  const clipPathId = React.useId();

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 80 80'
      {...props}
    >
      <g fill='currentColor' clipPath={`url(#${clipPathId})`}>
        <ellipse cx={40} cy={78} fillOpacity={0.72} rx={32} ry={24} />
        <circle cx={40} cy={32} r={16} opacity={0.9} />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <rect width={80} height={80} fill='#fff' rx={40} />
        </clipPath>
      </defs>
    </svg>
  );
}

export function IconEmptyCompany(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={56}
      height={56}
      fill='none'
      viewBox='0 0 56 56'
      {...props}
    >
      <rect width={56} height={56} className='fill-bg-soft-200' rx={28} />
      <path
        fill='currentColor'
        opacity={0.6}
        d='M21 14a2.8 2.8 0 012.8-2.8h21a2.8 2.8 0 012.8 2.8v49a2.8 2.8 0 01-2.8 2.8h-21A2.8 2.8 0 0121 63V14z'
      />
    </svg>
  );
}
