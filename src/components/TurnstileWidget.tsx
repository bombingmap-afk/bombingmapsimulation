import { Turnstile } from "@marsidev/react-turnstile";
import { useState } from "react";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
}

export default function TurnstileWidget({
  onVerify,
  onError,
}: TurnstileWidgetProps) {
  const [isVerified, setIsVerified] = useState(false);

  return (
    <div className="turnstile-container">
      <Turnstile
        siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ""}
        onSuccess={(token) => {
          setIsVerified(true);
          onVerify(token);
        }}
        onError={() => {
          setIsVerified(false);
          if (onError) onError();
        }}
        onExpire={() => {
          setIsVerified(false);
        }}
        options={{
          theme: "dark",
          size: "normal",
        }}
      />

      {isVerified && <p className="text-green-600 text-sm mt-2">✓ Success</p>}
    </div>
  );
}
