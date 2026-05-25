import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";

const OAUTH_BACKEND_BASE = (import.meta.env.VITE_AUTH_BACKEND_URL as string | undefined) || "http://localhost:5000";

function readOAuthTokensFromUrl() {
  const queryParams = new URLSearchParams(window.location.search);
  return {
    oauthToken: queryParams.get("oauthToken"),
  };
}

export function AuthSuccess() {
  const navigate = useNavigate();
  const { applySession } = useAuth();
  const [message, setMessage] = useState("Completing secure sign-in...");

  const oauthSession = useMemo(() => readOAuthTokensFromUrl(), []);

  useEffect(() => {
    async function completeOAuthLogin() {
      if (!oauthSession.oauthToken) {
        navigate("/auth?error=invalid_callback", { replace: true });
        return;
      }

      try {
        setMessage("Validating session...");
        const response = await fetch(
          `${OAUTH_BACKEND_BASE}/api/auth/oauth/session?token=${encodeURIComponent(oauthSession.oauthToken)}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const payload = await response.json();
        if (!response.ok || !payload?.data?.accessToken || !payload?.data?.refreshToken) {
          throw new Error(payload?.message || "Invalid OAuth callback");
        }

        applySession(payload.data);

        setMessage("Redirecting to your dashboard...");
        navigate("/dashboard", { replace: true });
      } catch {
        navigate("/auth?error=token_generation_failed", { replace: true });
      }
    }

    completeOAuthLogin();
  }, [applySession, navigate, oauthSession.oauthToken]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="mx-auto h-10 w-10 rounded-full border-2 border-primary border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="text-sm text-muted-foreground">{message}</p>
      </motion.div>
    </div>
  );
}
