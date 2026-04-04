import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "./firebaseConfig";
import { ref, onValue, update, push, remove } from "firebase/database";
import logo from "../assets/img/logo.jpg";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";

const Configuracionservicios = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  // data contendrá los servicios (cada uno con id, nombre y valor)
  const [data, setData] = useState([]);
  // Array de nombres únicos de servicio para sugerir en el filtro
  const [servicios, setServicios] = useState([]);
  // Filtrado: solo se filtra por el campo "nombre"
  const [filter, setFilter] = useState({ nombre: "" });
  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarRef = useRef(null);
  // Para llevar la cuenta de los servicios seleccionados (para eliminar)
  const [selectedServicios, setSelectedServicios] = useState([]);
  // Estado para identificar qué servicio se está editando en el campo "valor"
  const [editingService, setEditingService] = useState(null);

  const [currentDateTime, setCurrentDateTime] = useState({
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
  });

  // Helper: Formatea un número al formato de dólar en inglés (USD)
  const formatDollar = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // Actualización de fecha y hora cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime({
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Verifica que el usuario exista y sea admin; de lo contrario redirige
  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/agendadeldiausuario");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    Swal.fire({
      title: "¡Sesión cerrada!",
      text: "Has cerrado sesión correctamente.",
      icon: "success",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Aceptar",
      heightAuto: false,
    }).then(() => {
      navigate("/");
    });
  };

  // Escucha la tabla "servicios" en Firebase y formatea la data
  useEffect(() => {
    const dbRef = ref(database, "servicios");
    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const fetchedData = [];
        const uniqueServicios = new Set();
        Object.entries(snapshot.val()).forEach(([id, servicio]) => {
          fetchedData.push({
            id,
            nombre: servicio.nombre || "",
            valor: servicio.valor || "",
          });
          if (servicio.nombre) {
            uniqueServicios.add(servicio.nombre);
          }
        });
        setData(fetchedData);
        setServicios(Array.from(uniqueServicios));
      } else {
        setData([]);
        setServicios([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Maneja el cambio en el input del filtro (por nombre)
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Resetea los filtros
  const resetFilters = () => {
    setFilter({ nombre: "" });
  };

  // Filtra la data según el nombre
  const filteredData = data.filter((servicio) => {
    return filter.nombre
      ? servicio.nombre.toLowerCase().includes(filter.nombre.toLowerCase())
      : true;
  });

  const toggleSidebar = () => setShowSidebar(!showSidebar);

  const handleClickOutside = (e) => {
    if (
      sidebarRef.current &&
      !sidebarRef.current.contains(e.target) &&
      !e.target.closest(".show-sidebar-button")
    ) {
      setShowSidebar(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Actualiza un campo (nombre o valor) de un servicio
  const handleFieldChange = (id, field, value) => {
    const dbRef = ref(database, `servicios/${id}`);
    update(dbRef, { [field]: value }).catch((error) => {
      console.error("Error updating data: ", error);
    });
    setData((prevData) =>
      prevData.map((servicio) =>
        servicio.id === id ? { ...servicio, [field]: value } : servicio
      )
    );
  };

  // Agrega un nuevo servicio con valores por defecto
  const handleAddServicio = () => {
    const newServicio = {
      nombre: "Nuevo Servicio",
      valor: "",
    };
    const dbRef = ref(database, "servicios");
    push(dbRef, newServicio).catch((error) => {
      console.error("Error adding service: ", error);
    });
  };

  // Elimina los servicios seleccionados
  const handleDeleteServicios = () => {
    selectedServicios.forEach((id) => {
      const dbRef = ref(database, `servicios/${id}`);
      remove(dbRef).catch((error) => {
        console.error("Error deleting service: ", error);
      });
    });
    setSelectedServicios([]);
  };

  // Maneja la selección o deselección de un servicio para borrar
  const handleSelectServicio = (id) => {
    setSelectedServicios((prevSelected) => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter((servicioId) => servicioId !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };

  return (
    <div className="homepage-container">
      <button className="show-sidebar-button" onClick={toggleSidebar}>
        ☰
      </button>
      <div ref={sidebarRef} className={`sidebar ${showSidebar ? "show" : ""}`}>
        {user && user.name ? <p>Hola!, {user.name}</p> : <p>No user</p>}
        <div>
          <h1>
            <img
              src={logo}
              alt="Logo"
              id="logologin"
              className="logo-slidebar"
            />
          </h1>
        </div>
        <p>REPORTE GENERAL</p>
        <button
          className="menu-item"
          onClick={() => navigate("/agendageneral")}
        >
          Tours Activos Agendados
        </button>
        <p>AGENDAR</p>
        <button
          className="menu-item"
          onClick={() => navigate("/agendarserviciosdasc")}
        >
          Agendar Tours DASC
        </button>
        <button
          className="menu-item"
          onClick={() => navigate("/agendarservicioscross")}
        >
          Agendar Tours Cross
        </button>
        <p>HISTORIALES</p>
        <button
          className="menu-item"
          onClick={() => navigate("/historialfacturasemitidasdasc")}
        >
          Historial De Facturas Emitidas DASC
        </button>
        <button
          className="menu-item"
          onClick={() => navigate("/historialfacturasemitidascross")}
        >
          Historial De Facturas Emitidas Cross
        </button>
        <button
          className="menu-item"
          onClick={() => navigate("/historialfacturasemitidasglobal")}
        >
          Historial De Tours
        </button>
        <p>CONFIGURACIONES</p>
        <button
          className="menu-item"
          onClick={() => navigate("/configuracionservicios")}
        >
          Configuracion De Servicios
        </button>
        <button
          className="menu-item"
          onClick={() => navigate("/configuracionhoteles")}
        >
          Configuracion De Hoteles
        </button>
        <button
          className="menu-item"
          onClick={() => navigate("/configuracionclientes")}
        >
          Configuracion De Empresa/Cliente
        </button>
        <button className="menu-item" onClick={() => navigate("/usuarios")}>
          Configuración De Usuarios
        </button>
        <p>"EXIT"</p>
        <button className="menu-item" onClick={handleLogout}>
          Cerrar Sesión
        </button>
        <div>
          <p>© 2025 S&K Global Services</p>
        </div>
      </div>
      <div className="homepage-card">
        <h1 className="title-page">Servicios</h1>
        <div className="current-date">
          <div>{currentDateTime.date}</div>
          <div>{currentDateTime.time}</div>
        </div>

        <div className="filters">
          <button onClick={handleAddServicio} className="create-table-button">
            Agregar Servicio
          </button>
          <button
            onClick={() => {
              if (selectedServicios.length === 0) return;
              Swal.fire({
                title: "¿Estás seguro?",
                text: "Esta acción eliminará los servicios seleccionados.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Sí, eliminar",
                cancelButtonText: "Cancelar",
                position: "center",
                backdrop: "rgba(0,0,0,0.4)",
                allowOutsideClick: false,
                heightAuto: false,
              }).then((result) => {
                if (result.isConfirmed) {
                  handleDeleteServicios();
                }
              });
            }}
            className="delete-button"
            disabled={selectedServicios.length === 0}
          >
            Eliminar Servicios
          </button>
          <button onClick={resetFilters} className="filter-button reset-button">
            Descartar Filtros
          </button>
          <div className="custom-select-container">
            <input
              type="text"
              name="nombre"
              value={filter.nombre || ""}
              onChange={handleFilterChange}
              list="nombre-options"
              placeholder="Filtrar por nombre"
              style={{
                width: `${Math.max(filter.cliente?.length || 1, 20)}ch`,
                fontSize: "14px",
                borderRadius: "5px",
                border: "1px solid #000", // Borde más grueso
                height: "20px", // Mayor altura
                padding: "8px 12px", // Espaciado interno
                fontSize: "13px", // Tamaño de fuente más grande (opcional)
                paddingRight: "0px",
              }}
            />
            <datalist id="nombre-options">
              {servicios.map((nombre, index) => (
                <option key={index} value={nombre || "Sin servicio"}>
                  {nombre || "Sin servicio"}
                </option>
              ))}
            </datalist>
          </div>
        </div>

        <div className="table-container">
          <table className="service-table">
            <thead>
              <tr>
                <th>Seleccionar</th>
                <th>Nombre</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((servicio) => (
                  <tr key={servicio.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedServicios.includes(servicio.id)}
                        onChange={() => handleSelectServicio(servicio.id)}
                        style={{
                          width: "3ch",
                          height: "3ch",
                          marginLeft: "0",
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={servicio.nombre}
                        onChange={(e) =>
                          handleFieldChange(
                            servicio.id,
                            "nombre",
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td>
                      {/* Al mostrar el valor, si el servicio NO está en edición se muestra formateado en dólares;
                          si se está editando, se muestra el valor sin formato para facilitar la edición */}
                      <input
                        type="text"
                        value={
                          editingService === servicio.id
                            ? servicio.valor
                            : formatDollar(Number(servicio.valor || 0))
                        }
                        onFocus={() => setEditingService(servicio.id)}
                        onBlur={(e) => {
                          // Elimina caracteres no numéricos (excepto punto decimal)
                          const rawValue = e.target.value.replace(
                            /[^0-9.]/g,
                            ""
                          );
                          handleFieldChange(servicio.id, "valor", rawValue);
                          setEditingService(null);
                        }}
                        onChange={(e) =>
                          handleFieldChange(
                            servicio.id,
                            "valor",
                            e.target.value
                          )
                        }
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No se encontraron servicios</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Configuracionservicios;
