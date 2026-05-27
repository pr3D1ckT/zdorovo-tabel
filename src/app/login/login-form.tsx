"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { login, qrLogin } from "@/app/actions/auth";
import { Html5Qrcode } from "html5-qrcode";

const initialState = {
  error: "",
};

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(login as any, initialState);
  const [isScanning, setIsScanning] = useState(false);
  const [qrError, setQrError] = useState("");
  const [isQrPending, setIsQrPending] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isScanning) return;

    let isMounted = true;
    
    const initScanner = async () => {
      try {
        const qrContainer = document.getElementById("qr-reader");
        if (!qrContainer) return;

        scannerRef.current = new Html5Qrcode("qr-reader");
        
        await scannerRef.current.start(
          { facingMode: "environment" },
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          async (decodedText) => {
            if (!isMounted) return;
            
            // Stop scanning immediately on success
            if (scannerRef.current) {
              await scannerRef.current.stop().catch(console.error);
              scannerRef.current.clear();
            }
            
            setIsScanning(false);
            setIsQrPending(true);
            setQrError("");
            
            try {
              const res = await qrLogin(decodedText);
              if (res?.error) {
                setQrError(res.error);
                setIsQrPending(false);
              }
            } catch (err: any) {
              if (err?.message === "NEXT_REDIRECT" || err?.digest?.startsWith("NEXT_REDIRECT")) {
                throw err;
              }
              setQrError("Помилка під час авторизації");
              setIsQrPending(false);
            }
          },
          (error) => {
            // Ignore ongoing scan errors
          }
        );
      } catch (err) {
        console.error("Scanner init error:", err);
        setQrError("Не вдалося запустити камеру. Перевірте дозволи.");
      }
    };

    const timer = setTimeout(() => {
      initScanner();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        }).catch(console.error);
      }
    };
  }, [isScanning]);

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: "3rem 2rem", width: "100%", maxWidth: "400px" }}>
      <h2 style={{ marginBottom: "2rem", textAlign: "center", fontSize: "1.5rem", fontWeight: "600" }}>Вхід до системи</h2>

      {(state?.error || qrError) && <div className="error-message">{state?.error || qrError}</div>}

      {!isScanning ? (
        <>
          <form action={formAction}>
            <div className="input-group">
              <label htmlFor="login">Логін</label>
              <input type="text" id="login" name="login" className="input-field" required />
            </div>

            <div className="input-group">
              <label htmlFor="password">Пароль</label>
              <input type="password" id="password" name="password" className="input-field" required />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={isPending || isQrPending}>
              {isPending ? "Вхід..." : "Увійти"}
            </button>
          </form>

          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>або</p>
            <button 
              type="button" 
              className="btn" 
              style={{ width: "100%", background: "rgba(255,255,255,0.1)", color: "white" }}
              onClick={() => setIsScanning(true)}
              disabled={isPending || isQrPending}
            >
              {isQrPending ? "Вхід за QR..." : "Сканувати QR код"}
            </button>
          </div>
        </>
      ) : (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ 
            position: "relative", 
            width: "100%", 
            maxWidth: "300px", 
            margin: "0 auto", 
            overflow: "hidden", 
            borderRadius: "20px", 
            border: "2px solid rgba(255,255,255,0.1)", 
            background: "rgba(0,0,0,0.5)", 
            aspectRatio: "1/1",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
          }}>
            <div id="qr-reader" style={{ width: "100%", height: "100%" }}></div>
            {/* Custom UI Overlay */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, boxShadow: "inset 0 0 0 40px rgba(0,0,0,0.4)", pointerEvents: "none" }}></div>
            <div className="laser-line"></div>
          </div>
          
          <button 
            type="button" 
            className="btn btn-danger" 
            style={{ width: "100%" }}
            onClick={() => setIsScanning(false)}
          >
            Скасувати
          </button>
        </div>
      )}
    </div>
  );
}
