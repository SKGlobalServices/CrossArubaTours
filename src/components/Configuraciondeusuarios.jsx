import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "./firebaseConfig";
import { ref, set, push, remove, update, onValue } from "firebase/database";
import logo from "../assets/img/logo.jpg";
import Swal from "sweetalert2";

const Usuarios = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [data, setData] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const sidebarRef = useRef(null);

  const [currentDateTime, setCurrentDateTime] = useState({
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime({
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    const dbRef = ref(database, "users");

    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        setData(Object.entries(snapshot.val()));
      } else {
        setData([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/agendadeldia");
    }
  }, [user, navigate]);

  const addUser = () => {
    const dbRef = ref(database, "users");

    // Obtener los nombres existentes
    const existingNames = data.map(([_, user]) => user.name);

    // Generar un nombre único
    let nextNumber = 1;
    let newName = `Nuevo Usuario ${nextNumber}`;
    while (existingNames.includes(newName)) {
      nextNumber++;
      newName = `Nuevo Usuario ${nextNumber}`;
    }

    // Crear el nuevo usuario con nombre único y rol predeterminado
    const newUser = {
      email: `newuser${nextNumber}@example.com`,
      password: "password123",
      name: newName,
      role: "user",
    };

    // Guardar en Firebase
    const newUserRef = push(dbRef);
    set(newUserRef, newUser).catch((error) => {
      console.error("Error al agregar usuario: ", error);
    });
  };

  const deleteUser = (id) => {
    const dbRef = ref(database, `users/${id}`);
    remove(dbRef).catch((error) => {
      console.error("Error al eliminar usuario: ", error);
    });
  };

  const handleFieldChange = (id, field, value) => {
    const dbRef = ref(database, `users/${id}`);
    update(dbRef, { [field]: value }).catch((error) => {
      console.error("Error al actualizar usuario: ", error);
    });
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

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
    }; // <- Paréntesis correctamente cerrado
  }, []);

  if (!user) {
    return (
      <div className="error-container">
        <p className="error-message">¡Usuario no logueado!</p>
        <input
          type="button"
          value="Redirigiendo al inicio de sesión"
          onClick={() => navigate("/")}
          readOnly
        />
      </div>
    );
  }

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
        <h1 className="title-page">Usuarios</h1>
        <div className="current-date">
          <div>{currentDateTime.date}</div>
          <div>{currentDateTime.time}</div>
        </div>
          <button
          style={{marginLeft:"0px"}}
          className="create-table-button" onClick={addUser}>
            Agregar Usuario
          </button>
          <div className="table-container">
          <table className="service-table">
            <thead>
              <tr>
                <th>Correo</th>
                <th>Nombre</th>
                <th>Contraseña</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data && data.length > 0 ? (
                data.map(([id, item]) => (
                  <tr key={id}>
                    <td>
                      <input
                        type="email"
                        value={item.email || ""}
                        onChange={(e) =>
                          handleFieldChange(id, "email", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.name || ""}
                        onChange={(e) =>
                          handleFieldChange(id, "name", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={item.password || ""}
                        onChange={(e) =>
                          handleFieldChange(id, "password", e.target.value)
                        }
                      />
                      <button
                        className="show-password-button"
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? "Ocultar" : "Mostrar"}
                      </button>
                    </td>
                    <td>
                      <select
                        value={item.role || "user"}
                        onChange={(e) =>
                          handleFieldChange(id, "role", e.target.value)
                        }
                      >
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                        <option value="guest">Guest</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="delete-button"
                        onClick={() => {
                          Swal.fire({
                            title: "¿Estás seguro?",
                            text: "Esta acción eliminará al usuario permanentemente.",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#d33",
                            cancelButtonColor: "#3085d6",
                            confirmButtonText: "Sí, eliminar",
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
                              deleteUser(id);

                              Swal.fire({
                                title: "¡Usuario Eliminado!",
                                text: "El usuario ha sido eliminado exitosamente.",
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
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="no-data">
                  <td colSpan="5">No hay usuarios disponibles</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Usuarios;
