import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "./firebaseConfig";
import { ref, set, push, remove, update, onValue } from "firebase/database";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import logo from "../assets/img/logo.jpg";

const Historialdeservicios = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [directions, setDirections] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarRef = useRef(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filter, setFilter] = useState({
    fechaInicio: null,
    fechaFin: null,
    direccion: "",
  });
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
    const dbRef = ref(database, "registrofechas");
    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const allData = snapshot.val();
        const formattedData = Object.entries(allData).map(
          ([fecha, registros]) => ({
            fecha,
            registros: Object.entries(registros).map(([id, registro]) => ({
              id,
              ...registro,
            })),
          })
        );

        setData(formattedData);

        const uniqueDirections = new Set();
        formattedData.forEach((item) => {
          item.registros.forEach((registro) => {
            uniqueDirections.add(registro.direccion);
          });
        });
        setDirections(Array.from(uniqueDirections));
      } else {
        setData([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const dbRef = ref(database, "users");
    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const fetchedUsers = Object.entries(snapshot.val())
          .filter(([_, user]) => user.role !== "admin")
          .map(([id, user]) => ({ id, name: user.name }));
        fetchedUsers.sort((a, b) => a.name.localeCompare(b.name));
        setUsers(fetchedUsers);
      } else {
        setUsers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const dbRef = ref(database, "clientes");
    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const fetchedClients = Object.entries(snapshot.val()).map(
          ([id, client]) => ({
            id,
            direccion: client.direccion,
            cubicos: client.cubicos,
          })
        );
        setClients(fetchedClients);
      } else {
        setClients([]);
      }
    });

    return () => unsubscribe();
  }, []);

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

  const handleDateRangeChange = (dates) => {
    const [start, end] = dates;
    if (!end) {
      // Si solo se selecciona el inicio, ajusta el filtro de inicio restando un día
      setFilter((prevState) => ({
        ...prevState,
        fechaInicio: start
          ? new Date(
              start.getFullYear(),
              start.getMonth(),
              start.getDate() - 1,
              0,
              0,
              0
            )
          : null,
      }));
    } else {
      // Si se selecciona un rango completo, ajusta ambos filtros normalmente
      setFilter((prevState) => ({
        ...prevState,
        fechaInicio: start
          ? new Date(
              start.getFullYear(),
              start.getMonth(),
              start.getDate(),
              0,
              0,
              0,
              0
            )
          : null,
        fechaFin: end
          ? new Date(
              end.getFullYear(),
              end.getMonth(),
              end.getDate(),
              0,
              59,
              59
            )
          : null,
      }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const resetFilters = () => {
    setFilter({ fechaInicio: null, fechaFin: null, direccion: "" });
  };

  const filteredData = data.filter((item) => {
    const { fecha, registros } = item;
    if (!fecha) return false;

    const itemDate = new Date(fecha.split("-").reverse().join("-"));
    const startDate = filter.fechaInicio;
    const endDate = filter.fechaFin;

    return (
      (!startDate || itemDate >= startDate) &&
      (!endDate || itemDate <= endDate) &&
      (filter.direccion
        ? registros.some((registro) => registro.direccion === filter.direccion)
        : true)
    );
  });

  const noDataForSelectedDate =
    filter.fechaInicio && filter.fechaFin && filteredData.length === 0;

  const handleFieldChange = (fecha, id, field, value) => {
    const dbRef = ref(database, `registrofechas/${fecha}/${id}`);
    update(dbRef, { [field]: value }).catch((error) => {
      console.error("Error updating data: ", error);
    });

    if (field === "direccion") {
      const matchingClient = clients.find(
        (client) => client.direccion === value
      );
      if (matchingClient) {
        update(dbRef, { cubicos: matchingClient.cubicos }).catch((error) => {
          console.error("Error updating cubicos: ", error);
        });
      }
    }
  };

  const [workerColors, setWorkerColors] = useState({});

  useEffect(() => {
    const dbRef = ref(database, "workerColors");
    onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        setWorkerColors(snapshot.val());
      }
    });
  }, []);

  const predefinedColors = [
    "#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#FFD700", "#800080", "#FF4500", "#2E8B57", "#1E90FF", "#DC143C",
    "#00FA9A", "#8A2BE2", "#FF8C00", "#228B22", "#DAA520", "#9932CC", "#FF1493", "#FF6347", "#40E0D0", "#ADFF2F",
    "#BA55D3", "#00CED1", "#3CB371", "#FF00FF", "#7FFF00", "#B22222", "#20B2AA", "#6B8E23", "#FFA07A", "#8B0000",
    "#00BFFF", "#4682B4", "#32CD32", "#A52A2A", "#9400D3", "#7B68EE", "#5F9EA0", "#FF69B4", "#9ACD32", "#E9967A",
    "#6495ED", "#8B4513", "#FA8072", "#B0C4DE", "#D2691E", "#FFDEAD", "#F08080", "#FFDAB9", "#98FB98", "#DDA0DD"
  ];
  
  const getWorkerColor = (workerName) => {
    if (!workerName) return "#f9f9f9"; // Color por defecto cuando no hay datos
  
    if (workerColors[workerName]) return workerColors[workerName];
  
    const dbRef = ref(database, `workerColors/${workerName}`);
  
    onValue(
      dbRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const savedColor = snapshot.val();
          setWorkerColors((prevColors) => ({
            ...prevColors,
            [workerName]: savedColor,
          }));
        } else {
          // Seleccionar un color de la paleta evitando repeticiones
          let availableColors = predefinedColors.filter(
            (color) => !Object.values(workerColors).includes(color)
          );
  
          const newColor =
            availableColors.length > 0
              ? availableColors[Math.floor(Math.random() * availableColors.length)]
              : predefinedColors[Math.floor(Math.random() * predefinedColors.length)]; // Si se agotan, repetir
  
          setWorkerColors((prevColors) => ({
            ...prevColors,
            [workerName]: newColor,
          }));
  
          // Guardar el nuevo color en Firebase
          set(dbRef, newColor).catch((error) => {
            console.error("Error saving color to Firebase: ", error);
          });
        }
      },
      { onlyOnce: true }
    );
  
    return workerColors[workerName] || "#f9f9f9"; // Evitar parpadeo inicial
  };
  
  

  const getPagoColor = (pago) => {
    switch (pago) {
      case "Debe":
        return "red"; // Rojo para "Debe"
      case "Pago":
        return "green"; // Verde para "Pago"
      case "Pendiente":
      case "Pendiente Fin De Mes":
        return "yellow"; // Amarillo para "Pendiente" y "Pendiente Fin De Mes"
      default:
        return "transparent"; // Fondo transparente si no hay valor
    }
  };

  const getMetodoPagoColor = (metododepago, efectivo) => {
    if (metododepago === "efectivo") return "purple"; // Morado si es efectivo y mayor a 0
    if (metododepago === "cancelado") return "red"; // Rojo si está cancelado
    if (metododepago === "credito") return "green"; // Verde si es crédito
    return "transparent"; // Fondo transparente si no hay valor
  };

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
        <h1 className="title-page">Agenda Dinámica</h1>
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
            marginRight: "51%",
            marginTop: "10px",
          }}
        >
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="filter-button"
            >
              Filtrar por rango de fechas
            </button>
            {showDatePicker && (
              <div style={{ position: "absolute", zIndex: 10 }}>
                <DatePicker
                  selected={filter.fechaInicio}
                  onChange={handleDateRangeChange}
                  startDate={filter.fechaInicio}
                  endDate={filter.fechaFin}
                  selectsRange
                  inline
                />
              </div>
            )}
          </div>
          <div className="custom-select-container">
            <input
              type="text"
              style={{
                width: `${Math.max(filter.direccion?.length || 1, 50)}ch`,
                fontSize: "14px",
                borderRadius: "5px",
                padding: "15px",
              }}
              value={filter.direccion || ""}
              onChange={(e) => {
                handleFilterChange({
                  target: { name: "direccion", value: e.target.value },
                });
              }}
              onFocus={(e) =>
                e.target.setAttribute("list", "direccion-options-filter")
              }
              onBlur={(e) =>
                setTimeout(() => e.target.removeAttribute("list"), 200)
              }
              placeholder="Filtrar por dirección"
              className="custom-select-input"
            />
            <datalist id="direccion-options-filter">
              {Array.from(
                new Set(
                  directions.filter((direccion) =>
                    direccion
                      .toLowerCase()
                      .includes(filter.direccion?.toLowerCase() || "")
                  )
                )
              ).map((direccion, index) => (
                <option key={index} value={direccion}>
                  {direccion}
                </option>
              ))}
            </datalist>
          </div>
          <button onClick={resetFilters} className="filter-button reset-button">
            Descartar filtros
          </button>
        </div>

        {noDataForSelectedDate && (
          <p>No hay datos para el rango de fechas seleccionado.</p>
        )}

        <div className="table-container">
          <table className="service-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Realizado Por</th>
                <th>A Nombre De</th>
                <th>Dirección</th>
                <th>Servicio</th>
                <th>Cúbicos</th>
                <th>Valor</th>
                <th>Pago</th>
                <th>Notas</th>
                <th>Metodo De Pago</th>
                <th>Efectivo</th>
                <th>Factura</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <React.Fragment key={item.fecha}>
                    {item.registros.map((registro) => (
                      <tr key={registro.id}>
                        <td
                          style={{
                            minWidth: "75px",
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          {item.fecha}
                        </td>
                        <td
                          style={{
                            backgroundColor: getWorkerColor(
                              registro.realizadopor
                            ),
                          }}
                        >
                          <select
                            value={registro.realizadopor || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                item.fecha,
                                registro.id,
                                "realizadopor",
                                e.target.value
                              )
                            }
                          >
                            <option value=""></option>
                            {users.map((user) => (
                              <option key={user.id} value={user.name}>
                                {user.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <input
                            type="text"
                            value={registro.anombrede || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                item.fecha,
                                registro.id,
                                "anombrede",
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td>
                          <div className="custom-select-container">
                            <input
                              type="text"
                              value={registro.direccion || ""}
                              onChange={(e) =>
                                handleFieldChange(
                                  item.fecha,
                                  registro.id,
                                  "direccion",
                                  e.target.value
                                )
                              }
                              list={`direccion-options-${registro.id}`}
                            />
                            <datalist id={`direccion-options-${registro.id}`}>
                              {clients.map((client, index) => (
                                <option key={index} value={client.direccion}>
                                  {client.direccion}
                                </option>
                              ))}
                            </datalist>
                          </div>
                        </td>
                        <td>
                          <select
                            value={registro.servicio || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                item.fecha,
                                registro.id,
                                "servicio",
                                e.target.value
                              )
                            }
                          >
                            <option value=""></option>
                            <option value="Servicio 1">Servicio 1</option>
                            <option value="Servicio 2">Servicio 2</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            style={{
                              textAlign: "center",
                            }}
                            value={registro.cubicos || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                item.fecha,
                                registro.id,
                                "cubicos",
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            style={{
                              textAlign: "center",
                            }}
                            value={registro.valor || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                item.fecha,
                                registro.id,
                                "valor",
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td
                          style={{
                            backgroundColor: getPagoColor(registro.pago),
                            textAlign: "center",
                            width:"11%"
                          }}
                        >
                          <select
                            value={registro.pago || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                item.fecha,
                                registro.id,
                                "pago",
                                e.target.value
                              )
                            }
                          >
                            <option value=""></option>
                            <option value="Debe">Debe</option>
                            <option value="Pago">Pago</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Pendiente Fin De Mes">
                              Pendiente Fin De Mes
                            </option>
                          </select>
                        </td>

                        <td>
                          <input
                            type="text"
                            style={{
                              width: `${Math.max(item.notas?.length || 1, 15)}ch`,
                            }}
                            value={registro.notas || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                item.fecha,
                                registro.id,
                                "notas",
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td
                          style={{
                            backgroundColor: getMetodoPagoColor(
                              registro.metododepago,
                              registro.efectivo
                            ),
                            textAlign: "center",
                          }}
                        >
                          <select
                            value={registro.metododepago || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                item.fecha,
                                registro.id,
                                "metododepago",
                                e.target.value
                              )
                            }
                          >
                            <option value=""></option>
                            <option value="credito">Crédito</option>
                            <option value="cancelado">Cancelado</option>
                            <option value="efectivo">Efectivo</option>
                          </select>
                        </td>

                        <td>
                          <input
                            type="number"
                            value={registro.efectivo || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                item.fecha,
                                registro.id,
                                "efectivo",
                                e.target.value
                              )
                            }
                            disabled={registro.metododepago !== "efectivo"}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={registro.factura === true}
                            onChange={(e) =>
                              handleFieldChange(
                                item.fecha,
                                registro.id,
                                "factura",
                                e.target.checked
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="13">No hay datos disponibles.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Historialdeservicios;
