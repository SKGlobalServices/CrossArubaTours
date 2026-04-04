import React from "react";
import logotipo from "../assets/img/logotipo.jpg";

const LoadingScreen = () => (
  <div style={styles.overlay}>
    <img src={logotipo} alt="Cargando..." style={styles.logo} />
    <div style={styles.spinner} />
  </div>
);

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f4f9",
    backgroundImage: "url('/background.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    zIndex: 9999,
  },
  logo: {
    width: 180,
    borderRadius: 16,
    marginBottom: 28,
    filter: "drop-shadow(0 4px 16px rgba(142,36,170,0.25))",
    animation: "logoPulse 1.6s ease-in-out infinite",
  },
  spinner: {
    width: 44,
    height: 44,
    border: "4px solid rgba(156,39,176,0.2)",
    borderTop: "4px solid #9c27b0",
    borderRadius: "50%",
    animation: "spin 0.9s linear infinite",
  },
};

// Inyectar keyframes una sola vez
if (typeof document !== "undefined" && !document.getElementById("loading-screen-styles")) {
  const style = document.createElement("style");
  style.id = "loading-screen-styles";
  style.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes logoPulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.85; }
    }
  `;
  document.head.appendChild(style);
}

export default LoadingScreen;
