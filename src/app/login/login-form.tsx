"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";

const initialState = {
  error: "",
};

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(login as any, initialState);

  return (
    <form action={formAction} className="glass-panel animate-fade-in" style={{ padding: "3rem 2rem", width: "100%", maxWidth: "400px" }}>
      <h2 style={{ marginBottom: "2rem", textAlign: "center", fontSize: "1.5rem", fontWeight: "600" }}>Вхід до системи</h2>

      {state?.error && <div className="error-message">{state.error}</div>}

      <div className="input-group">
        <label htmlFor="login">Логін</label>
        <input type="text" id="login" name="login" className="input-field" required />
      </div>

      <div className="input-group">
        <label htmlFor="password">Пароль</label>
        <input type="password" id="password" name="password" className="input-field" required />
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={isPending}>
        {isPending ? "Вхід..." : "Увійти"}
      </button>
    </form>
  );
}
