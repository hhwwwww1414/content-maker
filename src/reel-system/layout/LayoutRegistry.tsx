import React, {createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {validateCollisions} from './CollisionGuard';
import {validateSafeZones} from './SafeZoneGuard';
import {assertSafe} from './safe-area';
import type {BoundingBox, CriticalElementKind, LayoutValidation, RegisteredLayoutElement} from './layout-types';

type LayoutRegistryValue = {
  elements: React.MutableRefObject<RegisteredLayoutElement[]>;
  register: (element: RegisteredLayoutElement) => void;
  unregister: (id: string) => void;
};

const LayoutRegistryContext = createContext<LayoutRegistryValue | null>(null);

export const LayoutRegistryProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const elements = useRef<RegisteredLayoutElement[]>([]);
  // Stable identity: register/unregister mutate the ref only. Never call
  // setState here — that would re-render every consumer and loop forever.
  const value = useMemo<LayoutRegistryValue>(() => ({
    elements,
    register: (element) => {
      elements.current = elements.current.filter((existing) => existing.id !== element.id).concat(element);
    },
    unregister: (id) => {
      elements.current = elements.current.filter((existing) => existing.id !== id);
    },
  }), []);

  return <LayoutRegistryContext.Provider value={value}>{children}</LayoutRegistryContext.Provider>;
};

export const useLayoutRegistry = () => useContext(LayoutRegistryContext);

/** Combined safe-zone + collision validation over the registered elements. */
export const runLayoutValidation = (elements: RegisteredLayoutElement[]): LayoutValidation => {
  const safe = validateSafeZones(elements);
  const collision = validateCollisions(elements);
  return {valid: safe.valid && collision.valid, errors: [...safe.errors, ...collision.errors]};
};

const useRegisterCritical = (id: string, kind: CriticalElementKind, box: BoundingBox) => {
  const registry = useLayoutRegistry();
  // Register as a post-commit effect (not a render-body side effect).
  useLayoutEffect(() => {
    if (!registry) return;
    registry.register({id, kind, box});
    return () => registry.unregister(id);
    // Serialize box so identical geometry doesn't re-run the effect every frame.
  }, [registry, id, kind, box.x, box.y, box.width, box.height]);
  // Per-element safe-zone assert (throws only when REEL_QA=1).
  assertSafe(box, id);
};

/**
 * Registers a critical layout element and enforces the Instagram safe zones.
 * Under REEL_QA=1 an out-of-bounds box throws immediately, failing the render.
 */
export const CriticalBox: React.FC<{
  id: string;
  kind: CriticalElementKind;
  box: BoundingBox;
  children: React.ReactNode;
}> = ({id, kind, box, children}) => {
  useRegisterCritical(id, kind, box);
  return <div data-critical-element={kind}>{children}</div>;
};

/** Backwards-compatible alias — existing reels keep working and gain enforcement. */
export const CriticalElement = CriticalBox;

/**
 * Dev-only banner: after commit, reads the registry and surfaces safe-zone /
 * collision errors visibly in Studio. Does not render during REEL_QA renders
 * (there the per-box assert already throws).
 */
export const LayoutDevBanner: React.FC = () => {
  const registry = useLayoutRegistry();
  const [errors, setErrors] = useState<string[]>([]);
  useEffect(() => {
    if (!registry) return;
    // Runs after children have registered (child effects fire before parent).
    const result = runLayoutValidation(registry.elements.current);
    setErrors(result.errors);
  }, [registry]);
  if (errors.length === 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '12px 16px',
        background: 'rgba(142,32,28,0.92)',
        color: '#fecaca',
        fontFamily: 'monospace',
        fontSize: 18,
        lineHeight: 1.4,
        zIndex: 9999,
        pointerEvents: 'none',
        whiteSpace: 'pre-wrap',
      }}
    >
      {`⚠ LAYOUT VIOLATIONS (${errors.length})\n` + errors.join('\n')}
    </div>
  );
};
