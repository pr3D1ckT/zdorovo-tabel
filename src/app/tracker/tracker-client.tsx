"use client";

import { useEffect, useState } from "react";
import { stopShift } from "@/app/actions/shift";

const MAX_DURATION_MS = 10 * 60 * 60 * 1000;

function formatTime(ms: number) {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function formatDuration(ms: number) {
  if (ms <= 0) return "0г 0хв";
  const totalHours = Math.floor(ms / (1000 * 60 * 60));
  const totalMins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${totalHours}г ${totalMins}хв`;
}

type Props = {
  startTimeIso: string;
  statsYesterday: number;
  statsWeek: number;
  statsMonth: number;
};

export default function TrackerClient({ startTimeIso, statsYesterday, statsWeek, statsMonth }: Props) {
  const startTime = new Date(startTimeIso).getTime();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      let diff = now - startTime;
      if (diff < 0) diff = 0;
      if (diff >= MAX_DURATION_MS) diff = MAX_DURATION_MS;
      setElapsed(diff);
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

      <form action={stopShift}>
        <button
          type="submit"
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
      </form>

      {/* Stats block */}
      <div style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "0.75rem",
        marginTop: "0.5rem"
      }}>
        {[
          { label: "Вчора", value: statsYesterday },
          { label: "Тиждень", value: statsWeek },
          { label: "Місяць", value: statsMonth },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            padding: "0.75rem 0.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.25rem"
          }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.05em" }}>{label}</span>
            <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--primary-color)" }}>
              {formatDuration(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
