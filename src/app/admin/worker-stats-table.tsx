"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generateQrToken, deleteWorker } from "@/app/actions/admin";

type ShiftDetail = {
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

  const toggleRow = (login: string) => {
    setExpandedRow(prev => (prev === login ? null : login));
  };

  const handleOpenQr = async (e: React.MouseEvent, worker: WorkerStat) => {
    e.stopPropagation();
    let token = worker.qrToken;
    setQrModal({ id: worker.id, name: worker.name, token }); // show modal immediately with loading if no token
    
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

  const handleDelete = async (e: React.MouseEvent, workerId: string, workerName: string) => {
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

  if (stats.length === 0) {
    return <p style={{ color: "var(--text-muted)" }}>Немає зареєстрованих співробітників.</p>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            <th style={{ padding: "0.5rem 0", width: "40px" }}></th>
            <th style={{ padding: "0.5rem 0" }}>Співробітник</th>
            <th style={{ padding: "0.5rem 0" }}>Сьогодні</th>
            <th style={{ padding: "0.5rem 0" }}>Тиждень</th>
            <th style={{ padding: "0.5rem 0" }}>Місяць</th>
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
                <td style={{ padding: "1rem 0" }}>
                  <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {s.name}
                    <button onClick={(e) => handleOpenQr(e, s)} className="btn" style={{ padding: "0.1rem 0.4rem", fontSize: "0.7rem", background: "rgba(255,255,255,0.1)", color: "var(--text-light)" }}>
                      QR
                    </button>
                    <button onClick={(e) => handleDelete(e, s.id, s.name)} className="btn btn-danger" style={{ padding: "0.1rem 0.4rem", fontSize: "0.7rem", background: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.4)" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.8)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)"}>
                      Видалити
                    </button>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{s.login}</div>
                </td>
                <td style={{ padding: "1rem 0" }}>{formatDuration(s.day)}</td>
                <td style={{ padding: "1rem 0" }}>{formatDuration(s.week)}</td>
                <td style={{ padding: "1rem 0" }}>{formatDuration(s.month)}</td>
              </tr>
              {expandedRow === s.login && (
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td colSpan={5} style={{ padding: "0 1rem 1rem 3rem" }}>
                    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "1rem" }} className="animate-fade-in">
                      <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "1rem" }}>Деталізація по днях</h4>
                      {s.dailyDetails.length === 0 ? (
                        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Немає завершених змін.</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {s.dailyDetails.map((day, idx) => (
                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
                              <div style={{ fontWeight: 500 }}>{day.date}</div>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                                <div style={{ color: "var(--primary-color)", fontWeight: 600 }}>{formatDuration(day.duration)}</div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                  {day.shifts.map((shift, sIdx) => (
                                    <span key={sIdx}>
                                      {formatTime(shift.start)} - {shift.end ? formatTime(shift.end) : "триває"}
                                      {sIdx < day.shifts.length - 1 ? ", " : ""}
                                    </span>
                                  ))}
                                </div>
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

      {qrModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setQrModal(null)}>
          <div style={{ background: "var(--panel-bg)", padding: "2rem", borderRadius: "12px", textAlign: "center", minWidth: "300px" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: "1rem", fontSize: "1.25rem", fontWeight: 600 }}>QR код: {qrModal.name}</h3>
            {qrModal.token ? (
              <div style={{ background: "white", padding: "1rem", borderRadius: "8px", display: "inline-block" }}>
                <QRCodeSVG value={qrModal.token} size={200} />
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)" }}>Генерація...</p>
            )}
            <div style={{ marginTop: "1.5rem" }}>
              <button className="btn" style={{ background: "rgba(255,255,255,0.1)" }} onClick={() => setQrModal(null)}>Закрити</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
