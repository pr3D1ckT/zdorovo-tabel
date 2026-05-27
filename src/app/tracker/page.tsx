import { getOrCreateActiveShift, getWorkerStats } from "@/app/actions/shift";
import TrackerClient from "./tracker-client";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Трекер | Zdorovo Tabel",
};

export default async function TrackerPage() {
  const session = await getSession();
  if (!session || session.role !== "WORKER") redirect("/login");

  const [shift, stats] = await Promise.all([
    getOrCreateActiveShift(),
    getWorkerStats()
  ]);

  if (!shift) {
    return <div>Помилка: не вдалося запустити зміну.</div>;
  }

  return (
    <main style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ position: "absolute", top: "1rem", right: "2rem" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Співробітник: <span style={{ color: "var(--text-light)", fontWeight: 600 }}>{session.name}</span>
        </p>
      </div>
      
      <div className="glass-panel animate-fade-in" style={{ width: "100%", maxWidth: "500px", padding: "3rem 2rem" }}>
        <TrackerClient
          startTimeIso={shift.startTime.toISOString()}
          statsYesterday={stats?.yesterday ?? 0}
          statsWeek={stats?.week ?? 0}
          statsMonth={stats?.month ?? 0}
        />
      </div>
    </main>
  );
}
