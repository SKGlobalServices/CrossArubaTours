import React, { useState } from "react";
import "./App.css";
import { ref, get, child } from "firebase/database";
import { database, auth, provider, firestore } from "./components/firebaseConfig"; // Asegúrate de que los imports son correctos
import { signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import logo from "./assets/img/logo.jpg";

const App = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Login con Google
  const handleGoogleLogin = async () => {
    try {
      // Realizar la autenticación con Google
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const emailFromGoogle = user.email;

      // Verificar si el correo de Google está registrado en Realtime Database
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, "users"));

      if (snapshot.exists()) {
        const users = snapshot.val();

        // Buscar al usuario en Realtime Database usando el correo de Google
        const userFound = Object.values(users).find((user) => user.email === emailFromGoogle);

        if (userFound) {
          // Almacenar el usuario en localStorage
          localStorage.setItem("user", JSON.stringify(userFound));

          // Verificar el rol del usuario en Realtime Database
          localStorage.setItem("isAdmin", userFound.role === "admin" ? "true" : "false");

          // Redirigir según el rol
          if (userFound.role === "admin") {
            navigate("/homepage");
          } else {
            navigate("/agendadeldia");
          }
        } else {
          setMessage("User is not registered in the system.");
        }
      } else {
        setMessage("No users found in the Realtime Database.");
      }
    } catch (error) {
      setMessage(`An error occurred while logging in with Google: ${error.message}`);
    }
  };

  // Login normal con email y contraseña
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, "users"));

      if (snapshot.exists()) {
        const users = snapshot.val();

        // Buscar el usuario con el email y contraseña proporcionados
        const userFound = Object.values(users).find(
          (user) => user.email === email && user.password === password
        );

        if (userFound) {
          // Almacenar el usuario en localStorage
          localStorage.setItem("user", JSON.stringify(userFound));
          localStorage.setItem("isAdmin", userFound.role === "admin" ? "true" : "false");

          // Redirigir según el rol
          if (userFound.role === "admin") {
            navigate("/homepage");
          } else {
            navigate("/agendadeldiausuario");
          }
        } else {
          setMessage("Invalid email or password.");
        }
      } else {
        setMessage("No users found in the database.");
      }
    } catch (error) {      setMessage("An error occurred while logging in.");
    }
  };

  return (
    <div className="App">
      <div className="form-container text-center">
        <h1>
          <img src={logo} alt="Logo" id="logologin" />
        </h1>
        <form onSubmit={handleLogin} className="form-login">
          <div className="input-group">
            <label 
            style={{
              fontWeight:"bold",
              fontSize:"20px"
            }}
            htmlFor="email">Inicio De Sesión</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" id="passwordbutton">
            Iniciar Sesion
          </button>
        </form>
        {message && <p className="danger">{message}</p>}
      </div>
    </div>
  );
};

export default App;
