import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "./firebaseConfig";
import { ref, onValue, update, push, remove } from "firebase/database";
import logo from "../assets/img/logo.jpg";
import Swal from "sweetalert2";

const Configuracionhoteles = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [data, setData] = useState([]);
  const [hoteles, setHoteles] = useState([]);
  const [filter, setFilter] = useState({ hotel: "" });
  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarRef = useRef(null);
  const [selectedHoteles, setSelectedHoteles] = useState([]);

  const [currentDateTime, setCurrentDateTime] = useState({
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
  });

  // Actualización de fecha y hora
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

  // Validar si el usuario tiene acceso
  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/agendadeldiausuario");
    }
  }, [user, navigate]);

  // Cerrar sesión
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

  // Leer datos de Firebase: hoteles
  useEffect(() => {
    const dbRef = ref(database, "hoteles");
    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const fetchedData = [];
        const uniqueHoteles = new Set();

        Object.entries(snapshot.val()).forEach(([id, hotel]) => {
          fetchedData.push({
            id,
            hotel: hotel.nombre || "",
            numeroruta: hotel.numeroruta || "",
          });
          if (hotel.nombre) {
            uniqueHoteles.add(hotel.nombre);
          }
        });

        setData(fetchedData);
        setHoteles(Array.from(uniqueHoteles));
      } else {
        setData([]);
        setHoteles([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Manejar cambios en los filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const resetFilters = () => {
    setFilter({ hotel: "" });
  };

  const filteredData = data.filter((hotel) => {
    const hotelMatch = filter.hotel
      ? hotel.hotel.toLowerCase().includes(filter.hotel.toLowerCase())
      : true;
    return hotelMatch;
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

  // Actualizar campos en Firebase
  const handleFieldChange = (id, field, value) => {
    // Si se actualiza el campo "numeroruta", se verifica que no exista en otro registro
    if (field === "numeroruta" && value !== "") {
      const duplicateExists = data.some(
        (hotel) => hotel.id !== id && String(hotel.numeroruta) === String(value)
      );
      if (duplicateExists) {
        Swal.fire({
          icon: "error",
          title: "Número de ruta duplicado",
          text: "El número de ruta ya está asignado a otro hotel.",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#3085d6",
        });
        return;
      }
    }

    const dbRef = ref(database, `hoteles/${id}`);
    update(dbRef, { [field]: value }).catch((error) => {
      console.error("Error updating data: ", error);
    });

    setData((prevData) =>
      prevData.map((hotel) =>
        hotel.id === id ? { ...hotel, [field]: value } : hotel
      )
    );
  };

  // Agregar nuevo hotel
  const handleAddHotel = () => {
    const newHotel = {
      nombre: "",
      numeroruta: "",
    };

    const dbRef = ref(database, "hoteles");
    push(dbRef, newHotel).catch((error) => {
      console.error("Error adding hotel: ", error);
    });
  };

  // Eliminar hoteles seleccionados
  const handleDeleteHoteles = () => {
    selectedHoteles.forEach((id) => {
      const dbRef = ref(database, `hoteles/${id}`);
      remove(dbRef).catch((error) => {
        console.error("Error deleting hotel: ", error);
      });
    });

    setSelectedHoteles([]);
  };

  const handleSelectHotel = (id) => {
    setSelectedHoteles((prevSelected) => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter((hotelId) => hotelId !== id);
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
        <h1 className="title-page">Hoteles</h1>
        <div className="current-date">
          <div>{currentDateTime.date}</div>
          <div>{currentDateTime.time}</div>
        </div>

        <div className="filters" style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleAddHotel} className="create-table-button">
            Agregar Hotel
          </button>
          <button
            onClick={() => {
              if (selectedHoteles.length === 0) return;
              Swal.fire({
                title: "¿Estás seguro?",
                text: "Esta acción eliminará los hoteles seleccionados.",
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
                  handleDeleteHoteles();
                }
              });
            }}
            className="delete-button"
            disabled={selectedHoteles.length === 0}
          >
            Eliminar Hoteles
          </button>
          <button onClick={resetFilters} className="filter-button reset-button">
            Descartar Filtros
          </button>

          <input
            type="text"
            name="hotel"
            value={filter.hotel || ""}
            onChange={(e) => handleFilterChange(e)}
            placeholder="Filtrar por hotel"
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
        </div>

        <div className="table-container">
          <table className="service-table">
            <thead>
              <tr>
                <th>Seleccionar</th>
                <th># de ruta</th>
                <th>Nombre</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData
                  .sort((a, b) => {
                    const numA = parseFloat(a.numeroruta) || 0;
                    const numB = parseFloat(b.numeroruta) || 0;
                    return numA - numB;
                  })
                  .map((hotel) => (
                    <tr key={hotel.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedHoteles.includes(hotel.id)}
                          onChange={() => handleSelectHotel(hotel.id)}
                          style={{
                            width: "3ch",
                            height: "3ch",
                            marginLeft: "0",
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={hotel.numeroruta || ""}
                          onChange={(e) =>
                            handleFieldChange(
                              hotel.id,
                              "numeroruta",
                              e.target.value
                            )
                          }
                          onBlur={(e) => {
                            const num = parseFloat(e.target.value);
                            if (!isNaN(num)) {
                              const formatted = num.toFixed(2);
                              handleFieldChange(
                                hotel.id,
                                "numeroruta",
                                formatted
                              );
                            }
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={hotel.hotel}
                          onChange={(e) =>
                            handleFieldChange(
                              hotel.id,
                              "nombre",
                              e.target.value
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="3">No se encontraron hoteles</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Configuracionhoteles;
