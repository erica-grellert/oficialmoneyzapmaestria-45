import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getImpersonationState,
  startImpersonation as startImpersonationSession,
  stopImpersonation as stopImpersonationSession,
  subscribeImpersonation,
  type ImpersonationState,
} from "@/lib/impersonation";

export const useImpersonation = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<ImpersonationState | null>(() =>
    getImpersonationState()
  );
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  useEffect(() => subscribeImpersonation(() => {
    setState(getImpersonationState());
  }), []);

  const startImpersonation = useCallback(
    async (userId: string) => {
      setIsStarting(true);
      try {
        const user = await startImpersonationSession(userId);
        navigate("/dashboard", { replace: true });
        return user;
      } finally {
        setIsStarting(false);
      }
    },
    [navigate]
  );

  const stopImpersonation = useCallback(async () => {
    setIsStopping(true);
    try {
      const restored = await stopImpersonationSession();
      if (restored) {
        navigate("/admin", { replace: true });
      }
      return restored;
    } finally {
      setIsStopping(false);
    }
  }, [navigate]);

  return {
    state,
    isImpersonating: state !== null,
    isStarting,
    isStopping,
    startImpersonation,
    stopImpersonation,
  };
};
