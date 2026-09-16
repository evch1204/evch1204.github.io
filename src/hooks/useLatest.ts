import { useLayoutEffect, useRef } from 'react';

/**
 * A ref that always holds the latest `value`, for callbacks and listeners
 * that outlive the render they were made in. Written after commit rather
 * than during render, which is what keeps it honest under concurrent
 * rendering — and what the hooks lint asks for.
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
