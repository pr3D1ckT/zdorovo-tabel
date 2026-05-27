"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generateQrToken, deleteWorker, updateHourlyRate, updateShift, createShift, deleteShift } from "@/app/actions/admin";

type ShiftDetail = {
  id: string;
  start: string;
  end: string | null;
};

type DailyDetail = {
  date: string;
  duration: number;
  shifts: ShiftDetail[];
};

type WorkerStat = {
  id: string;
  login: string;
  name: string;
  day: number;
  week: number;
  month: number;
  hourlyRate: number;
  salaryMonth: number;
  dailyDetails: DailyDetail[];
  qrToken: string | null;
};

function formatDuration(ms: number) {
  const totalHours = Math.floor(ms / (1000 * 60 * 60));
  const totalMins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${totalHours}г ${totalMins}хв`;
}

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
}

export default function WorkerStatsTable({ stats }: { stats: WorkerStat[] }) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<{ id: string, name: string, token: string | null } | null>(null);
  
  const [rateModal, setRateModal] = useState<{ id: string, name: string, currentRate: number } | null>(null);
  const [newRate, setNewRate] = useState("");

  const [shiftModal, setShiftModal] = useState<{ type: "edit" | "add", workerId?: string, shiftId?: string } | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  const toggleRow = (login: string) => {
    setExpandedRow(prev => (prev === login ? null : login));
  };

  const exportToCSV = () => {
    const bom = "\uFEFF";
    // Use semicolons — European/Ukrainian Excel expects ; as separator
    const sep = ";";
    const header = [
      "Співробітник",
      "Логін",
      "Сьогодні (год)",
      "Тиждень (год)",
      "Місяць (год)",
      "Ставка (грн/год)",
      "Зарплата за місяць (грн)"
    ].join(sep) + "\n";

    const rows = stats.map(s => {
      const day   = (s.day   / (1000 * 60 * 60)).toFixed(2);
      const week  = (s.week  / (1000 * 60 * 60)).toFixed(2);
      const month = (s.month / (1000 * 60 * 60)).toFixed(2);
      const salary = s.salaryMonth.toFixed(2);
      // Only quote text fields; leave numbers unquoted so Excel treats them as numbers
      return [
        `"${s.name}"`,
        `"${s.login}"`,
        day.replace(".", ","),
        week.replace(".", ","),
        month.replace(".", ","),
        String(s.hourlyRate).replace(".", ","),
        salary.replace(".", ",")
      ].join(sep);
    }).join("\n");

    const blob = new Blob([bom + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tabel_export_${new Date().toLocaleDateString("uk-UA").replace(/\./g, "-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenQr = async (e: React.MouseEvent, worker: WorkerStat) => {
    e.stopPropagation();
    let token = worker.qrToken;
    setQrModal({ id: worker.id, name: worker.name, token });
    if (!token) {
       try {
         token = await generateQrToken(worker.id);
         setQrModal({ id: worker.id, name: worker.name, token });
       } catch (err) {
         console.error(err);
         setQrModal(null);
       }
    }
  };

  const handleDeleteWorker = async (e: React.MouseEvent, workerId: string, workerName: string) => {
    e.stopPropagation();
    if (confirm(`Ви впевнені, що хочете видалити співробітника ${workerName}? Усі його збережені зміни також будуть видалені назавжди!`)) {
      try {
        await deleteWorker(workerId);
      } catch (err) {
        console.error(err);
        alert("Не вдалося видалити співробітника.");
      }
    }
  };

  const handleSaveRate = async () => {
    if (!rateModal) return;
    try {
      await updateHourlyRate(rateModal.id, parseFloat(newRate) || 0);
      setRateModal(null);
    } catch (err) {
      alert("Помилка збереження ставки");
    }
  };

  const toLocalString = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const openShiftEdit = (shift: ShiftDetail) => {
    setEditStart(toLocalString(shift.start));
    setEditEnd(shift.end ? toLocalString(shift.end) : "");
    setShiftModal({ type: "edit", shiftId: shift.id });
  };

  const openShiftAdd = (workerId: string) => {
    // Default to current time for start time
    setEditStart(toLocalString(new Date().toISOString()));
    setEditEnd("");
    setShiftModal({ type: "add", workerId });
  };

  const handleSaveShift = async () => {
    if (!shiftModal) return;
    try {
      const startIso = new Date(editStart).toISOString();
      const endIso = editEnd ? new Date(editEnd).toISOString() : null;
      
      if (shiftModal.type === "edit" && shiftModal.shiftId) {
        await updateShift(shiftModal.shiftId, startIso, endIso);
      } else if (shiftModal.type === "add" && shiftModal.workerId) {
        await createShift(shiftModal.workerId, startIso, endIso);
      }
      setShiftModal(null);
    } catch (err) {
      alert("Помилка збереження зміни");
    }
  };

  const handleDeleteShift = async () => {
    if (!shiftModal || shiftModal.type !== "edit" || !shiftModal.shiftId) return;
    if (confirm("Ви дійсно хочете повністю видалити цю зміну?")) {
      try {
        await deleteShift(shiftModal.shiftId);
        setShiftModal(null);
      } catch (err) {
        alert("Помилка видалення зміни");
      }
    }
  };

  if (stats.length === 0) {
    return <p style={{ color: "var(--text-muted)" }}>Немає зареєстрованих співробітників.</p>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <button onClick={exportToCSV} className="btn" style={{ background: "rgba(255,255,255,0.1)", fontSize: "0.875rem", color: "white" }}>
          📄 Експорт в CSV
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
              <th style={{ padding: "0.5rem 0", width: "40px" }}></th>
              <th style={{ padding: "0.5rem 0" }}>Співробітник</th>
              <th style={{ padding: "0.5rem 0" }}>Сьогодні</th>
              <th style={{ padding: "0.5rem 0" }}>Тиждень</th>
              <th style={{ padding: "0.5rem 0" }}>Місяць</th>
              <th style={{ padding: "0.5rem 0" }}>Зарплата</th>
            </tr>
          </thead>
          <tbody>
            {stats.map(s => (
              <React.Fragment key={s.login}>
                <tr 
                  style={{ borderBottom: expandedRow === s.login ? "none" : "1px solid rgba(255,255,255,0.05)", cursor: "pointer", transition: "background 0.2s" }}
                  onClick={() => toggleRow(s.login)}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "1rem 0", textAlign: "center", color: "var(--text-muted)" }}>
                    <svg 
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: expandedRow === s.login ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </td>
                  <td style={{ padding: "0.75rem 0" }}>
                    <div style={{ fontWeight: 600, whiteSpace: "normal", wordBreak: "break-word", marginBottom: "0.35rem" }}>{s.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                      <button onClick={(e) => handleOpenQr(e, s)} className="btn" style={{ padding: "0.1rem 0.4rem", fontSize: "0.7rem", background: "rgba(255,255,255,0.1)", color: "var(--text-light)" }}>
                        QR
                      </button>
                      <button onClick={(e) => handleDeleteWorker(e, s.id, s.name)} className="btn btn-danger" style={{ padding: "0.1rem 0.4rem", fontSize: "0.7rem", background: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.4)" }}>
                        Видалити
                      </button>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{s.login}</div>
                  </td>
                  <td style={{ padding: "1rem 0", whiteSpace: "nowrap" }}>{formatDuration(s.day)}</td>
                  <td style={{ padding: "1rem 0", whiteSpace: "nowrap" }}>{formatDuration(s.week)}</td>
                  <td style={{ padding: "1rem 0", whiteSpace: "nowrap" }}>{formatDuration(s.month)}</td>
                  <td style={{ padding: "1rem 0", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <span style={{ fontWeight: 600, color: "var(--success-color)" }}>{s.salaryMonth.toFixed(0)} грн</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setRateModal({ id: s.id, name: s.name, currentRate: s.hourlyRate }); setNewRate(s.hourlyRate.toString()); }}
                        style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                      >
                        {s.hourlyRate} грн/год ✏️
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRow === s.login && (
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td colSpan={6} style={{ padding: "0 0 1rem 0" }}>
                      <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "1rem", margin: "0 0.5rem" }} className="animate-fade-in">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "0.5rem" }}>
                          <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted)", margin: 0 }}>Деталізація по днях</h4>
                          <button onClick={() => openShiftAdd(s.id)} className="btn" style={{ padding: "0.2rem 0.6rem", fontSize: "0.75rem", background: "rgba(16, 185, 129, 0.2)", color: "var(--primary-color)", border: "1px solid rgba(16, 185, 129, 0.4)", whiteSpace: "nowrap", flexShrink: 0 }}>
                            ➕ Додати зміну
                          </button>
                        </div>
                        {s.dailyDetails.length === 0 ? (
                          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Немає завершених змін.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {s.dailyDetails.map((day, idx) => (
                              <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "0.4rem", padding: "0.6rem 0.8rem", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <div style={{ fontWeight: 500 }}>{day.date}</div>
                                  <div style={{ color: "var(--primary-color)", fontWeight: 600, whiteSpace: "nowrap" }}>{formatDuration(day.duration)}</div>
                                </div>
                                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                                  {day.shifts.map((shift, sIdx) => (
                                    <span key={sIdx} style={{ background: "rgba(255,255,255,0.07)", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                      {formatTime(shift.start)} – {shift.end ? formatTime(shift.end) : "триває"}
                                      <button onClick={() => openShiftEdit(shift)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.7, padding: 0, fontSize: "0.85rem" }}>✏️</button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setQrModal(null)}>
          <div style={{ background: "var(--bg-panel)", padding: "2rem", borderRadius: "16px", textAlign: "center", minWidth: "300px", border: "1px solid rgba(255,255,255,0.1)" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: "1rem", fontSize: "1.25rem", fontWeight: 600 }}>QR код: {qrModal.name}</h3>
            {qrModal.token ? (
              <div style={{ background: "white", padding: "1rem", borderRadius: "8px", display: "inline-block" }}>
                <QRCodeSVG value={qrModal.token} size={200} />
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)" }}>Генерація...</p>
            )}
            <div style={{ marginTop: "1.5rem" }}>
              <button className="btn" style={{ background: "rgba(255,255,255,0.1)", color: "white" }} onClick={() => setQrModal(null)}>Закрити</button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Modal */}
      {rateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setRateModal(null)}>
          <div style={{ background: "var(--bg-panel)", padding: "2rem", borderRadius: "16px", minWidth: "300px", border: "1px solid rgba(255,255,255,0.1)" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: 600 }}>Ставка: {rateModal.name}</h3>
            <div className="input-group">
              <label>Погодинна ставка (грн)</label>
              <input type="number" step="0.1" className="input-field" value={newRate} onChange={e => setNewRate(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button className="btn" style={{ background: "rgba(255,255,255,0.1)", flex: 1, color: "white" }} onClick={() => setRateModal(null)}>Скасувати</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveRate}>Зберегти</button>
            </div>
          </div>
        </div>
      )}

      {/* Shift Modal (Add/Edit) */}
      {shiftModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShiftModal(null)}>
          <div style={{ background: "var(--bg-panel)", padding: "2rem", borderRadius: "16px", minWidth: "320px", border: "1px solid rgba(255,255,255,0.1)" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: 600 }}>
              {shiftModal.type === "add" ? "Створення нової зміни" : "Редагування зміни"}
            </h3>
            <div className="input-group">
              <label>Час початку</label>
              <input type="datetime-local" className="input-field" value={editStart} onChange={e => setEditStart(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Час закінчення (може бути пустим)</label>
              <input type="datetime-local" className="input-field" value={editEnd} onChange={e => setEditEnd(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button className="btn" style={{ background: "rgba(255,255,255,0.1)", flex: 1, color: "white" }} onClick={() => setShiftModal(null)}>Скасувати</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveShift}>Зберегти</button>
            </div>
            {shiftModal.type === "edit" && (
              <button className="btn btn-danger" style={{ width: "100%", marginTop: "1rem", background: "transparent", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#f87171" }} onClick={handleDeleteShift}>
                Видалити зміну
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
