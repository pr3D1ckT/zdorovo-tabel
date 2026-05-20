"use client";

import { useEffect, useState } from "react";
import { logout } from "@/app/actions/auth";

export default function SummaryClient() {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) {
      logout();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <div style={{ marginTop: "2rem", textAlign: "center" }}>
      <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
        Автоматичний вихід через <span style={{ color: "var(--primary-color)", fontWeight: 700 }}>{countdown}</span> сек.
      </p>
      <button 
        onClick={() => logout()} 
        className="btn btn-primary" 
        style={{ marginTop: "1rem" }}
      >
        Вийти зараз
      </button>
    </div>
  );
}
