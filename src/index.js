import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { HashRouter, Routes, Route } from "react-router-dom";
import Homepage from "./components/Hojadeservicios.jsx";
import Historialdeservicios from "./components/Historialdeservicios.jsx";
import Historialfacturasemitidas from "./components/Historialfacturasemitidas.jsx";
import Configuracionclientes from "./components/Configuracionclientes.jsx";
import Configuracionservicios from "./components/Configuracionservicios.jsx";
import Usuarios from "./components/Configuraciondeusuarios.jsx"
import Agendadeldiausuario from "./components/Agendadeldiausuario.jsx"
import Agendamañanausuario from "./components/Agendamañanausuario.jsx"
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <HashRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/homepage" element={<Homepage />} />
      <Route path="/historialdeservicios" element={<Historialdeservicios />} />
      <Route path="/historialfacturasemitidas" element={<Historialfacturasemitidas />} />
      <Route path="/configuracionclientes" element={<Configuracionclientes />} />
      <Route path="/configuracionservicios" element={<Configuracionservicios />} />
      <Route path="/usuarios" element={<Usuarios />} />
      <Route path="/agendadeldiausuario" element={<Agendadeldiausuario />} />
      <Route path="/agendamañanausuario" element={<Agendamañanausuario />} />
    </Routes>
  </HashRouter>
);