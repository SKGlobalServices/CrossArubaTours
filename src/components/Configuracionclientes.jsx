import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "./firebaseConfig";
import { ref, onValue, update, push, remove } from "firebase/database";
import logo from "../assets/img/logo.jpg";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";

const Configuracionclientes = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [data, setData] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filter, setFilter] = useState({ cliente: "", rol: "" });
  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarRef = useRef(null);
  const [selectedClientes, setSelectedClientes] = useState([]);

  const [currentDateTime, setCurrentDateTime] = useState({
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
  });

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

  useEffect(() => {
    const dbRef = ref(database, "clientes");
    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const fetchedData = [];
        const uniqueClientes = new Set();

        Object.entries(snapshot.val()).forEach(([id, cliente]) => {
          fetchedData.push({
            id,
            cliente: cliente.cliente || "",
            rol: cliente.rol || "",
            numerodepasajeros: cliente.numerodepasajeros || "0",
          });
          if (cliente.cliente) {
            uniqueClientes.add(cliente.cliente);
          }
        });

        setData(fetchedData);
        setClientes(Array.from(uniqueClientes));
      } else {
        setData([]);
        setClientes([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const resetFilters = () => {
    setFilter({ cliente: "", rol: "" });
  };

  const filteredData = data.filter((cliente) => {
    const clienteMatch = filter.cliente
      ? cliente.cliente.toLowerCase().includes(filter.cliente.toLowerCase())
      : true;
    const rolMatch = filter.rol
      ? cliente.rol.toLowerCase().includes(filter.rol.toLowerCase())
      : true;
    return clienteMatch && rolMatch;
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

  const handleFieldChange = (id, field, value) => {
    const dbRef = ref(database, `clientes/${id}`);
    update(dbRef, { [field]: value }).catch((error) => {
      console.error("Error updating data: ", error);
    });

    setData((prevData) =>
      prevData.map((cliente) =>
        cliente.id === id ? { ...cliente, [field]: value } : cliente
      )
    );
  };

  const handleAddCliente = () => {
    const newCliente = {
      cliente: "Nuevo Cliente",
      rol: "",
      numerodepasajeros: "",
    };

    const dbRef = ref(database, "clientes");
    push(dbRef, newCliente).catch((error) => {
      console.error("Error adding client: ", error);
    });
  };

  const handleDeleteClientes = () => {
    selectedClientes.forEach((id) => {
      const dbRef = ref(database, `clientes/${id}`);
      remove(dbRef).catch((error) => {
        console.error("Error deleting client: ", error);
      });
    });

    setSelectedClientes([]);
  };

  const handleSelectCliente = (id) => {
    setSelectedClientes((prevSelected) => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter((clienteId) => clienteId !== id);
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
        <h1 className="title-page">Clientes</h1>
        <div className="current-date">
          <div>{currentDateTime.date}</div>
          <div>{currentDateTime.time}</div>
        </div>

        <div className="filters">
          <button onClick={handleAddCliente} className="create-table-button">
            Agregar Cliente
          </button>
          <button
            onClick={() => {
              if (selectedClientes.length === 0) return;
              Swal.fire({
                title: "¿Estás seguro?",
                text: "Esta acción eliminará los clientes seleccionados.",
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
                  handleDeleteClientes();
                }
              });
            }}
            className="delete-button"
            disabled={selectedClientes.length === 0}
          >
            Eliminar Clientes
          </button>
          <button onClick={resetFilters} className="filter-button reset-button">
            Descartar Filtros
          </button>

          <div className="custom-select-container">
            <input
              type="text"
              name="cliente"
              value={filter.cliente || ""}
              onChange={(e) => handleFilterChange(e)}
              list="cliente-options"
              placeholder="Filtrar por cliente"
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
            <datalist id="cliente-options">
              {clientes.map((cliente, index) => (
                <option key={index} value={cliente || "Sin cliente"}>
                  {cliente || "Sin cliente"}
                </option>
              ))}
            </datalist>
          </div>
          <div className="custom-select-container">
            <select
              name="rol"
              value={filter.rol || ""}
              onChange={(e) => handleFilterChange(e)}
              style={{
                fontSize: "14px",
                borderRadius: "5px",
                padding: "8px 12px", // Espaciado interno
                border: "1px solid #000", // Borde más grueso
                height: "39px", // Mayor altura
              }}
            >
              <option value="">Filtrar por rol</option>
              <option value="Empresa">Empresa</option>
              <option value="Cliente">Cliente</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="service-table">
            <thead>
              <tr>
                <th>Seleccionar</th>
                <th>Nombre</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedClientes.includes(cliente.id)}
                        onChange={() => handleSelectCliente(cliente.id)}
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
                        value={cliente.cliente}
                        onChange={(e) =>
                          handleFieldChange(
                            cliente.id,
                            "cliente",
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td>
                      <select
                        value={cliente.rol}
                        onChange={(e) =>
                          handleFieldChange(cliente.id, "rol", e.target.value)
                        }
                      >
                        <option value=""></option>
                        <option value="Empresa">Empresa</option>
                        <option value="Cliente">Cliente</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No se encontraron clientes</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Configuracionclientes;
