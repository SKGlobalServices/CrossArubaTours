import React, { useState, useEffect, useRef, useMemo } from "react";
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
} from "firebase/database"; // Se agregó "get"
import Swal from "sweetalert2";
import logo from "../assets/img/logo.jpg";
import logotipo from "../assets/img/logotipo.jpg";
import jsPDF from "jspdf";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import "jspdf-autotable"; // Para que la cabecera de la tabla se repita
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Función auxiliar para convertir una imagen (URL) a base64
const getBase64ImageFromUrl = async (url) => {
  const img = new Image();
  img.setAttribute("crossOrigin", "anonymous");
  img.src = url;
  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/jpeg");
      resolve(dataURL);
    };
    img.onerror = (error) => reject(error);
  });
};

// Componente para mostrar la factura (se modifica para recibir invoiceNumber como prop)
const FacturaInvoice = ({ data, totalBalanceDue, invoiceNumber }) => {
  const styles = {
    container: {
      fontFamily: "Arial, sans-serif",
      width: "800px",
      margin: "20px auto",
      backgroundColor: "#ffffff",
      padding: "20px",
      boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "15px 0",
    },
    logoSection: { display: "flex", alignItems: "center" },
    logo: {
      width: "150px",
      height: "150px",
      marginRight: "20px",
      borderRadius: "30px",
    },
    companyInfo: { textAlign: "left", color: "#333" },
    companyInfoTitle: { margin: 0, fontSize: "24px" },
    companyInfoText: { margin: "5px 0", color: "#666" },
    invoiceDetails: { textAlign: "right", color: "#333" },
    invoiceDetailsItem: { margin: "5px 0" },
    invoiceDetailsItem1: { margin: "5px 0", fontWeight: "bold" },
    invoiceDetailsHighlight: { display: "block", color: "#6a1b9a" },
    billTo: { margin: "20px 0" },
    billToText: { margin: "5px 0", fontWeight: "bold", color: "#333" },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginBottom: "20px",
    },
    th: {
      border: "1px solid #ddd",
      padding: "10px",
      textTransform: "uppercase",
      fontSize: "14px",
      backgroundColor: "#fff",
      color: "black",
    },
    td: {
      border: "1px solid #ddd",
      padding: "10px",
      textAlign: "left",
      fontSize: "12px",
      backgroundColor: "white",
      color: "black",
    },
    tdCenter: { textAlign: "center" },
    tableRowEven: { backgroundColor: "white" },
    footer: { borderTop: "3px solid rgba(0, 0, 0, 0.1)", paddingTop: "1px" },
    footerContent: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    paymentInfo: { width: "50%", color: "black", paddingTop: "4px" },
    paymentInfoText: { margin: "5px 0" },
    paymentInfoText1: { margin: "5px 0", fontWeight: "bold" },
    totalBox: { width: "45%", textAlign: "right", padding: "10px" },
    totalBoxText: { margin: "10px 0", fontWeight: "bold", color: "black" },
    totalBoxHighlight: {
      fontWeight: "bold",
      fontSize: "18px",
      color: "#6a1b9a",
    },
    thankYou: {
      textAlign: "center",
      marginTop: "20px",
      fontWeight: "bold",
      color: "#333",
    },
  };

  return (
    <div id="invoice" style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logoSection}>
          <img src={logotipo} alt="Logo" style={styles.logo} />
          <div style={styles.companyInfo}>
            <h1 style={styles.companyInfoTitle}>Cross Aruba Tours</h1>
            <p style={styles.companyInfoText}>Pavia Park 103</p>
            <p style={styles.companyInfoText}>6999690</p>
          </div>
        </div>
        <div style={styles.invoiceDetails}>
          <p style={styles.invoiceDetailsItem1}>INVOICE: {invoiceNumber}</p>
          <p style={styles.invoiceDetailsItem}>
            DATE: {new Date().toLocaleDateString()}
          </p>
          <p style={styles.invoiceDetailsItem}>DUE: On Receipt</p>
          <p style={styles.invoiceDetailsHighlight}>
            BALANCE DUE: USD {totalBalanceDue.toFixed(2)}
          </p>
        </div>
      </div>
      <div style={styles.billTo}>
        <p style={styles.billToText}>BILL TO: DASC</p>
      </div>
      <table style={styles.table}>
        <thead style={{ display: "table-header-group" }}>
          <tr>
            <th style={styles.th}>VOUCHER</th>
            <th style={styles.th}>HOTEL</th>
            <th style={styles.th}>CUSTOMER REF</th>
            <th style={styles.th}>TOUR TYPE</th>
            <th style={styles.th}>QTY</th>
            <th style={styles.th}>PRICE</th>
            <th style={styles.th}>AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {data
            .slice()
            .sort((a, b) =>
              a.numerodevoucher.localeCompare(b.numerodevoucher, undefined, {
                numeric: true,
              })
            )
            .map((item, index) => (
              <tr
                key={index}
                style={index % 2 === 0 ? styles.tableRowEven : {}}
              >
                <td style={styles.td}>{item.numerodevoucher}</td>
                <td style={styles.td}>{item.hotel}</td>
                <td style={styles.td}>{item.clientedereferencia}</td>
                <td style={styles.td}>{item.tipodetour}</td>
                <td style={{ ...styles.td, ...styles.tdCenter }}>
                  {item.numerodepasajeros}
                </td>
                <td style={styles.td}>
                  ${Number(item.valordetour).toFixed(2)}
                </td>
                <td style={styles.td}>${Number(item.total).toFixed(2)}</td>
              </tr>
            ))}
        </tbody>
      </table>
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.paymentInfo}>
            <p style={styles.paymentInfoText1}>Payment Info:</p>
            <p style={styles.paymentInfoText}>CMB# 64481806</p>
            <p style={styles.paymentInfoText}>Cross Aruba Tours</p>
            <p style={styles.paymentInfoText}>Pavia Park 103</p>
          </div>
          <div style={styles.totalBox}>
            <p style={styles.totalBoxText}>
              TOTAL: USD {totalBalanceDue.toFixed(2)}
            </p>
            <p style={styles.totalBoxHighlight}>
              BALANCE DUE: USD {totalBalanceDue.toFixed(2)}
            </p>
          </div>
        </div>
        <p style={styles.thankYou}>Thank you for doing business</p>
      </footer>
    </div>
  );
};

const Historialfacturasemitidas = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [data, setData] = useState([]);
  const [clients, setClients] = useState([]);
  const [hotels, setHoteles] = useState([]);
  const [services, setServices] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(false); // Estado para la carga
  const [invoiceCounter, setInvoiceCounter] = useState(null); // Contador de factura
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

  // Estado para el filtro y visibilidad del DatePicker
  const [filter, setFilter] = useState({
    fechaInicio: null,
    fechaFin: null,
    invoice: "",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDollar = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  // --- Obtener el contador de factura desde Firebase ---
  useEffect(() => {
    const invoiceCounterRef = ref(database, "invoiceCounter");
    const fetchInvoiceCounter = async () => {
      try {
        const snapshot = await get(invoiceCounterRef);
        if (snapshot.exists()) {
          setInvoiceCounter(snapshot.val());
        } else {
          await set(invoiceCounterRef, 1);
          setInvoiceCounter(1);
        }
      } catch (error) {
        console.error("Error fetching invoice counter: ", error);
      }
    };
    fetchInvoiceCounter();
  }, []);

  const invoiceNumber =
    invoiceCounter !== null
      ? `INV${invoiceCounter.toString().padStart(5, "0")}-DASC`
      : "";

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
    const dbRef = ref(database, "historialdasc");
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const firebaseData = snapshot.val();
      firebaseData ? setData(Object.entries(firebaseData)) : setData([]);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const clientsRef = ref(database, "clientes");
    const unsubscribe = onValue(clientsRef, (snapshot) => {
      snapshot.exists()
        ? setClients(Object.values(snapshot.val()))
        : setClients([]);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const hotelesRef = ref(database, "hoteles");
    const unsubscribe = onValue(hotelesRef, (snapshot) => {
      snapshot.exists()
        ? setHoteles(Object.values(snapshot.val()))
        : setHoteles([]);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const servicesRef = ref(database, "servicios");
    const unsubscribe = onValue(servicesRef, (snapshot) => {
      snapshot.exists()
        ? setServices(Object.values(snapshot.val()))
        : setServices([]);
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

  // Función auxiliar para filtrar la data según fechas e invoice.
  // Se suma 1 día a la fecha de cada registro para la comparación.
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

  // Ordenar la data filtrada
  const homepageDataSorted = [...filteredData].sort((a, b) => {
    const dateA = a[1].fechadeltour;
    const dateB = b[1].fechadeltour;
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return 1;
    return new Date(dateB) - new Date(dateA);
  });

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

  const generateExcel = async () => {
    // Filtrar los registros que tengan un voucher válido (no vacío)
    const excelData = homepageDataSorted
      .filter(
        ([id, item]) =>
          item.numerodevoucher && item.numerodevoucher.trim() !== ""
      )
      .map(([, item]) => ({
        Voucher: item.numerodevoucher,
        Hotel: item.hotel,
        "Customer Ref": item.clientedereferencia,
        "Tour Type": item.tipodetour,
        Qty: item.numerodepasajeros,
        Price: Number(item.valordetour).toFixed(2),
        Amount: Number(item.total).toFixed(2),
      }));

    if (excelData.length === 0) {
      Swal.fire({
        title: "Sin datos",
        text: "No se encontraron registros con contenido en voucher.",
        icon: "warning",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    // Crear un nuevo workbook y worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Vouchers");

    // Definir las columnas con los mismos encabezados que la tabla
    worksheet.columns = [
      { header: "Voucher", key: "Voucher", width: 20 },
      { header: "Hotel", key: "Hotel", width: 30 },
      { header: "Customer Ref", key: "Customer Ref", width: 20 },
      { header: "Tour Type", key: "Tour Type", width: 20 },
      { header: "Qty", key: "Qty", width: 10 },
      { header: "Price", key: "Price", width: 15 },
      { header: "Amount", key: "Amount", width: 15 },
    ];

    // Agregar las filas con los datos filtrados
    excelData.forEach((row) => worksheet.addRow(row));

    // Estilizar la fila de encabezado: negrilla, centrado, fondo morado claro y bordes
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0BBE4" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Aplicar bordes a todas las celdas de datos
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Escribir el archivo en un buffer y luego descargarlo
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "VouchersData.xlsx");
  };

  // Función generatePDF (usando el invoiceNumber obtenido del contador persistente)
  const generatePDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const marginLeft = 10;
    const marginTop = 10;
    const totalPagesExp = "{total_pages_count_string}";

    // Convertir la imagen del logo a base64 y agregarla
    const logoBase64 = await getBase64ImageFromUrl(logotipo);
    const logoWidth = 35;
    const logoHeight = 35;
    pdf.addImage(
      logoBase64,
      "JPEG",
      marginLeft,
      marginTop,
      logoWidth,
      logoHeight
    );

    const invoiceData = homepageDataSorted.map(([id, item]) => item);

    const selectedInvoice = filter.invoice
      ? filter.invoice
      : invoiceData.length > 0
      ? invoiceData[0].invoice
      : invoiceNumber;

    const tableRows = invoiceData.map((item) => [
      item.numerodevoucher,
      item.hotel,
      item.clientedereferencia,
      item.tipodetour,
      item.numerodepasajeros,
      `$${Number(item.valordetour).toFixed(2)}`,
      `$${Number(item.total).toFixed(2)}`,
    ]);

    // Encabezado a la derecha del logo
    pdf.setFontSize(20);
    pdf.text("Cross Aruba Tours", marginLeft + logoWidth + 5, marginTop + 15);
    pdf.setFontSize(12);
    pdf.text("Pavia Park 103", marginLeft + logoWidth + 5, marginTop + 25);
    pdf.text("6999690", marginLeft + logoWidth + 5, marginTop + 35);

    pdf.text(`${selectedInvoice}`, 140, marginTop + 10);
    pdf.text(`DATE: ${new Date().toLocaleDateString()}`, 140, marginTop + 20);
    pdf.text("DUE: On Receipt", 140, marginTop + 30);
    pdf.text(
      `BALANCE DUE: USD ${totalBalanceDue.toFixed(2)}`,
      140,
      marginTop + 40
    );

    pdf.text("BILL TO: DASC", marginLeft, marginTop + 50);

    // Preparar datos para la tabla
    const tableColumn = [
      "VOUCHER",
      "HOTEL",
      "CUSTOMER REF",
      "TOUR TYPE",
      "QTY",
      "PRICE",
      "AMOUNT",
    ];

    pdf.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: marginTop + 60,
      theme: "grid",
      headStyles: { fillColor: [106, 27, 154] },
      styles: { fontSize: 10 },
      margin: { left: marginLeft, right: marginLeft, bottom: 70 },
      didDrawPage: function (data) {
        const pageNumber = pdf.internal.getCurrentPageInfo().pageNumber;
        const headerStr = "Page " + pageNumber + " of " + totalPagesExp;
        pdf.setFontSize(10);
        const headerX = pdf.internal.pageSize.getWidth() - 26;
        pdf.text(headerStr, headerX, 7, { align: "right" });

        const pageHeight = pdf.internal.pageSize.getHeight();
        const footerY = pageHeight - 60;
        pdf.setFontSize(10);
        pdf.text("Payment Info:", marginLeft, footerY);
        pdf.text("CMB# 64481806", marginLeft, footerY + 5);
        pdf.text("Cross Aruba Tours", marginLeft, footerY + 10);
        pdf.text("Pavia Park 103", marginLeft, footerY + 15);
        pdf.text(
          `TOTAL: USD ${totalBalanceDue.toFixed(2)}`,
          pdf.internal.pageSize.getWidth() - 60,
          footerY
        );
        pdf.text(
          `BALANCE DUE: USD ${totalBalanceDue.toFixed(2)}`,
          pdf.internal.pageSize.getWidth() - 60,
          footerY + 5
        );
        pdf.text(
          "Thank you for doing business",
          pdf.internal.pageSize.getWidth() / 2,
          footerY + 20,
          { align: "center" }
        );

        const originalMarginPx = 8;
        const increasedMarginPx = originalMarginPx * 1.6;
        const marginTopMm = increasedMarginPx * 0.264583;
        const finalY = data.cursor.y + marginTopMm;

        pdf.setLineWidth(0.5);
        pdf.setDrawColor(0, 0, 0);
        pdf.line(
          marginLeft,
          finalY,
          pdf.internal.pageSize.getWidth() - marginLeft,
          finalY
        );
      },
    });

    pdf.putTotalPages(totalPagesExp);
    pdf.save(`${selectedInvoice || "Factura"}.pdf`);
  };

  const totalBalanceDue = homepageDataSorted.reduce(
    (acc, [id, item]) => acc + (Number(item.total) || 0),
    0
  );

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
        <h1 className="title-page">Historial De Tours "DASC"</h1>
        <div className="current-date">
          <div>{currentDateTime.date}</div>
          <div>{currentDateTime.time}</div>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div className="filters">
            <div className="datepicker-container">
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowDatePicker((prev) => !prev)}
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
                      .filter((invoice) =>
                        invoice
                          ?.toLowerCase()
                          .includes(filter.invoice.toLowerCase() || "")
                      )
                  )
                ).map((invoice, index) => (
                  <option key={index} value={invoice}>
                    {invoice}
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

            <button className="create-facture-button" onClick={generateExcel}>
              Generar Excel
            </button>

            <button className="create-facture-button" onClick={generatePDF}>
              Generar Factura en PDF
            </button>
          </div>
        </div>

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
                          update(ref(database, `historialdasc/${id}`), {
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
                          update(ref(database, `historialdasc/${id}`), {
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
                          update(ref(database, `historialdasc/${id}`), {
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
                          update(ref(database, `historialdasc/${id}`), {
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
                          update(ref(database, `historialdasc/${id}`), {
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
                            update(ref(database, `historialdasc/${id}`), {
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
                          update(ref(database, `historialdasc/${id}`), {
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
                            update(ref(database, `historialdasc/${id}`), {
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
                          update(ref(database, `historialdasc/${id}`), {
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
                          await update(ref(database, `historialdasc/${id}`), {
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
                          update(ref(database, `historialdasc/${id}`), {
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
                                `historialdasc/${id}`
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
      {/* Monta el componente FacturaInvoice en un contenedor oculto */}
      <div style={{ position: "absolute", top: "-10000px", left: "-10000px" }}>
        <FacturaInvoice
          data={homepageDataSorted.map(([id, item]) => item)}
          totalBalanceDue={totalBalanceDue}
          invoiceNumber={invoiceNumber}
        />
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

export default Historialfacturasemitidas;
