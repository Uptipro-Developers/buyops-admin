import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { paymentsApi } from "../../utils/api-service";

export function PaymentCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Verifying payment...");

  useEffect(() => {
    const provider = (searchParams.get("provider") || "").toLowerCase();
    const reference =
      searchParams.get("reference") || searchParams.get("tx_ref") || "";

    if ((provider !== "paystack" && provider !== "flutterwave") || !reference) {
      setMessage("Missing payment callback details. Redirecting...");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1200);
      return;
    }

    paymentsApi
      .verify(provider as "paystack" | "flutterwave", reference)
      .then((result) => {
        const status = String(result?.status || "").toLowerCase();
        if (status === "success") {
          setMessage("Payment verified successfully. Redirecting...");
        } else {
          setMessage(
            `Payment verification returned status: ${result?.status || "unknown"}. Redirecting...`,
          );
        }
      })
      .catch((error: any) => {
        setMessage(
          error?.response?.data?.message ||
            error?.message ||
            "Payment verification failed. Redirecting...",
        );
      })
      .finally(() => {
        setTimeout(() => navigate("/installments", { replace: true }), 1500);
      });
  }, [navigate, searchParams]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center text-muted-foreground">{message}</div>
    </div>
  );
}
