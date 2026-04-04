import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "./firebaseConfig";
import {
  ref,
  set,
  push,
  remove,
  update,
  onValue,
  get,
} from "firebase/database";
import Swal from "sweetalert2";
import logo from "../assets/img/logo.jpg";
import logotipo from "../assets/img/logotipo.jpg";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import LoadingScreen from "./LoadingScreen";
import usePageLoading from "./usePageLoading";

const Agendadeldiausuario = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  // Estados para cada tabla
  const [dataDASC, setDataDASC] = useState([]);
  const [dataCROSS, setDataCROSS] = useState([]);

  // Estado para guardar los IDs de las filas seleccionadas
  const [selectedRows, setSelectedRows] = useState([]);

  // Otros estados
  const [clients, setClients] = useState([]);
  const [hotels, setHoteles] = useState([]);
  const [services, setServices] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const sidebarRef = useRef(null);
  const [dataLoading, onResolved] = usePageLoading(6);
  const [currentDateTime, setCurrentDateTime] = useState({
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
  });

  const formatDollar = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  // Función para seleccionar o deseleccionar todas las filas
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = homepageDataSorted.map(([id]) => id);
      setSelectedRows(allIds);
    } else {
      setSelectedRows([]);
    }
  };

  // Función para actualizar el estado de la fila seleccionada
  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedRows((prev) => [...prev, id]);
    } else {
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id));
    }
  };

  // Actualizar la fecha y hora cada segundo
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

  // Obtener los datos de agendartoursdasc
  useEffect(() => {
    const dbRefDASC = ref(database, "agendartoursdasc");
    const unsubscribeDASC = onValue(dbRefDASC, (snapshot) => {
      const firebaseData = snapshot.val();
      if (firebaseData) {
        setDataDASC(
          Object.entries(firebaseData).map(([id, item]) => [
            id,
            { ...item, source: "dasc" },
          ])
        );
      } else {
        setDataDASC([]);
      }
      onResolved();
    });
    return () => unsubscribeDASC();
  }, []);

  // Obtener los datos de agendartourscross
  useEffect(() => {
    const dbRefCROSS = ref(database, "agendartourscross");
    const unsubscribeCROSS = onValue(dbRefCROSS, (snapshot) => {
      const firebaseData = snapshot.val();
      if (firebaseData) {
        setDataCROSS(
          Object.entries(firebaseData).map(([id, item]) => [
            id,
            { ...item, source: "cross" },
          ])
        );
      } else {
        setDataCROSS([]);
      }
      onResolved();
    });
    return () => unsubscribeCROSS();
  }, []);

  // Combinar los datos de ambas tablas
  const combinedData = [...dataDASC, ...dataCROSS];

  // Función auxiliar para obtener la referencia según el origen del dato
  const getItemRef = (id, source) => {
    return ref(database, `agendartours${source}/${id}`);
  };

  // Obtener clientes
  useEffect(() => {
    const clientsRef = ref(database, "clientes");
    const unsubscribe = onValue(clientsRef, (snapshot) => {
      snapshot.exists()
        ? setClients(Object.values(snapshot.val()))
        : setClients([]);
      onResolved();
    });
    return () => unsubscribe();
  }, []);

  // Obtener hoteles
  useEffect(() => {
    const hotelesRef = ref(database, "hoteles");
    const unsubscribe = onValue(hotelesRef, (snapshot) => {
      snapshot.exists()
        ? setHoteles(Object.values(snapshot.val()))
        : setHoteles([]);
      onResolved();
    });
    return () => unsubscribe();
  }, []);

  // Obtener servicios
  useEffect(() => {
    const servicesRef = ref(database, "servicios");
    const unsubscribe = onValue(servicesRef, (snapshot) => {
      snapshot.exists()
        ? setServices(Object.values(snapshot.val()))
        : setServices([]);
      onResolved();
    });
    return () => unsubscribe();
  }, []);

  // Obtener los horarios desde Firebase (estructura: { horarioam, horariopm })
  useEffect(() => {
    const horariosRef = ref(database, "horarios");
    const unsubscribeHorarios = onValue(horariosRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setHorarios([{ horarioam: data.horarioam, horariopm: data.horariopm }]);
      } else {
        setHorarios([]);
      }
      onResolved();
    });
    return () => unsubscribeHorarios();
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

  // Ordenar los datos combinados por fecha (fechadeltour)
  const homepageDataSorted = [...combinedData].sort((a, b) => {
    const dateA = a[1].fechadeltour;
    const dateB = b[1].fechadeltour;
    if (!dateA && !dateB) return 0;
    if (!dateA) return -1;
    if (!dateB) return 1;
    return new Date(dateB) - new Date(dateA);
  });

  if (dataLoading) return <LoadingScreen />;

  return (
    <div className="homepage-container">
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              border: "4px solid rgba(255, 255, 255, 0.3)",
              borderTop: "4px solid #fff",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              animation: "spin 1s linear infinite",
            }}
          />
        </div>
      )}
      <button
        className="show-sidebar-button"
        onClick={() => setShowSidebar(!showSidebar)}
      >
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
        <button
          className="menu-item"
          onClick={() => navigate("/agendadeldiausuario")}
        >
          Agenda Del Dia
        </button>
        <button className="menu-item" onClick={handleLogout}>
          Cerrar Sesión
        </button>
        <div>
          <p>© 2025 S&K Global Services</p>
        </div>
      </div>

      <div className="homepage-card">
        <h1 className="title-page">Agenda General</h1>
        <div className="current-date">
          <div>{currentDateTime.date}</div>
          <div>{currentDateTime.time}</div>
        </div>
        <div className="table-container">
          <table className="service-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      homepageDataSorted.length > 0 &&
                      selectedRows.length === homepageDataSorted.length
                    }
                    style={{
                      width: "3ch",
                      height: "3ch",
                      marginLeft: "0",
                    }}
                  />
                </th>
                <th>Fecha del tour</th>
                <th>Horario</th>
                <th>Número de voucher</th>
                <th>Empresa/Cliente</th>
                <th>Cliente de referencia</th>
                <th>Address Or Hotel</th>
                <th>Recepcionista</th>
                <th>Número de Pasajeros</th>
                <th>Tipo de tour</th>
                <th>Valor del tour</th>
                <th>Total</th>
                <th>Nota</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {homepageDataSorted && homepageDataSorted.length > 0 ? (
                homepageDataSorted.map(([id, item]) => (
                  <tr key={id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(id)}
                        onChange={(e) => handleSelectRow(id, e.target.checked)}
                        style={{
                          width: "3ch",
                          height: "3ch",
                          marginLeft: "0",
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={item.fechadeltour || ""}
                        onChange={(e) =>
                          update(getItemRef(id, item.source), {
                            fechadeltour: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <div className="custom-select-container">
                        <input
                          type="text"
                          value={item.horario || ""}
                          onChange={(e) =>
                            update(getItemRef(id, item.source), {
                              horario: e.target.value,
                            })
                          }
                          onFocus={(e) =>
                            e.target.setAttribute(
                              "list",
                              `horario-options-${id}`
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
                        <datalist id={`horario-options-${id}`}>
                          {horarios.map((h, index) => (
                            <React.Fragment key={index}>
                              <option key={`am-${index}`} value={h.horarioam}>
                                {h.horarioam}
                              </option>
                              <option key={`pm-${index}`} value={h.horariopm}>
                                {h.horariopm}
                              </option>
                            </React.Fragment>
                          ))}
                        </datalist>
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.numerodevoucher || ""}
                        onChange={(e) =>
                          update(getItemRef(id, item.source), {
                            numerodevoucher: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <div className="custom-select-container">
                        <input
                          type="text"
                          value={item.empresaocliente || ""}
                          onChange={(e) =>
                            update(getItemRef(id, item.source), {
                              empresaocliente: e.target.value,
                            })
                          }
                          onFocus={(e) =>
                            e.target.setAttribute(
                              "list",
                              `empresa-options-${id}`
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
                        <datalist id={`empresa-options-${id}`}>
                          {[
                            ...new Set(
                              clients
                                .map((client) => client.cliente)
                                .filter((cliente) => cliente)
                            ),
                          ].map((cliente, index) => (
                            <option key={index} value={cliente}>
                              {cliente}
                            </option>
                          ))}
                        </datalist>
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.clientedereferencia || ""}
                        onChange={(e) =>
                          update(getItemRef(id, item.source), {
                            clientedereferencia: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <div className="custom-select-container">
                        <input
                          type="text"
                          value={item.hotel || ""}
                          onChange={(e) =>
                            update(getItemRef(id, item.source), {
                              hotel: e.target.value,
                            })
                          }
                          onFocus={(e) =>
                            e.target.setAttribute("list", `hotel-options-${id}`)
                          }
                          onBlur={(e) =>
                            setTimeout(
                              () => e.target.removeAttribute("list"),
                              200
                            )
                          }
                          className="custom-select-input"
                        />
                        <datalist id={`hotel-options-${id}`}>
                          {hotels
                            .map((hotel) => hotel.nombre)
                            .filter((nombre) => nombre)
                            .map((nombre, index) => (
                              <option key={index} value={nombre}>
                                {nombre}
                              </option>
                            ))}
                        </datalist>
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.recepcionista || ""}
                        onChange={(e) =>
                          update(getItemRef(id, item.source), {
                            recepcionista: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.numerodepasajeros || 0}
                        onChange={async (e) => {
                          const pasajeros = parseInt(e.target.value, 10) || 0;
                          const total = parseFloat(
                            (pasajeros * (item.valordetour || 0)).toFixed(2)
                          );
                          await update(getItemRef(id, item.source), {
                            numerodepasajeros: pasajeros,
                            total,
                          });
                          if (pasajeros > 0 && item.empresaocliente) {
                            const clienteNombre = item.empresaocliente;
                            const clientesRef = ref(database, "clientes");
                            const snapshotClientes = await new Promise(
                              (resolve) =>
                                onValue(clientesRef, (snap) => resolve(snap), {
                                  onlyOnce: true,
                                })
                            );
                            const clienteExiste = snapshotClientes.exists()
                              ? Object.values(snapshotClientes.val()).some(
                                  (cliente) => cliente.cliente === clienteNombre
                                )
                              : false;
                            if (!clienteExiste) {
                              const newClientRef = push(clientesRef);
                              await set(newClientRef, {
                                cliente: clienteNombre,
                                clientedereferencia:
                                  item.clientedereferencia || "Sin referencia",
                                fechadeltour:
                                  item.fechadeltour || "Fecha no registrada",
                                tipodetour:
                                  item.tipodetour || "Sin tour asignado",
                              }).catch((error) => {
                                console.error(
                                  "Error al agregar cliente: ",
                                  error
                                );
                              });
                            }
                          }
                          if (item.hotel) {
                            const hotelNombre = item.hotel;
                            const hotelesRef = ref(database, "hoteles");
                            const snapshotHoteles = await new Promise(
                              (resolve) =>
                                onValue(hotelesRef, (snap) => resolve(snap), {
                                  onlyOnce: true,
                                })
                            );
                            const hotelExiste = snapshotHoteles.exists()
                              ? Object.values(snapshotHoteles.val()).some(
                                  (hotel) => hotel.nombre === hotelNombre
                                )
                              : false;
                            if (!hotelExiste) {
                              const newHotelRef = push(hotelesRef);
                              await set(newHotelRef, {
                                nombre: hotelNombre,
                                ubicacion:
                                  item.ubicacion || "Ubicación no especificada",
                              }).catch((error) => {
                                console.error(
                                  "Error al agregar hotel: ",
                                  error
                                );
                              });
                            }
                          }
                        }}
                        min="0"
                      />
                    </td>
                    <td>
                      <select
                        value={item.tipodetour || ""}
                        onChange={(e) => {
                          const selectedService = e.target.value;
                          const service = services.find(
                            (servicio) => servicio.nombre === selectedService
                          );
                          const valor = service ? parseFloat(service.valor) : 0;
                          const valorFormateado = parseFloat(valor.toFixed(2));
                          const total = parseFloat(
                            (
                              (item.numerodepasajeros || 0) * valorFormateado
                            ).toFixed(2)
                          );
                          update(getItemRef(id, item.source), {
                            tipodetour: selectedService,
                            valordetour: valorFormateado,
                            total,
                          });
                        }}
                      >
                        <option value=""></option>
                        {services.map((servicio) => (
                          <option key={servicio.id} value={servicio.nombre}>
                            {servicio.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={formatDollar(Number(item.valordetour || 0))}
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={formatDollar(Number(item.total || 0))}
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.nota || ""}
                        onChange={(e) =>
                          update(getItemRef(id, item.source), {
                            nota: e.target.value,
                          })
                        }
                      />
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
                          }).then((result) => {
                            if (result.isConfirmed) {
                              remove(getItemRef(id, item.source))
                                .then(() => {
                                  Swal.fire({
                                    title: "¡Borrado!",
                                    text: "El servicio ha sido eliminado.",
                                    icon: "success",
                                    position: "center",
                                    backdrop: "rgba(0,0,0,0.4)",
                                    timer: 2000,
                                    showConfirmButton: false,
                                    heightAuto: false,
                                  });
                                })
                                .catch((error) => {
                                  Swal.fire({
                                    title: "Error",
                                    text: "No se pudo eliminar el servicio.",
                                    icon: "error",
                                    position: "center",
                                    backdrop: "rgba(0,0,0,0.4)",
                                    timer: 2000,
                                    showConfirmButton: false,
                                    heightAuto: false,
                                  });
                                  console.error("Error deleting data: ", error);
                                });
                            }
                          });
                        }}
                      >
                        Borrar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="no-data">
                  <td colSpan="13">No hay datos disponibles</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Agendadeldiausuario;
