import LoginForm from "./login-form";

export const metadata = {
  title: "Вход | Zdorovo Tabel",
};

export default function LoginPage() {
  return (
    <main style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: "400px" }}>
        <LoginForm />
      </div>
    </main>
  );
}
