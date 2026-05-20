"use client";

import { useActionState, useRef } from "react";
import { registerWorker } from "@/app/actions/admin";

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerWorker as any, {} as any);
  const formRef = useRef<HTMLFormElement>(null);

  if (state?.success) {
    formRef.current?.reset();
  }

  return (
    <form ref={formRef} action={formAction} className="glass-panel" style={{ padding: "2rem" }}>
      <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>Новий співробітник</h2>

      {state?.error && <div className="error-message">{state.error}</div>}
      {state?.success && <div style={{ color: "var(--success-color)", marginBottom: "1rem" }}>Співробітника додано!</div>}

      <div className="input-group">
        <label htmlFor="name">ПІБ або Ім'я</label>
        <input type="text" id="name" name="name" className="input-field" required />
      </div>

      <div className="input-group">
        <label htmlFor="login">Логін</label>
        <input type="text" id="login" name="login" className="input-field" required />
      </div>

      <div className="input-group">
        <label htmlFor="password">Пароль</label>
        <input type="text" id="password" name="password" className="input-field" required />
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={isPending}>
        {isPending ? "Додавання..." : "Зареєструвати"}
      </button>
    </form>
  );
}
