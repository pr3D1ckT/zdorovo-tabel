import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import SummaryClient from "./summary-client";

export const metadata = {
  title: "Підсумки зміни | Zdorovo Tabel",
};

export default async function SummaryPage({ searchParams }: { searchParams: Promise<{ shiftId?: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "WORKER") redirect("/login");

  const shiftId = (await searchParams).shiftId;
  let durationFormatted = "00:00:00";

  if (shiftId) {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (shift && shift.endTime && shift.workerId === session.userId) {
      const ms = shift.endTime.getTime() - shift.startTime.getTime();
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      durationFormatted = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
  }

  return (
    <main style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div className="glass-panel animate-fade-in" style={{ width: "100%", maxWidth: "450px", textAlign: "center" }}>
        <div style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "rgba(16, 185, 129, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.5rem auto",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Зміну завершено
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
          Гарна робота, {session.name}!
        </p>

        <div style={{ 
          background: "rgba(0,0,0,0.2)", 
          padding: "1.5rem", 
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.05)"
        }}>
          <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Відпрацьовано часу</div>
          <div style={{ fontSize: "2.5rem", fontWeight: 700, fontFamily: "monospace" }}>
            {durationFormatted}
          </div>
        </div>

        <SummaryClient />
      </div>
    </main>
  );
}
