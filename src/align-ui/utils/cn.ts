import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}

export { type ClassValue } from 'clsx';

export const twMergeConfig = {
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'title-h1',
            'title-h2',
            'title-h3',
            'title-h4',
            'title-h5',
            'title-h6',
            'label-xl',
            'label-lg',
            'label-md',
            'label-sm',
            'label-xs',
            'paragraph-xl',
            'paragraph-lg',
            'paragraph-md',
            'paragraph-sm',
            'paragraph-xs',
            'subheading-md',
            'subheading-sm',
            'subheading-xs',
            'subheading-2xs',
          ],
        },
      ],
      shadow: [
        {
          shadow: [
            'regular-xs',
            'regular-sm',
            'regular-md',
            'tooltip',
            'button-primary-focus',
            'button-important-focus',
            'button-error-focus',
            'fancy-buttons-neutral',
            'fancy-buttons-primary',
            'fancy-buttons-error',
            'fancy-buttons-stroke',
          ],
        },
      ],
      rounded: [
        {
          rounded: ['10', '12', '16', '20'],
        },
      ],
    },
  },
};

const customTwMerge = extendTailwindMerge(twMergeConfig);
