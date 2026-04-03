import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { parseCallbackParams, exchangeCodeForToken } from "@/services/gbpOAuth";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function GBPCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const { code, error } = parseCallbackParams(searchParams);

    if (error) {
      setStatus("error");
      setErrorMsg(error);
      return;
    }

    if (!code) {
      setStatus("error");
      setErrorMsg("No authorization code received");
      return;
    }

    exchangeCodeForToken(code)
      .then(() => {
        setStatus("success");
        // If opened as popup, notify parent and close
        if (window.opener) {
          window.opener.postMessage({ type: "gbp-oauth-success" }, window.location.origin);
          setTimeout(() => window.close(), 1500);
        } else {
          // If full redirect, go to settings after brief delay
          setTimeout(() => navigate("/settings"), 2000);
        }
      })
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err.message || "Token exchange failed");
      });
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-[360px]">
        <CardContent className="p-6 text-center space-y-3">
          {status === "loading" && (
            <>
              <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
              <p className="text-sm font-medium">Connecting Google Business Profile...</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="h-10 w-10 mx-auto text-success" />
              <p className="text-sm font-medium text-success">Connected successfully!</p>
              <p className="text-xs text-muted-foreground">Redirecting to settings...</p>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-10 w-10 mx-auto text-destructive" />
              <p className="text-sm font-medium text-destructive">Connection failed</p>
              <p className="text-xs text-muted-foreground">{errorMsg}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
