import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "./firebaseConfig";
import { ref, set, push, remove, update, onValue } from "firebase/database";
import Swal from "sweetalert2";
import logo from "../assets/img/logo.jpg";

const Homepage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarRef = useRef(null);

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
    const dbRef = ref(database, "data");
    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const fetchedData = Object.entries(snapshot.val());
        setData(
          fetchedData.sort(([idA, itemA], [idB, itemB]) => {
            if (!itemA.realizadopor) return 1;
            if (!itemB.realizadopor) return -1;
            return itemA.realizadopor.localeCompare(itemB.realizadopor);
          })
        );
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
        fetchedUsers.sort((a, b) => a.name.localeCompare(b.name)); // Orden alfabético
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

  const addData = async (
    realizadopor,
    anombrede,
    direccion,
    servicio,
    cubicos,
    valor,
    pago,
    notas,
    metododepago,
    efectivo,
    factura
  ) => {
    const dbRef = ref(database, "data");
    const newDataRef = push(dbRef);

    await set(newDataRef, {
      realizadopor,
      anombrede,
      direccion,
      servicio,
      cubicos,
      valor,
      pago,
      notas,
      metododepago,
      efectivo,
      factura,
    }).catch((error) => {
      console.error("Error adding data: ", error);
    });

    const updatedData = [...data, [newDataRef.key, { realizadopor }]];
    updatedData.sort(([idA, itemA], [idB, itemB]) => {
      if (!itemA.realizadopor) return 1;
      if (!itemB.realizadopor) return -1;
      return itemA.realizadopor.localeCompare(itemB.realizadopor);
    });
    setData(updatedData);
  };

  const handleFieldChange = (id, field, value) => {
    const dbRef = ref(database, `data/${id}`);
    update(dbRef, { [field]: value }).catch((error) => {
      console.error("Error updating data: ", error);
    });

    const updatedData = [...data];
    updatedData.forEach(([itemId, item]) => {
      if (itemId === id) {
        item[field] = value;
      }
    });

    if (field === "direccion") {
      const matchingClient = clients.find(
        (client) => client.direccion === value
      );
      if (matchingClient) {
        handleFieldChange(id, "cubicos", matchingClient.cubicos);
      }
    }

    if (field === "cubicos") {
      const dataItem = updatedData.find(([itemId]) => itemId === id);
      if (dataItem) {
        const [, item] = dataItem;
        syncWithClients(item.direccion, value);
      }
    }

    updatedData.sort(([idA, itemA], [idB, itemB]) => {
      if (!itemA.realizadopor) return 1;
      if (!itemB.realizadopor) return -1;
      return itemA.realizadopor.localeCompare(itemB.realizadopor);
    });
    setData(updatedData);

    if (field === "realizadopor") {
      const updatedUsers = [...users];
      if (!updatedUsers.some((user) => user.name === value)) {
        updatedUsers.push({ id, name: value });
      }
      updatedUsers.sort((a, b) => a.name.localeCompare(b.name));
      setUsers(updatedUsers);
    }
  };

  const syncWithClients = (direccion, cubicos) => {
    const existingClient = clients.find(
      (client) => client.direccion === direccion
    );

    if (existingClient) {
      if (existingClient.cubicos !== cubicos) {
        const clientRef = ref(database, `clientes/${existingClient.id}`);
        update(clientRef, { cubicos }).catch((error) => {
          console.error("Error updating client: ", error);
        });
      }
    } else {
      addClient(direccion, cubicos);
    }
  };

  const addClient = (direccion, cubicos) => {
    const dbRef = ref(database, "clientes");
    const newClientRef = push(dbRef);

    set(newClientRef, { direccion, cubicos }).catch((error) => {
      console.error("Error adding client: ", error);
    });
  };

  const deleteData = (id) => {
    const dbRef = ref(database, `data/${id}`);
    remove(dbRef).catch((error) => {
      console.error("Error deleting data: ", error);
    });

    const updatedData = data.filter(([itemId]) => itemId !== id);
    updatedData.sort(([idA, itemA], [idB, itemB]) => {
      if (!itemA.realizadopor) return 1;
      if (!itemB.realizadopor) return -1;
      return itemA.realizadopor.localeCompare(itemB.realizadopor);
    });
    setData(updatedData);
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

  const capitalizeWords = (str) => {
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getRowClass = (metodoPago) => {
    if (metodoPago === "efectivo") {
      return "efectivo";
    } else if (metodoPago === "cancelado") {
      return "cancelado";
    } else if (metodoPago === "credito") {
      return "credito";
    }
    return "";
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
        <h1 className="title-page">Servicios De Hoy</h1>
        <div className="current-date">
          <div>{currentDateTime.date}</div>
          <div>{currentDateTime.time}</div>
        </div>
        <button
          className="create-table-button"
          onClick={() => addData("", "", "", "", "", "", "", "", "", "", "")}
        >
          Agregar Nuevo Servicio
        </button>
        <div className="table-container">
          <table className="service-table">
            <thead>
              <tr>
                <th>Realizado Por</th>
                <th>A Nombre De</th>
                <th>Dirección</th>
                <th>Sevicio</th>
                <th>Cúbicos</th>
                <th>Valor</th>
                <th>Pago</th>
                <th>Acciones</th>
                <th>Notas</th>
                <th>Metodo De Pago</th>
                <th>Efectivo</th>
                <th>Factura</th>
              </tr>
            </thead>
            <tbody>
              {data && data.length > 0 ? (
                data.map(([id, item]) => {
                  const rowClass = getRowClass(item.metododepago);

                  return (
                    <tr key={id} className={rowClass}>
                      <td>
                        <input
                          className="p-text"
                          value={item.realizadopor}
                        ></input>
                      </td>
                      <td>
                        <input
                          type="text"
                          style={{
                            width: `${Math.max(
                              item.anombrede?.length || 1,
                              15
                            )}ch`,
                          }}
                          value={item.anombrede}
                          onChange={(e) =>
                            handleFieldChange(id, "anombrede", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <div className="custom-select-container">
                          <input
                            type="text"
                            style={{
                              width: `${Math.max(
                                item.direccion?.length || 1,
                                15
                              )}ch`,
                            }}
                            value={item.direccion || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                id,
                                "direccion",
                                capitalizeWords(e.target.value)
                              )
                            }
                            onFocus={(e) =>
                              e.target.setAttribute(
                                "list",
                                `direccion-options-${id}`
                              )
                            }
                            onBlur={(e) =>
                              setTimeout(
                                () => e.target.removeAttribute("list"),
                                200
                              )
                            }
                            className="custom-select-input"
                          />
                          <datalist id={`direccion-options-${id}`}>
                            {Array.from(
                              new Set(
                                clients
                                  .map((client) => client.direccion)
                                  .filter((direccion) => direccion)
                              )
                            ).map((direccion, index) => (
                              <option
                                key={index}
                                value={capitalizeWords(direccion)}
                              >
                                {capitalizeWords(direccion)}
                              </option>
                            ))}
                          </datalist>
                        </div>
                      </td>
                      <td>
                        <select
                          value={item.servicio}
                          style={{ width: "15ch" }}
                          onChange={(e) =>
                            handleFieldChange(id, "servicio", e.target.value)
                          }
                        >
                          <option value=""></option>
                          <option value="Servicio 1">Servicio 1</option>
                          <option value="Servicio 2">Servicio 2</option>
                          <option value="Servicio 3">Servicio 3</option>
                          <option value="Servicio 4">Servicio 4</option>
                          <option value="Servicio 5">Servicio 5</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          style={{
                            width: "12ch",
                            textAlign: "center",
                            marginLeft: "10px",
                          }}
                          value={item.cubicos}
                          onChange={(e) =>
                            handleFieldChange(id, "cubicos", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          style={{
                            width: "12ch",
                          }}
                          value={item.valor}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            handleFieldChange(id, "valor", newValue);

                            if (item.metododepago === "efectivo") {
                              handleFieldChange(id, "efectivo", newValue);
                            }
                          }}
                        />
                      </td>
                      <td>
                        <select
                          value={item.pago}
                          style={{ width: "22ch" }}
                          onChange={(e) =>
                            handleFieldChange(id, "pago", e.target.value)
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
                        <button
                          className="delete-button"
                          onClick={() => {
                            Swal.fire({
                              title: "¿Estás seguro de borrar este servicio?",
                              text: "Esta acción no se puede deshacer",
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#d33",
                              cancelButtonColor: "#3085d6",
                              confirmButtonText: "Sí, borrar",
                              cancelButtonText: "Cancelar",
                              position: "center",
                              backdrop: "rgba(0,0,0,0.4)",
                              allowOutsideClick: false,
                              allowEscapeKey: false,
                              stopKeydownPropagation: false,
                              heightAuto: false,
                              didOpen: () => {
                                document.body.style.overflow = "auto";
                              },
                              willClose: () => {
                                document.body.style.overflow = "";
                              },
                            }).then((result) => {
                              if (result.isConfirmed) {
                                deleteData(id);
                                Swal.fire({
                                  title: "¡Borrado!",
                                  text: "El servicio ha sido eliminado.",
                                  icon: "success",
                                  position: "center",
                                  backdrop: "rgba(0,0,0,0.4)",
                                  timer: 2000,
                                  showConfirmButton: false,
                                  heightAuto: false,
                                  didOpen: () => {
                                    document.body.style.overflow = "auto";
                                  },
                                  willClose: () => {
                                    document.body.style.overflow = "";
                                  },
                                });
                              }
                            });
                          }}
                        >
                          Borrar
                        </button>
                      </td>
                      <td>
                        <input
                          type="text"
                          style={{
                            width: `${Math.max(item.notas?.length || 1, 15)}ch`,
                          }}
                          value={item.notas}
                          onChange={(e) =>
                            handleFieldChange(id, "notas", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <select
                          value={item.metododepago}
                          onChange={(e) => {
                            const metodoDePago = e.target.value;

                            handleFieldChange(id, "metododepago", metodoDePago);

                            if (metodoDePago === "efectivo") {
                              handleFieldChange(id, "efectivo", item.valor);
                            } else {
                              handleFieldChange(id, "efectivo", "");
                            }
                          }}
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
                          style={{ width: "10ch" }}
                          value={item.efectivo}
                          onChange={(e) =>
                            handleFieldChange(id, "efectivo", e.target.value)
                          }
                          disabled={item.metododepago !== "efectivo"}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          style={{
                            width: "3ch",
                            height: "3ch",
                            marginLeft: "35%",
                          }}
                          checked={item.factura === true}
                          onChange={(e) =>
                            handleFieldChange(id, "factura", e.target.checked)
                          }
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="no-data">
                  <td colSpan="8">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
