import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import RegisterForm from "./register-form";
import { logout } from "@/app/actions/auth";

export const metadata = {
  title: "Панель адміністратора | Zdorovo Tabel",
};

function formatDuration(ms: number) {
  const totalHours = Math.floor(ms / (1000 * 60 * 60));
  const totalMins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${totalHours}ч ${totalMins}м`;
}

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const workers = await prisma.user.findMany({
    where: { role: "WORKER" },
    include: { shifts: true },
  });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - (startOfDay.getDay() === 0 ? 6 : startOfDay.getDay() - 1)); // Monday
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = workers.map(worker => {
    let day = 0, week = 0, month = 0;
    for (const shift of worker.shifts) {
      if (!shift.endTime) continue;
      const duration = shift.endTime.getTime() - shift.startTime.getTime();
      if (shift.startTime >= startOfDay) day += duration;
      if (shift.startTime >= startOfWeek) week += duration;
      if (shift.startTime >= startOfMonth) month += duration;
    }
    return { name: worker.name, login: worker.login, day, week, month };
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
          {stats.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>Немає зареєстрованих співробітників.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  <th style={{ padding: "0.5rem 0" }}>Співробітник</th>
                  <th style={{ padding: "0.5rem 0" }}>Сьогодні</th>
                  <th style={{ padding: "0.5rem 0" }}>Тиждень</th>
                  <th style={{ padding: "0.5rem 0" }}>Місяць</th>
                </tr>
              </thead>
              <tbody>
                {stats.map(s => (
                  <tr key={s.login} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "1rem 0" }}>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{s.login}</div>
                    </td>
                    <td style={{ padding: "1rem 0" }}>{formatDuration(s.day)}</td>
                    <td style={{ padding: "1rem 0" }}>{formatDuration(s.week)}</td>
                    <td style={{ padding: "1rem 0" }}>{formatDuration(s.month)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
