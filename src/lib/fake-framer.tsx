import React from 'react';

// Fake Motion implementation that just renders the element without animations
const createFakeMotionTag = (tag: string) => (props: any) => {
  const { 
    animate, 
    initial, 
    exit, 
    transition, 
    variants, 
    layoutId, 
    whileHover, 
    whileTap, 
    whileDrag, 
    whileFocus, 
    whileInView, 
    viewport, 
    layout, 
    drag, 
    dragConstraints, 
    dragElastic, 
    dragMomentum, 
    onDragStart, 
    onDragEnd, 
    onDrag, 
    onAnimationStart, 
    onAnimationComplete, 
    layoutDependency,
    ...rest 
  } = props;
  return React.createElement(tag, rest);
};

// Use Proxy so that accessing ANY motion tag (e.g., motion.div, motion.span, motion.header, motion.a, motion.svg)
// on-the-fly dynamically creates its fake tag component and caches it on the target object.
export const motion = new Proxy({} as any, {
  get: (target, prop) => {
    if (typeof prop === 'string') {
      if (!target[prop]) {
        target[prop] = createFakeMotionTag(prop);
      }
      return target[prop];
    }
    return undefined;
  }
});

export const AnimatePresence = ({ children, ...props }: any) => <>{children}</>;

export const useMotionValue = (value: any) => ({ get: () => value, set: () => {} });
export const useTransform = () => {};
