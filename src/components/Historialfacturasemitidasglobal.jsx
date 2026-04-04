import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "./firebaseConfig";
import { ref, set, push, remove, update, onValue } from "firebase/database";
import Swal from "sweetalert2";
import logo from "../assets/img/logo.jpg";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Historialfacturasemitidasdetours = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [data, setData] = useState([]);
  const [clients, setClients] = useState([]);
  const [hotels, setHoteles] = useState([]);
  const [services, setServices] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // Estado para los filtros (fechas e invoice)
  const [filter, setFilter] = useState({
    fechaInicio: null,
    fechaFin: null,
    invoice: "",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Función para formatear en dólares
  const formatDollar = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

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

  // Validar acceso de usuario
  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/agendadeldiausuario");
    }
  }, [user, navigate]);

  // Función para cerrar sesión
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

  // Obtener datos de historial (detours)
  useEffect(() => {
    const dbRef = ref(database, "historialdetours");
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const firebaseData = snapshot.val();
      firebaseData ? setData(Object.entries(firebaseData)) : setData([]);
    });
    return () => unsubscribe();
  }, []);

  // Obtener datos de clientes
  useEffect(() => {
    const clientsRef = ref(database, "clientes");
    const unsubscribe = onValue(clientsRef, (snapshot) => {
      snapshot.exists()
        ? setClients(Object.values(snapshot.val()))
        : setClients([]);
    });
    return () => unsubscribe();
  }, []);

  // Obtener datos de hoteles
  useEffect(() => {
    const hotelesRef = ref(database, "hoteles");
    const unsubscribe = onValue(hotelesRef, (snapshot) => {
      snapshot.exists()
        ? setHoteles(Object.values(snapshot.val()))
        : setHoteles([]);
    });
    return () => unsubscribe();
  }, []);

  // Obtener datos de servicios
  useEffect(() => {
    const servicesRef = ref(database, "servicios");
    const unsubscribe = onValue(servicesRef, (snapshot) => {
      snapshot.exists()
        ? setServices(Object.values(snapshot.val()))
        : setServices([]);
    });
    return () => unsubscribe();
  }, []);

  // Manejo del sidebar
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Función auxiliar para filtrar la data según fechas e invoice
  const getFilteredData = (data, { fechaInicio, fechaFin, invoice }) => {
    return data.filter(([id, item]) => {
      const itemDate = new Date(item.fechadeltour);
      itemDate.setDate(itemDate.getDate() + 1);

      if (fechaInicio && itemDate < fechaInicio) return false;
      if (fechaFin && itemDate > fechaFin) return false;
      if (
        invoice &&
        !item.invoice?.toLowerCase().includes(invoice.toLowerCase())
      )
        return false;
      return true;
    });
  };

  // Usamos useMemo para recalcular solo si data o filter cambian
  const filteredData = useMemo(
    () => getFilteredData(data, filter),
    [data, filter]
  );

  // Ordenar la data filtrada (por fecha del tour, de más reciente a más antigua)
  const homepageDataSorted = filteredData.sort((a, b) => {
    const dateA = new Date(a[1].fechadeltour);
    const dateB = new Date(b[1].fechadeltour);
    return dateB - dateA;
  });

  // Calcular el total acumulado
  const totalBalanceDue = homepageDataSorted.reduce(
    (acc, [id, item]) => acc + (Number(item.total) || 0),
    0
  );

  // Manejar cambio en el rango de fechas con react-datepicker
  const handleDateRangeChange = (dates) => {
    const [start, end] = dates;
    if (!end) {
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
        fechaFin: null,
      }));
    } else {
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
        // Se ajusta la fecha final para incluir hasta el último milisegundo del día
        fechaFin: end
          ? new Date(
              end.getFullYear(),
              end.getMonth(),
              end.getDate(),
              23,
              59,
              59,
              999
            )
          : null,
      }));
    }
  };

  // Manejar cambios en el input del invoice
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Función para resetear los filtros
  const resetFilters = () => {
    setFilter({ fechaInicio: null, fechaFin: null, invoice: "" });
  };

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
        <h1 className="title-page">Historial De Tours</h1>
        <div className="current-date">
          <div>{currentDateTime.date}</div>
          <div>{currentDateTime.time}</div>
        </div>

        {/* Contenedor de filtros */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div className="filters">
            <div className="datepicker-container">
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="filter-button"
                >
                  Filtrar fechas
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
            </div>
            <div className="custom-select-container">
              <input
                type="text"
                name="invoice"
                style={{
                  width: `${Math.max(filter.invoice?.length || 1, 50)}ch`,
                  fontSize: "12px",
                  borderRadius: "5px",
                  padding: "12px",
                }}
                value={filter.invoice || ""}
                onChange={handleFilterChange}
                placeholder="Filtrar por invoice"
                className="custom-filter-input"
                list="invoice-options-filter"
              />
              <datalist id="invoice-options-filter">
                {Array.from(
                  new Set(
                    data
                      .map(([id, item]) => item.invoice)
                      .filter((inv) =>
                        inv
                          ?.toLowerCase()
                          .includes(filter.invoice.toLowerCase() || "")
                      )
                  )
                ).map((inv, index) => (
                  <option key={index} value={inv}>
                    {inv}
                  </option>
                ))}
              </datalist>
            </div>
            <button
              onClick={resetFilters}
              className="discard-filter-button"
              style={{ marginLeft: "40px" }}
            >
              Descartar filtros
            </button>
          </div>
        </div>

        {/* Tabla de datos */}
        <div className="table-container">
          <table className="service-table">
            <thead>
              <tr>
                <th>Fecha De Generación</th>
                <th
                  style={{
                    paddingLeft: "35px",
                    paddingRight: "35px",
                  }}
                >
                  Invoice
                </th>
                <th>Fecha del tour</th>
                <th>Horario</th>
                <th>Número de voucher</th>
                <th>Empresa/Cliente</th>
                <th>Cliente de referencia</th>
                <th>Adress Or Hotel</th>
                <th>Recepcionista</th>
                <th
                  style={{
                    paddingLeft: "25px",
                    paddingRight: "25px",
                  }}
                >
                  PAX
                </th>
                <th>Tipo de tour</th>
                <th>Valor del tour</th>
                <th
                  style={{
                    paddingLeft: "25px",
                    paddingRight: "25px",
                  }}
                >
                  Total
                </th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {homepageDataSorted && homepageDataSorted.length > 0 ? (
                homepageDataSorted.map(([id, item]) => (
                  <tr key={id}>
                    <td>
                      <input
                        type="text"
                        value={item.fechadegeneracion || ""}
                        onChange={(e) =>
                          update(ref(database, `historialdetours/${id}`), {
                            fechadegeneracion: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.invoice || ""}
                        onChange={(e) =>
                          update(ref(database, `historialdetours/${id}`), {
                            invoice: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={item.fechadeltour || ""}
                        onChange={(e) =>
                          update(ref(database, `historialdetours/${id}`), {
                            fechadeltour: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.horario || ""}
                        onChange={(e) =>
                          update(ref(database, `historialdetours/${id}`), {
                            horario: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.numerodevoucher || ""}
                        onChange={(e) =>
                          update(ref(database, `historialdetours/${id}`), {
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
                            update(ref(database, `historialdetours/${id}`), {
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
                          update(ref(database, `historialdetours/${id}`), {
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
                            update(ref(database, `historialdetours/${id}`), {
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
                          update(ref(database, `historialdetours/${id}`), {
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
                          await update(
                            ref(database, `historialdetours/${id}`),
                            {
                              numerodepasajeros: pasajeros,
                              total,
                            }
                          );
                          // Validación de clientes y hoteles según corresponda
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
                          update(ref(database, `historialdetours/${id}`), {
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
                              const dbRef = ref(
                                database,
                                `historialdetours/${id}`
                              );
                              remove(dbRef)
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

export default Historialfacturasemitidasdetours;
