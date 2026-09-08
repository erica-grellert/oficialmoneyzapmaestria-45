import gsap from "gsap";
import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/useAdminExperience";

export function useGsapContext(
  setup: (ctx: gsap.Context) => void | (() => void),
  deps: unknown[] = []
) {
  const reducedMotion = usePrefersReducedMotion();
  const scopeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!scopeRef.current) return;

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(scopeRef.current, { clearProps: "all" });
        return;
      }
      setup(ctx);
    }, scopeRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, ...deps]);

  return scopeRef;
}

export function animateMetricCount(
  element: HTMLElement | null,
  value: number,
  reducedMotion: boolean
) {
  if (!element) return;

  if (reducedMotion) {
    element.textContent = new Intl.NumberFormat("pt-BR").format(value);
    return;
  }

  const state = { value: 0 };
  gsap.to(state, {
    value,
    duration: 1.15,
    ease: "power2.out",
    onUpdate: () => {
      element.textContent = new Intl.NumberFormat("pt-BR").format(
        Math.round(state.value)
      );
    },
  });
}
