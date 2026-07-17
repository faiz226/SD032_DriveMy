import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence
} from 'motion/react';
import React, { Children, cloneElement, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type DockItemData = {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick?: () => void;
  className?: string;
  href?: string;
};

export type DockProps = {
  items?: DockItemData[];
  children?: React.ReactNode;
  className?: string;
  distance?: number;
  panelWidth?: number;
  baseItemSize?: number;
  dockWidth?: number;
  magnification?: number;
  spring?: SpringOptions;
};

type DockItemProps = {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  mouseY?: MotionValue<number>;
  spring?: SpringOptions;
  distance?: number;
  baseItemSize?: number;
  magnification?: number;
};

export function DockItem({
  children,
  className = '',
  onClick,
  mouseY,
  spring,
  distance,
  magnification = 60,
  baseItemSize = 44
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);
  const defaultMouseY = useMotionValue(0);

  const mouseDistance = useTransform(mouseY || defaultMouseY, val => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      y: 0,
      height: baseItemSize
    };
    return val - rect.y - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance, 
    [-(distance || 150), 0, (distance || 150)], 
    [baseItemSize, magnification, baseItemSize]
  );
  const size = useSpring(targetSize, spring || { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.div
      ref={ref}
      style={{
        width: size,
        height: size
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center rounded-xl transition-colors outline-none",
        "bg-transparent hover:bg-accent hover:text-accent-foreground text-muted-foreground",
        className
      )}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
    >
      {Children.map(children, child =>
        React.isValidElement(child)
          ? cloneElement(child as React.ReactElement<{ isHovered?: MotionValue<number> }>, { isHovered })
          : child
      )}
    </motion.div>
  );
}

type DockLabelProps = {
  className?: string;
  children: React.ReactNode;
  isHovered?: MotionValue<number>;
};

export function DockLabel({ children, className = '', isHovered }: DockLabelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    const unsubscribe = isHovered.on('change', latest => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "absolute left-full ml-4 w-fit whitespace-pre rounded-md border border-border bg-popover text-popover-foreground px-2 py-1 text-xs font-semibold shadow-md z-50",
            className
          )}
          role="tooltip"
          style={{ y: '-50%', top: '50%' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type DockIconProps = {
  className?: string;
  children: React.ReactNode;
  isHovered?: MotionValue<number>;
};

export function DockIcon({ children, className = '' }: DockIconProps) {
  return <div className={cn("flex items-center justify-center pointer-events-none", className)}>{children}</div>;
}

export function VerticalDock({
  items,
  children,
  className = '',
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 60,
  distance = 150,
  panelWidth = 68,
  dockWidth: _dockWidth = 256,
  baseItemSize = 40
}: DockProps) {
  const mouseY = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  return (
    <motion.div style={{ width: panelWidth, scrollbarWidth: 'none' }} className="flex justify-center items-center h-full w-full">
      <motion.div
        onMouseMove={({ pageY }) => {
          isHovered.set(1);
          mouseY.set(pageY);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseY.set(Infinity);
        }}
        className={cn("flex flex-col items-center justify-center gap-2 py-4", className)}
        role="toolbar"
        aria-label="Application dock"
      >
        {children ? (
          // If children are passed, inject mouseY, spring, etc. into DockItem children
          Children.map(children, child => {
            if (React.isValidElement(child)) {
              return cloneElement(child as React.ReactElement<any>, {
                mouseY,
                spring,
                distance,
                magnification,
                baseItemSize
              });
            }
            return child;
          })
        ) : (
          items?.map((item, index) => (
            <DockItem
              key={index}
              onClick={item.onClick}
              className={item.className}
              mouseY={mouseY}
              spring={spring}
              distance={distance}
              magnification={magnification}
              baseItemSize={baseItemSize}
            >
              <DockIcon>{item.icon}</DockIcon>
              <DockLabel>{item.label}</DockLabel>
            </DockItem>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}
