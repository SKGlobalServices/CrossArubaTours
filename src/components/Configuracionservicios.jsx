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
  const [data, setData] = useState([]);
  const [directions, setDirections] = useState([]);
  const [filter, setFilter] = useState({ direccion: "" });
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

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/agendadeldiausuario");
    }
  }, [user, navigate]);

  useEffect(() => {
    const dbRef = ref(database, "clientes");
    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const fetchedData = [];
        const uniqueDirections = new Set();

        Object.entries(snapshot.val()).forEach(([id, cliente]) => {
          fetchedData.push({
            id,
            direccion: cliente.direccion || "",
            cubicos: cliente.cubicos,
          });
          if (cliente.direccion) {
            uniqueDirections.add(cliente.direccion);
          }
        });

        setData(fetchedData);
        setDirections(Array.from(uniqueDirections));
      } else {
        setData([]);
        setDirections([]);
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
    setFilter({ direccion: "" });
  };

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
    if (field === "direccion") {
      // Verifica si la dirección ya existe en otro cliente
      const existingCliente = data.find(
        (cliente) =>
          cliente.direccion.toLowerCase() === value.toLowerCase() &&
          cliente.id !== id
      );

      if (existingCliente) {
        // Mostrar alerta y corregir automáticamente el campo
        alert(`La dirección "${value}" ya existe para otro cliente.`);
        setData((prevData) =>
          prevData.map((cliente) =>
            cliente.id === id
              ? { ...cliente, [field]: existingCliente.direccion }
              : cliente
          )
        );
        return; // Salir sin actualizar Firebase
      }
    }

    // Actualiza en Firebase
    const dbRef = ref(database, `clientes/${id}`);
    update(dbRef, { [field]: value }).catch((error) => {
      console.error("Error updating data: ", error);
    });

    // Actualiza en el estado local
    setData((prevData) =>
      prevData.map((cliente) =>
        cliente.id === id ? { ...cliente, [field]: value } : cliente
      )
    );
  };

  const capitalizeWords = (text) => {
    return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleAddCliente = () => {
    const existingClientes = data.map((cliente) => cliente.direccion);
    let nextNumber = 1;

    while (existingClientes.includes(`Nuevo Cliente ${nextNumber}`)) {
      nextNumber++;
    }

    const newCliente = {
      direccion: `Nuevo Cliente ${nextNumber}`,
      cubicos: 1,
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

  const filteredData = data.filter((cliente) =>
    filter.direccion
      ? (cliente.direccion || "")
          .toLowerCase()
          .includes(filter.direccion.toLowerCase())
      : true
  );

  return (
    <div className="homepage-container">
      <button className="show-sidebar-button" onClick={toggleSidebar}>
        ☰
      </button>
      <div ref={sidebarRef} className={`sidebar ${showSidebar ? "show" : ""}`}>
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
        <div>
          {user && user.name ? <p>Hola!, {user.name}</p> : <p>No user</p>}
        </div>
        <button className="menu-item" onClick={() => navigate("/homepage")}>
          Servicios De Hoy
        </button>
        <button className="menu-item" onClick={() => navigate("/historialdeservicios")}>
          Historial De Servicios
        </button>
        <button className="menu-item" onClick={() => navigate("/historialfacturasemitidas")}>
          Historial De Facturas Emitidas
        </button>
        <button className="menu-item" onClick={() => navigate("/configuracionservicios")}>
          Configuracion De Servicios
        </button>
        <button className="menu-item" onClick={() => navigate("/configuracionclientes")}>
          Configuracion De Clientes
        </button>
        <button className="menu-item" onClick={() => navigate("/usuarios")}>
          Configuración De Usuarios
        </button>
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

        <div
          className="filters"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginTop: "10px",
          }}
        >
          <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
            <button onClick={handleAddCliente} className="create-table-button">
              Agregar Cliente
            </button>
            <button
              onClick={() => {
                if (selectedClientes.length === 0) return; // Evita ejecutar si no hay clientes seleccionados

                Swal.fire({
                  title: "¿Estás seguro?",
                  text: "Esta acción eliminará los clientes seleccionados.",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonColor: "#d33",
                  cancelButtonColor: "#3085d6",
                  confirmButtonText: "Sí, eliminar",
                  cancelButtonText: "Cancelar",
                  position: "center", // Centrar la alerta
                  backdrop: "rgba(0,0,0,0.4)", // Mantener el fondo visible sin moverse
                  allowOutsideClick: false, // Evitar que se cierre al hacer clic afuera
                  allowEscapeKey: false, // Evitar cierre con ESC
                  stopKeydownPropagation: false, // Evitar bloqueo de teclado
                  heightAuto: false, // Evita que SweetAlert cambie la altura del body
                  didOpen: () => {
                    document.body.style.overflow = "auto"; // Mantiene el scroll normal
                  },
                  willClose: () => {
                    document.body.style.overflow = ""; // Restaura el fondo al cerrar
                  },
                }).then((result) => {
                  if (result.isConfirmed) {
                    handleDeleteClientes(); // Llama a la función para eliminar los clientes

                    Swal.fire({
                      title: "¡Eliminado!",
                      text: "Los clientes seleccionados han sido eliminados.",
                      icon: "success",
                      position: "center", // Mantiene la alerta en el centro
                      backdrop: "rgba(0,0,0,0.4)", // Mantiene el fondo sin moverse
                      timer: 2000, // Cierra automáticamente después de 2 segundos
                      showConfirmButton: false, // No muestra el botón "OK"
                      heightAuto: false, // Evita ajuste de altura en la página
                      didOpen: () => {
                        document.body.style.overflow = "auto"; // Mantiene el scroll normal
                      },
                      willClose: () => {
                        document.body.style.overflow = ""; // Restaura el fondo al cerrar
                      },
                    });
                  }
                });
              }}
              className="delete-button"
              disabled={selectedClientes.length === 0} // Deshabilita el botón si no hay clientes seleccionados
            >
              Eliminar Clientes Seleccionados
            </button>

            <button
              onClick={resetFilters}
              className="filter-button reset-button"
            >
              Descartar Filtros
            </button>
          </div>
          <div className="custom-select-container">
            <input
              type="text"
              name="direccion"
              style={{
                width: `${Math.max(filter.direccion?.length || 1, 50)}ch`,
                fontSize: "14px",
                borderRadius: "5px",
                padding: "5px",
              }}
              value={filter.direccion || ""}
              onChange={(e) => {
                handleFilterChange({
                  target: { name: "direccion", value: e.target.value },
                });
              }}
              list="direccion-options"
              placeholder="Filtrar por dirección"
              className="custom-select-input"
            />
            <datalist id="direccion-options">
              {data.map((cliente, index) => (
                <option
                  key={index}
                  value={cliente.direccion || "Sin dirección"}
                >
                  {cliente.direccion || "Sin dirección"}
                </option>
              ))}
            </datalist>
          </div>
        </div>

        <div
          className="table-container"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "20px",
          }}
        >
          <table className="service-table">
            <thead>
              <tr>
                <th>Seleccionar</th>
                <th>Dirección</th>
                <th>Cúbicos</th>
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
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={cliente.direccion}
                        onChange={(e) =>
                          handleFieldChange(
                            cliente.id,
                            "direccion",
                            capitalizeWords(e.target.value)
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={cliente.cubicos}
                        onChange={(e) =>
                          handleFieldChange(
                            cliente.id,
                            "cubicos",
                            e.target.value
                          )
                        }
                      />
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

export default Configuracionservicios;
