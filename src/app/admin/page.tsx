import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import RegisterForm from "./register-form";
import { logout } from "@/app/actions/auth";
import WorkerStatsTable from "./worker-stats-table";

export const metadata = {
  title: "Панель адміністратора | Zdorovo Tabel",
};

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const workers = await prisma.user.findMany({
    where: { role: "WORKER" },
    include: { shifts: true },
  });

  const now = new Date();
  const kyivNowStr = now.toLocaleString("en-US", { timeZone: "Europe/Kiev" });
  const kyivNow = new Date(kyivNowStr);

  const startOfDay = new Date(kyivNow.getFullYear(), kyivNow.getMonth(), kyivNow.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - (startOfDay.getDay() === 0 ? 6 : startOfDay.getDay() - 1)); // Monday
  const startOfMonth = new Date(kyivNow.getFullYear(), kyivNow.getMonth(), 1);

  const stats = workers.map(worker => {
    let day = 0, week = 0, month = 0;
    
    const sortedShifts = [...worker.shifts].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    const dailyDetails: { date: string; duration: number; shifts: { start: string, end: string | null }[] }[] = [];

    for (const shift of sortedShifts) {
      if (!shift.endTime) continue;
      const duration = shift.endTime.getTime() - shift.startTime.getTime();
      
      const shiftKyivStr = shift.startTime.toLocaleString("en-US", { timeZone: "Europe/Kiev" });
      const shiftKyiv = new Date(shiftKyivStr);

      if (shiftKyiv >= startOfDay) day += duration;
      if (shiftKyiv >= startOfWeek) week += duration;
      if (shiftKyiv >= startOfMonth) month += duration;

      const dateStr = shift.startTime.toLocaleDateString("uk-UA", { timeZone: "Europe/Kiev", day: '2-digit', month: '2-digit', year: 'numeric' });
      
      let dayEntry = dailyDetails.find(d => d.date === dateStr);
      if (!dayEntry) {
        dayEntry = { date: dateStr, duration: 0, shifts: [] };
        dailyDetails.push(dayEntry);
      }
      dayEntry.duration += duration;
      dayEntry.shifts.push({ 
        start: shift.startTime.toISOString(), 
        end: shift.endTime.toISOString() 
      });
    }

    return { id: worker.id, name: worker.name, login: worker.login, day, week, month, dailyDetails, qrToken: worker.qrToken };
  });

  return (
    <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Панель адміністратора</h1>
        <form action={logout}>
          <button type="submit" className="btn" style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>
            Вийти
          </button>
        </form>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
        <div>
          <RegisterForm />
        </div>
        
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>Звіти по співробітниках</h2>
          <WorkerStatsTable stats={stats} />
        </div>
      </div>
    </main>
  );
}
