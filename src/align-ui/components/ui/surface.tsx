import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import * as Button from './button';

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-20 bg-bg-white-0 text-text-strong-950 shadow-regular-md',
        className,
      )}
      {...props}
    />
  );
}

export function Header({
  title,
  description,
  onClose,
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div className={cn('flex items-start gap-3 border-b border-stroke-soft-200 px-4 py-3', className)}>
      <div className='min-w-0 flex-1'>
        {title && <div className='truncate text-label-sm text-text-strong-950'>{title}</div>}
        {description && <div className='mt-0.5 truncate text-paragraph-xs text-text-sub-600'>{description}</div>}
        {children}
      </div>
      {onClose && (
        <Button.Root type='button' variant='neutral' mode='ghost' size='xxsmall' className='size-7 p-0' onClick={onClose}>
          <Button.Icon as={X} className='size-4' />
        </Button.Root>
      )}
    </div>
  );
}
