import React, { useState } from "react";
import "./App.css";
import { ref, get, child } from "firebase/database";
import { database, auth, provider } from "./components/firebaseConfig";
import { useNavigate } from "react-router-dom";
import logo from "./assets/img/logo.jpg";
import iconEyeOpen from "./assets/img/iconeye.jpg";
import iconEyeClosed from "./assets/img/iconeyeclosed.jpg";

const App = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, "users"));

      if (snapshot.exists()) {
        const users = snapshot.val();
        const userFound = Object.values(users).find(
          (user) => user.email === email && user.password === password
        );

        if (userFound) {
          localStorage.setItem("user", JSON.stringify(userFound));
          localStorage.setItem(
            "isAdmin",
            userFound.role === "admin" ? "true" : "false"
          );

          if (userFound.role === "admin") {
            navigate("/agendageneral");
          } else {
            navigate("/agendadeldiausuario");
          }
        } else {
          setMessage("Invalid email or password.");
        }
      } else {
        setMessage("No users found in the database.");
      }
    } catch (error) {
      setMessage("An error occurred while logging in.");
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
              type={showPassword ? "text" : "password"} // Cambia el tipo aquí
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              onClick={togglePasswordVisibility}
              id="toggle-password"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              <img
                src={showPassword ? iconEyeClosed : iconEyeOpen}
                alt={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                id="iconeye"
              />
            </button>
          </div>
          <button type="submit" id="passwordbutton">
            Iniciar Sesión
          </button>
        </form>
        {message && <p className="danger">{message}</p>}
      </div>
    </div>
  );
};

export default App;
