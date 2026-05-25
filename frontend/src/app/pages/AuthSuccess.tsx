import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";

function readOAuthTokensFromUrl() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);

  const accessToken = hashParams.get("accessToken") || queryParams.get("accessToken");
  const refreshToken = hashParams.get("refreshToken") || queryParams.get("refreshToken");

  return { accessToken, refreshToken };
}

export function AuthSuccess() {
  const navigate = useNavigate();
  const { applySession } = useAuth();
  const [message, setMessage] = useState("Completing secure sign-in...");

  const oauthSession = useMemo(() => readOAuthTokensFromUrl(), []);

  useEffect(() => {
    async function completeOAuthLogin() {
      if (!oauthSession.accessToken || !oauthSession.refreshToken) {
        navigate("/auth?error=invalid_callback", { replace: true });
        return;
      }

      try {
        setMessage("Validating session...");
        const response = await fetch("http://localhost:5000/api/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${oauthSession.accessToken}`,
          },
          credentials: "include",
        });

        const payload = await response.json();
        if (!response.ok || !payload?.data) {
          throw new Error(payload?.message || "Invalid OAuth callback");
        }

        applySession({
          user: payload.data,
          accessToken: oauthSession.accessToken,
          refreshToken: oauthSession.refreshToken,
        });

        setMessage("Redirecting to your dashboard...");
        navigate("/dashboard", { replace: true });
      } catch {
        navigate("/auth?error=token_generation_failed", { replace: true });
      }
    }

    completeOAuthLogin();
  }, [applySession, navigate, oauthSession.accessToken, oauthSession.refreshToken]);

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
