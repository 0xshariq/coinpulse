'use client';

import { Separator as SeparatorPrimitive } from '@base-ui/react/separator';

import { cn } from '@/lib/utils';

function Separator({ className, orientation = 'horizontal', ...props }: SeparatorPrimitive.Props) {
  const base = 'shrink-0 bg-border';

  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={(state: any) =>
        cn(
          base,
          state.orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch',
          typeof className === 'function' ? className(state) : className,
        )
      }
      {...props}
    />
  );
}

export { Separator };
