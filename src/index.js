import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { HashRouter, Routes, Route } from "react-router-dom";
import LoadingScreen from "./components/LoadingScreen.jsx";

const Agendageneral = lazy(() => import("./components/Hojadeserviciosgeneral.jsx"));
const Agendarserviciosdasc = lazy(() => import("./components/Hojadeservicios.jsx"));
const Hojadeservicioscross = lazy(() => import("./components/Hojadeservicioscross.jsx"));
const Historialfacturasemitidas = lazy(() => import("./components/Historialfacturasemitidas.jsx"));
const Historialfacturasemitidascross = lazy(() => import("./components/Historialfacturasemitidascross.jsx"));
const Historialfacturasemitidasglobal = lazy(() => import("./components/Historialfacturasemitidasglobal.jsx"));
const Configuracionservicios = lazy(() => import("./components/Configuracionservicios.jsx"));
const Configuracionhoteles = lazy(() => import("./components/Configuracionhoteles.jsx"));
const Configuracionclientes = lazy(() => import("./components/Configuracionclientes.jsx"));
const Usuarios = lazy(() => import("./components/Configuraciondeusuarios.jsx"));
const Agendadeldiausuario = lazy(() => import("./components/Agendadeldiausuario.jsx"));
const Agendamañanausuario = lazy(() => import("./components/Agendamañanausuario.jsx"));

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <HashRouter>
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/agendageneral" element={<Agendageneral />} />
        <Route path="/agendarserviciosdasc" element={<Agendarserviciosdasc />} />
        <Route path="/agendarservicioscross" element={<Hojadeservicioscross />} />
        <Route path="/historialfacturasemitidasdasc" element={<Historialfacturasemitidas />} />
        <Route path="/historialfacturasemitidascross" element={<Historialfacturasemitidascross />} />
        <Route path="/historialfacturasemitidasglobal" element={<Historialfacturasemitidasglobal />} />
        <Route path="/configuracionservicios" element={<Configuracionservicios />} />
        <Route path="/configuracionhoteles" element={<Configuracionhoteles />} />
        <Route path="/configuracionclientes" element={<Configuracionclientes />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/agendadeldiausuario" element={<Agendadeldiausuario />} />
        <Route path="/agendamañanausuario" element={<Agendamañanausuario />} />
      </Routes>
    </Suspense>
  </HashRouter>
);