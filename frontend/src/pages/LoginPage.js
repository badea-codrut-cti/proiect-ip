// src/pages/LoginPage.js
import React, { useState } from "react";
import "./LoginPage.css";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(""); // email sau username
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // TODO: pune aici ruta ta reală de login
  const LOGIN_URL = "/api/auth/login"; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // adaptează payload-ul la backend-ul tău:
        body: JSON.stringify({
          // de ex. email/username + password
          identifier,
          password,
        }),
      });

      if (!res.ok) {
        let msg = "Autentificare esuata. Verifica datele.";
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch (_) {}
        throw new Error(msg);
      }

      const data = await res.json();

      // exemplu: salvezi token / user in localStorage
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      setSuccessMsg("Gata, ai castigat +10 XP! 🎉");
      // aici poți face redirect spre dashboard / pagina de cursuri
      // ex: navigate("/dashboard");
    } catch (err) {
      setError(err.message || "A aparut o eroare la autentificare.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoClick = () => {
    // mic „cheat” pentru demo
    setIdentifier("demo_user");
    setPassword("demo1234");
  };

  return (
    <div className="login-root">
      <div className="login-grid">
        {/* Panou stanga - „gamified” / stats */}
        <div className="login-left">
          <div className="hologram-card">
            <div className="app-logo">ΛI<span>Quest</span></div>
            <p className="app-tagline">
              Transforma învățarea într-o <span>misiune</span>, nu în temă.
            </p>

            <div className="avatar-xp">
              <div className="avatar-circle">
                <span className="avatar-emoji">🚀</span>
              </div>
              <div className="avatar-info">
                <div className="avatar-level">Level 3 · Learning Explorer</div>
                <div className="xp-bar">
                  <div className="xp-fill" style={{ width: "65%" }}></div>
                </div>
                <div className="xp-text">65 / 100 XP până la nivelul următor</div>
              </div>
            </div>

            <div className="streak-card">
              <div className="streak-title">
                🔥 Streak potential: <span>+1 zi</span>
              </div>
              <p className="streak-text">
                Autentifică-te acum și obții <strong>bonus de concentrare</strong> pentru
                următoarea sesiune de învățare.
              </p>
              <div className="streak-dots">
                <span className="dot active"></span>
                <span className="dot active"></span>
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Panou dreapta - formular autentificare */}
        <div className="login-right">
          <div className="login-panel">
            <div className="panel-header">
              <h1>Conectează-te la misiune</h1>
              <p>Completează datele și continuă-ți progresul.</p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="identifier">
                  Email sau username
                  <span className="field-hint"> · pentru supereroi ai învățării</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    placeholder="ex: learner@hero.dev"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Parola
                  <span className="field-hint"> · tine-o la fel de puternica precum focusul</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <label className="checkbox-row">
                  <input type="checkbox" defaultChecked />
                  <span>Pastreaza-ma conectat</span>
                </label>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    // aici poti face navigate("/forgot-password");
                  }}
                >
                  Ai uitat parola?
                </button>
              </div>

              <button className="btn-primary" type="submit" disabled={isLoading}>
                {isLoading ? "Se incarca misiunea..." : "Intra in cont"}
              </button>
            </form>

            <div className="divider">
              <span> sau </span>
            </div>

            <div className="extra-actions">
              <button className="btn-ghost" type="button" onClick={handleDemoClick}>
                🔑 Autocomplete demo
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => {
                  // navigate("/register");
                }}
              >
                ✨ Creeaza un cont nou
              </button>
            </div>

            <div className="footer-note">
              Fiecare autentificare = <strong>+10 XP</strong> către versiunea ta mai bună. 💡
            </div>
          </div>
        </div>
      </div>

      {/* fundal decorativ futurist */}
      <div className="background-orbit orbit-1"></div>
      <div className="background-orbit orbit-2"></div>
      <div className="background-orbit orbit-3"></div>
    </div>
  );
}
