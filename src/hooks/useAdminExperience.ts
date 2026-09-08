import { useEffect, useState } from "react";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function useCanUseWebGL() {
  const [canUse, setCanUse] = useState(false);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setCanUse(!!gl);
    } catch {
      setCanUse(false);
    }
  }, []);

  return canUse;
}

export function formatAdminMetric(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}
