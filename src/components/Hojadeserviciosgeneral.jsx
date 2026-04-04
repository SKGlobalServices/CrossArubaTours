import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "./firebaseConfig";
import LoadingScreen from "./LoadingScreen";
import usePageLoading from "./usePageLoading";
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
import jsPDF from "jspdf";
import "jspdf-autotable";
import "react-datepicker/dist/react-datepicker.css";
import DateFilterButton from "./DateFilterButton"; // Ajusta la ruta según corresponda

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

// Componente para mostrar la factura (FacturaInvoice)
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
            .sort((a, b) => {
              const voucherA = a.numerodevoucher
                ? Number(a.numerodevoucher)
                : 0;
              const voucherB = b.numerodevoucher
                ? Number(b.numerodevoucher)
                : 0;
              return voucherA - voucherB;
            })
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

// Componente principal: Hojadeserviciosgeneral
const Hojadeserviciosgeneral = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  // Estados para cada tabla
  const [dataDASC, setDataDASC] = useState([]);
  const [dataCROSS, setDataCROSS] = useState([]);

  // Estado para guardar los IDs de las filas seleccionadas
  const [selectedRows, setSelectedRows] = useState([]);

  // Otros estados
  const [clients, setClients] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [services, setServices] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invoiceCounter, setInvoiceCounter] = useState(null);
  const [dataLoading, onResolved] = usePageLoading(6);
  const sidebarRef = useRef(null);
  const [ampmFilter, setAmpmFilter] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState({
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
  });

  // Estado para el filtro de fechas
  const [filter, setFilter] = useState({
    fechaInicio: null,
    fechaFin: null,
  });

  const formatDollar = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  // Función para seleccionar o deseleccionar todas las filas (se usa el listado filtrado)
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = filteredData.map(([id]) => id);
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

  // Obtener el contador de factura desde Firebase
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
        ? setHotels(Object.values(snapshot.val()))
        : setHotels([]);
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

  // Ordenar los datos combinados por fecha (para la vista en pantalla)
  const homepageDataSorted = [...combinedData].sort((a, b) => {
    const dateA = a[1].fechadeltour;
    const dateB = b[1].fechadeltour;
    if (!dateA && !dateB) return 0;
    if (!dateA) return -1;
    if (!dateB) return 1;
    return new Date(dateB) - new Date(dateA);
  });

  // Filtrar datos: se resta 1 día a la fecha de inicio (para tomar datos de un día anterior)
  const filteredData = homepageDataSorted.filter(([id, item]) => {
    let include = true;

    // Filtro por fecha (si se establecen ambas fechas)
    if (filter.fechaInicio && filter.fechaFin) {
      const tourDate = new Date(item.fechadeltour);
      const startDate = new Date(filter.fechaInicio);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(filter.fechaFin);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      if (tourDate < startDate || tourDate > endDate) {
        include = false;
      }
    }

    // Filtro AM/PM (si se ha seleccionado alguno)
    if (ampmFilter) {
      // Se verifica que el campo "horario" exista y contenga el string del filtro
      if (!item.horario || !item.horario.toLowerCase().includes(ampmFilter)) {
        include = false;
      }
    }

    return include;
  });

  // Para factura y PDF se usan los registros filtrados
  const invoiceData = filteredData.map(([id, item]) => item);
  const totalBalanceDue = invoiceData.reduce(
    (acc, item) => acc + (Number(item.total) || 0),
    0
  );

  // Función generatePDF para Reporte Nacional Park
  const generatePDF = async () => {
    if (selectedRows.length === 0) {
      Swal.fire({
        title: "No hay datos seleccionados",
        text: "Por favor, seleccione al menos un registro para generar la factura.",
        icon: "warning",
        confirmButtonText: "Aceptar",
      });
      return;
    }
    // Filtrar solo los registros seleccionados del listado filtrado
    const selectedData = filteredData.filter(([id]) =>
      selectedRows.includes(id)
    );
    const invoiceDataSelected = selectedData.map(([id, item]) => item);
    // Filtrar registros cuyo 'tipodetour' comienza con "n" o "N"
    const filteredInvoiceData = invoiceDataSelected.filter(
      (item) =>
        item.tipodetour &&
        item.tipodetour.trim().charAt(0).toLowerCase() === "n"
    );
    if (filteredInvoiceData.length === 0) {
      Swal.fire({
        title: "Sin datos",
        text: "No hay registros con 'tipo de tour' que empiecen con 'n' o 'N'.",
        icon: "warning",
        confirmButtonText: "Aceptar",
      });
      return;
    }
    // Ordenar de menor a mayor según numeroruta
    const sortedInvoiceData = filteredInvoiceData.slice().sort((a, b) => {
      const hotelA = hotels.find((h) => h.nombre === a.hotel);
      const hotelB = hotels.find((h) => h.nombre === b.hotel);
      const rutaA = hotelA && hotelA.numeroruta ? Number(hotelA.numeroruta) : 0;
      const rutaB = hotelB && hotelB.numeroruta ? Number(hotelB.numeroruta) : 0;
      return rutaA - rutaB;
    });
    const pdf = new jsPDF("p", "mm", "a4");
    const marginLeft = 10;
    const marginTop = 10;
    const totalPagesExp = "{total_pages_count_string}";
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
    pdf.setFontSize(20);
    pdf.text("Cross Aruba Tours", marginLeft + logoWidth + 5, marginTop + 15);
    pdf.setFontSize(12);
    pdf.text("Pavia Park 103", marginLeft + logoWidth + 5, marginTop + 25);
    pdf.text("6999690", marginLeft + logoWidth + 5, marginTop + 35);
    pdf.text(`DATE: ${new Date().toLocaleDateString()}`, 140, marginTop + 15);
    pdf.text("REPORTE DE TOURS:", marginLeft, marginTop + 50);

    const tableColumn = [
      "Tour Date",
      "Time",
      "Company/Client",
      "Reference Client",
      "Address Or Hotel",
      "QTY",
      "Type Of Tour",
      "Note",
    ];

    const tableRows = sortedInvoiceData.map((item) => [
      item.fechadeltour,
      item.horario,
      item.empresaocliente,
      item.clientedereferencia,
      item.hotel,
      item.numerodepasajeros,
      item.tipodetour,
      item.nota,
    ]);

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
    pdf.save(`Reporte De Tours.pdf`);
  };

  // Función generatePDFFullIsland para Full Island
  const generatePDFFullIsland = async () => {
    if (selectedRows.length === 0) {
      Swal.fire({
        title: "No hay datos seleccionados",
        text: "Por favor, seleccione al menos un registro para generar la factura.",
        icon: "warning",
        confirmButtonText: "Aceptar",
      });
      return;
    }
    // Filtrar solo los registros seleccionados del listado filtrado
    const selectedData = filteredData.filter(([id]) =>
      selectedRows.includes(id)
    );
    const invoiceDataSelected = selectedData.map(([id, item]) => item);
    // Filtrar registros cuyo 'tipodetour' comienza con "f" o "F"
    const filteredInvoiceData = invoiceDataSelected.filter(
      (item) =>
        item.tipodetour &&
        item.tipodetour.trim().charAt(0).toLowerCase() === "f"
    );
    if (filteredInvoiceData.length === 0) {
      Swal.fire({
        title: "Sin datos",
        text: "No hay registros con 'tipo de tour' que empiecen con 'f' o 'F'.",
        icon: "warning",
        confirmButtonText: "Aceptar",
      });
      return;
    }
    // Ordenar de mayor a menor según numeroruta
    const sortedInvoiceData = filteredInvoiceData.slice().sort((a, b) => {
      const hotelA = hotels.find((h) => h.nombre === a.hotel);
      const hotelB = hotels.find((h) => h.nombre === b.hotel);
      const rutaA = hotelA && hotelA.numeroruta ? Number(hotelA.numeroruta) : 0;
      const rutaB = hotelB && hotelB.numeroruta ? Number(hotelB.numeroruta) : 0;
      return rutaB - rutaA;
    });
    const pdf = new jsPDF("p", "mm", "a4");
    const marginLeft = 10;
    const marginTop = 10;
    const totalPagesExp = "{total_pages_count_string}";
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
    pdf.setFontSize(20);
    pdf.text("Cross Aruba Tours", marginLeft + logoWidth + 5, marginTop + 15);
    pdf.setFontSize(12);
    pdf.text("Pavia Park 103", marginLeft + logoWidth + 5, marginTop + 25);
    pdf.text("6999690", marginLeft + logoWidth + 5, marginTop + 35);
    pdf.text(`DATE: ${new Date().toLocaleDateString()}`, 140, marginTop + 15);
    pdf.text("REPORTE DE TOURS:", marginLeft, marginTop + 50);

    const tableColumn = [
      "Tour Date",
      "Time",
      "Company/Client",
      "Reference Client",
      "Address Or Hotel",
      "QTY",
      "Type Of Tour",
      "Note",
    ];

    const tableRows = sortedInvoiceData.map((item) => [
      item.fechadeltour,
      item.horario,
      item.empresaocliente,
      item.clientedereferencia,
      item.hotel,
      item.numerodepasajeros,
      item.tipodetour,
      item.nota,
    ]);

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
    pdf.save(`Reporte De Tours.pdf`);
  };

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
        <h1 className="title-page">Agenda General</h1>
        <div className="current-date">
          <div>{currentDateTime.date}</div>
          <div>{currentDateTime.time}</div>
        </div>

        {/* Contenedor para filtros: botón de filtrar y botón para descartar */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div className="filters">
            <div className="datepicker-container">
              <DateFilterButton filter={filter} setFilter={setFilter} />
            </div>
            <button
              className={`filter-button ${ampmFilter === "am" ? "active" : ""}`}
              onClick={() => setAmpmFilter(ampmFilter === "am" ? "" : "am")}
            >
              AM
            </button>
            <button
              className={`filter-button ${ampmFilter === "pm" ? "active" : ""}`}
              onClick={() => setAmpmFilter(ampmFilter === "pm" ? "" : "pm")}
            >
              PM
            </button>
            <button
              className="discard-filter-button"
              onClick={() => {
                setFilter({ fechaInicio: null, fechaFin: null });
                setAmpmFilter("");
              }}
            >
              Descartar filtros
            </button>
            <button className="create-facture-button" onClick={generatePDF}>
              Generar Reporte Nacional Park
            </button>
            <button
              className="create-facture-button"
              onClick={generatePDFFullIsland}
            >
              Generar Reporte Full Island
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="service-table">
            <thead>
              <tr>
                <th className="box-fixed-th">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      filteredData.length > 0 &&
                      selectedRows.length === filteredData.length
                    }
                    style={{
                      width: "2.6ch",
                      height: "2.6ch",
                      padding: "0px",
                      margin: "0px",
                    }}
                  />
                </th>
                <th>Fecha del tour</th>
                <th>Horario</th>
                <th>Voucher</th>
                <th>Empresa/Cliente</th>
                <th>Cliente de referencia</th>
                <th>Address Or Hotel</th>
                <th
                  style={{
                    paddingLeft: "25px",
                    paddingRight: "25px",
                  }}
                >
                  PAX
                </th>
                <th>Tipo de tour</th>
                <th
                  style={{
                    paddingLeft: "50px",
                    paddingRight: "50px",
                  }}
                >
                  Nota
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData && filteredData.length > 0 ? (
                filteredData.map(([id, item]) => (
                  <tr key={id}>
                    <td className="box-fixed-td">
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
                        value={item.nota || ""}
                        onChange={(e) =>
                          update(getItemRef(id, item.source), {
                            nota: e.target.value,
                          })
                        }
                      />
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

      {/* Montar el componente FacturaInvoice en un contenedor oculto */}
      <div style={{ position: "absolute", top: "-10000px", left: "-10000px" }}>
        <FacturaInvoice
          data={invoiceData}
          totalBalanceDue={totalBalanceDue}
          invoiceNumber={invoiceNumber}
        />
      </div>

      {/* Estilos para el spinner */}
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

export default Hojadeserviciosgeneral;
