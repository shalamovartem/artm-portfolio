"use client";
import LoginForm from "../login-form";
export default function Login() {
  return (
    <main className="login-page">
      <section className="dialog login-dialog">
        <a className="login-back" href="/">
          ← На сайт
        </a>
        <LoginForm
          onSuccess={() => {
            const to =
              new URLSearchParams(location.search).get("return_to") ||
              "/?edit=1";
            location.assign(
              to.startsWith("/") && !to.startsWith("//") && !to.includes("\\")
                ? to
                : "/?edit=1",
            );
          }}
        />
      </section>
    </main>
  );
}
