"use client";

import { useEffect, useState } from "react";
import { stopShift } from "@/app/actions/shift";

const MAX_DURATION_MS = 10 * 60 * 60 * 1000;

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function TrackerClient({ startTimeIso }: { startTimeIso: string }) {
  const startTime = new Date(startTimeIso).getTime();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const diff = now - startTime;
      if (diff >= MAX_DURATION_MS) {
        setElapsed(MAX_DURATION_MS);
        // Automatically stop shift on client if 10h is reached
        stopShift();
      } else {
        setElapsed(diff);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "2rem", alignItems: "center" }}>
      <h2 style={{ fontSize: "1.25rem", color: "var(--text-muted)", fontWeight: 500 }}>
        Поточна зміна
      </h2>
      
      <div style={{ fontSize: "4rem", fontWeight: 700, fontFamily: "monospace", textShadow: "0 0 20px rgba(16, 185, 129, 0.5)" }}>
        {formatTime(elapsed)}
      </div>

      <button
        onClick={() => stopShift()}
        className="btn btn-danger"
        style={{
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          fontSize: "2.5rem",
          fontWeight: 800,
          boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.5)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginTop: "1rem"
        }}
      >
        Стоп
      </button>
    </div>
  );
}
