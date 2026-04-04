import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "./firebaseConfig";
import { ref, set, push, remove, update, onValue, get } from "firebase/database";
import Swal from "sweetalert2";
import logo from "../assets/img/logo.jpg";
import logotipo from "../assets/img/logotipo.jpg";
import jsPDF from "jspdf";
import "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import DateFilterButton from "./DateFilterButton";
import LoadingScreen from "./LoadingScreen";
import usePageLoading from "./usePageLoading";

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

const Hojadeservicios = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [data, setData] = useState([]);
  const [clients, setClients] = useState([]);
  const [hotels, setHoteles] = useState([]);
  const [services, setServices] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invoiceCounter, setInvoiceCounter] = useState(null);
  const [dataLoading, onResolved] = usePageLoading(5);
  const [selectedRows, setSelectedRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterVoucher, setFilterVoucher] = useState(false);
  const [filter, setFilter] = useState({
    fechaInicio: null,
    fechaFin: null,
  });
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

  const formatDollar = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

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

  // Actualizar fecha y hora cada segundo
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

  // Obtener datos de agendartoursdasc
  useEffect(() => {
    const dbRef = ref(database, "agendartoursdasc");
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const firebaseData = snapshot.val();
      firebaseData ? setData(Object.entries(firebaseData)) : setData([]);
      onResolved();
    });
    return () => unsubscribe();
  }, []);

  // Función para agregar datos a Agendar Tours DASC (se asigna por defecto realizado: false)
  const addData = async (
    fechadeltour,
    horario,
    numerodevoucher,
    empresaocliente,
    clientedereferencia,
    hotel,
    recepcionista,
    numerodepasajeros,
    tipodetour,
    valordetour,
    total
  ) => {
    const dbRef = ref(database, "agendartoursdasc");
    const newDataRef = push(dbRef);
    await set(newDataRef, {
      fechadeltour,
      horario,
      numerodevoucher,
      empresaocliente,
      clientedereferencia,
      hotel,
      recepcionista,
      numerodepasajeros,
      tipodetour,
      valordetour,
      total,
      realizado: false,
    }).catch((error) => {
      console.error("Error al agregar datos: ", error);
    });
  };

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

  // Obtener horarios
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

  // Funciones para seleccionar registros
  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedRows((prev) => [...prev, id]);
    } else {
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id));
    }
  };

  // "Select All" basado en los datos filtrados
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = filteredData.map(([id]) => id);
      setSelectedRows(allIds);
    } else {
      setSelectedRows([]);
    }
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

  // Ordenar los datos por fecha
  const homepageDataSorted = [...data].sort((a, b) => {
    const dateA = a[1].fechadeltour;
    const dateB = b[1].fechadeltour;
    if (!dateA && !dateB) return 0;
    if (!dateA) return -1;
    if (!dateB) return 1;
    return new Date(dateB) - new Date(dateA);
  });

  // Filtrar los datos combinando filtro de voucher, estado y fecha
  const filteredData = homepageDataSorted.filter(([id, item]) => {
    // Filtro de fecha
    if (filter.fechaInicio && filter.fechaFin) {
      const tourDate = new Date(item.fechadeltour);
      const startDate = new Date(filter.fechaInicio);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(filter.fechaFin);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      if (tourDate < startDate || tourDate > endDate) return false;
    }

    // Filtro por voucher
    const voucherMatch = filterVoucher
      ? !item.numerodevoucher || item.numerodevoucher.trim() === ""
      : true;

    // Filtrado según el estado:
    let statusMatch = true;
    if (statusFilter === "realizado") {
      statusMatch = item.realizado === true;
    } else if (statusFilter === "pendiente") {
      statusMatch = !item.realizado;
    }
    return voucherMatch && statusMatch;
  });

  const invoiceData = homepageDataSorted.map(([id, item]) => item);
  const totalBalanceDue = invoiceData.reduce(
    (acc, item) => acc + (Number(item.total) || 0),
    0
  );

  // Función para enviar datos a historial (solo registros seleccionados)
  const handleSendDataToHistory = async () => {
    if (selectedRows.length === 0) {
      Swal.fire({
        title: "Sin datos seleccionados",
        text: "Por favor seleccione al menos un registro para enviar a historial.",
        icon: "warning",
        confirmButtonText: "Aceptar",
      });
      return;
    }
    setLoading(true);
    const selectedData = homepageDataSorted.filter(([id]) =>
      selectedRows.includes(id)
    );
    try {
      for (const [id, item] of selectedData) {
        const { timestamp, ...itemWithoutTimestamp } = item;
        const fechadegeneracion = new Date().toLocaleDateString();
        const newHistorialDascRef = push(ref(database, "historialdasc"));
        await set(newHistorialDascRef, {
          ...itemWithoutTimestamp,
          invoice: invoiceNumber,
          fechadegeneracion,
        });
        const newHistorialDetoursRef = push(ref(database, "historialdetours"));
        await set(newHistorialDetoursRef, {
          ...itemWithoutTimestamp,
          invoice: invoiceNumber,
          fechadegeneracion,
        });
      }
      for (const [id] of selectedData) {
        await remove(ref(database, `agendartoursdasc/${id}`));
      }
      const invoiceCounterRef = ref(database, "invoiceCounter");
      await set(invoiceCounterRef, invoiceCounter + 1);
      setInvoiceCounter(invoiceCounter + 1);
      Swal.fire({
        title: "Éxito",
        text: "Los datos seleccionados se han enviado a Historial de Facturas",
        icon: "success",
        confirmButtonText: "Aceptar",
      });
      setSelectedRows([]);
    } catch (error) {
      console.error("Error enviando datos: ", error);
      Swal.fire({
        title: "Error",
        text: "No se pudieron enviar los datos a historial.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
    }
    setLoading(false);
  };

  // Función generatePDF (solo para registros seleccionados)
  const generatePDF = async () => {
    if (selectedRows.length === 0) {
      Swal.fire({
        title: "No hay registros seleccionados",
        text: "Seleccione al menos un registro para generar la factura.",
        icon: "warning",
        confirmButtonText: "Aceptar",
      });
      return;
    }
    const selectedInvoiceData = homepageDataSorted
      .filter(([id]) => selectedRows.includes(id))
      .map(([, item]) => item);
    const totalBalanceDueSelected = selectedInvoiceData.reduce(
      (acc, item) => acc + (Number(item.total) || 0),
      0
    );
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
    pdf.text(`INVOICE: ${invoiceNumber}`, 140, marginTop + 10);
    pdf.text(`DATE: ${new Date().toLocaleDateString()}`, 140, marginTop + 20);
    pdf.text("DUE: On Receipt", 140, marginTop + 30);
    pdf.text(
      `BALANCE DUE: USD ${totalBalanceDueSelected.toFixed(2)}`,
      140,
      marginTop + 40
    );
    pdf.text("BILL TO: DASC", marginLeft, marginTop + 50);
    const tableColumn = [
      "VOUCHER",
      "ADDRESS OR HOTEL",
      "CUSTOMER REF",
      "TOUR TYPE",
      "QTY",
      "PRICE",
      "AMOUNT",
    ];
    const sortedInvoiceData = selectedInvoiceData.slice().sort((a, b) => {
      const voucherA = a.numerodevoucher ? a.numerodevoucher.trim() : "";
      const voucherB = b.numerodevoucher ? b.numerodevoucher.trim() : "";
      if (!voucherA && !voucherB) return 0;
      if (!voucherA) return -1;
      if (!voucherB) return 1;
      const [prefixA, suffixA] = voucherA.split("-");
      const [prefixB, suffixB] = voucherB.split("-");
      const numA = parseInt(prefixA, 10);
      const numB = parseInt(prefixB, 10);
      if (numA !== numB) {
        return numA - numB;
      }
      return parseInt(suffixA, 10) - parseInt(suffixB, 10);
    });
    const tableRows = sortedInvoiceData.map((item) => [
      item.numerodevoucher,
      item.hotel,
      item.clientedereferencia,
      item.tipodetour,
      item.numerodepasajeros,
      `$${Number(item.valordetour).toFixed(2)}`,
      `$${Number(item.total).toFixed(2)}`,
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
        const headerX = pdf.internal.pageSize.getWidth() - 60;
        pdf.text(headerStr, headerX, 7, { align: "right" });
        const pageHeight = pdf.internal.pageSize.getHeight();
        const footerY = pageHeight - 60;
        pdf.setFontSize(10);
        pdf.text("Payment Info:", marginLeft, footerY);
        pdf.text("CMB# 64481806", marginLeft, footerY + 5);
        pdf.text("Cross Aruba Tours", marginLeft, footerY + 10);
        pdf.text("Pavia Park 103", marginLeft, footerY + 15);
        pdf.text(
          `TOTAL: USD ${totalBalanceDueSelected.toFixed(2)}`,
          pdf.internal.pageSize.getWidth() - 60,
          footerY
        );
        pdf.text(
          `BALANCE DUE: USD ${totalBalanceDueSelected.toFixed(2)}`,
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
    pdf.save(`Invoice-${invoiceNumber}.pdf`);
  };

  // Función para generar factura solo para vouchers sin datos y con "R or P" verificado
  const generatePDFVoucherSinDatos = async () => {
    const voucherSinDatos = homepageDataSorted
      .filter(([id, item]) => {
        const voucher = item.numerodevoucher ? item.numerodevoucher.trim() : "";
        return voucher === "" && item.realizado === true;
      })
      .map(([, item]) => item);

    if (voucherSinDatos.length === 0) {
      Swal.fire({
        title: "Sin registros",
        text: "No se encontraron vouchers sin datos con 'R or P' verificado.",
        icon: "warning",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    const totalBalanceDueVoucher = voucherSinDatos.reduce(
      (acc, item) => acc + (Number(item.total) || 0),
      0
    );

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
    pdf.text(`INVOICE: ${invoiceNumber}`, 140, marginTop + 10);
    pdf.text(`DATE: ${new Date().toLocaleDateString()}`, 140, marginTop + 20);
    pdf.text("DUE: On Receipt", 140, marginTop + 30);
    pdf.text(
      `BALANCE DUE: USD ${totalBalanceDueVoucher.toFixed(2)}`,
      140,
      marginTop + 40
    );
    pdf.text("BILL TO: DASC", marginLeft, marginTop + 50);

    const tableColumn = [
      "VOUCHER",
      "ADDRESS OR HOTEL",
      "CUSTOMER REF",
      "TOUR TYPE",
      "QTY",
      "PRICE",
      "AMOUNT",
    ];
    const tableRows = voucherSinDatos.map((item) => [
      item.numerodevoucher,
      item.hotel,
      item.clientedereferencia,
      item.tipodetour,
      item.numerodepasajeros,
      `$${Number(item.valordetour).toFixed(2)}`,
      `$${Number(item.total).toFixed(2)}`,
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
        const headerX = pdf.internal.pageSize.getWidth() - 60;
        pdf.text(headerStr, headerX, 7, { align: "right" });
        const pageHeight = pdf.internal.pageSize.getHeight();
        const footerY = pageHeight - 60;
        pdf.setFontSize(10);
        pdf.text("Payment Info:", marginLeft, footerY);
        pdf.text("CMB# 64481806", marginLeft, footerY + 5);
        pdf.text("Cross Aruba Tours", marginLeft, footerY + 10);
        pdf.text("Pavia Park 103", marginLeft, footerY + 15);
        pdf.text(
          `TOTAL: USD ${totalBalanceDueVoucher.toFixed(2)}`,
          pdf.internal.pageSize.getWidth() - 60,
          footerY
        );
        pdf.text(
          `BALANCE DUE: USD ${totalBalanceDueVoucher.toFixed(2)}`,
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
    pdf.save(`Invoice-${invoiceNumber}-VoucherSinDatos.pdf`);
  };

  // Función para generar archivo Excel solo con los datos que tengan contenido en voucher usando exceljs
  const generateExcel = async () => {
    // Filtrar los datos mostrados en la tabla que tengan contenido en voucher
    const dataForExcel = filteredData
      .filter(([id, item]) => item.numerodevoucher && item.numerodevoucher.trim() !== "")
      .map(([, item]) => ({
        Voucher: item.numerodevoucher,
        Hotel: item.hotel,
        "Customer Ref": item.clientedereferencia,
        "Tour Type": item.tipodetour,
        Qty: item.numerodepasajeros,
        Price: Number(item.valordetour).toFixed(2),
        Amount: Number(item.total).toFixed(2),
      }));
  
    // Ordenar los datos por el campo Voucher de forma ascendente
    dataForExcel.sort((a, b) =>
      a.Voucher.localeCompare(b.Voucher, undefined, { numeric: true })
    );
  
    if (dataForExcel.length === 0) {
      Swal.fire({
        title: "Sin datos",
        text: "No se encontraron registros con contenido en voucher en la tabla.",
        icon: "warning",
        confirmButtonText: "Aceptar",
      });
      return;
    }
  
    // Crear un nuevo workbook y worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Vouchers");
  
    // Definir las columnas con encabezados
    worksheet.columns = [
      { header: "Voucher", key: "Voucher", width: 20 },
      { header: "Hotel", key: "Hotel", width: 30 },
      { header: "Customer Ref", key: "Customer Ref", width: 20 },
      { header: "Tour Type", key: "Tour Type", width: 20 },
      { header: "Qty", key: "Qty", width: 10 },
      { header: "Price", key: "Price", width: 15 },
      { header: "Amount", key: "Amount", width: 15 },
    ];
  
    // Agregar las filas con los datos filtrados y ordenados
    dataForExcel.forEach((item) => {
      worksheet.addRow(item);
    });
  
    // Estilizar la fila de encabezados: negrilla, centrado, fondo morado claro y bordes
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFADD8E6" }
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    });
  
    // Opcional: aplicar bordes a todas las celdas de datos
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      });
    });
  
    // Escribir el archivo en un buffer y luego descargarlo
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "VouchersData.xlsx");
  };
   

  // Modal para agregar nuevo tour (con cálculo inmediato)
  const handleAddNewTour = async () => {
    const horariosOptionsHtml = horarios
      .map(
        (h) => `
          <option value="${h.horarioam}">${h.horarioam}</option>
          <option value="${h.horariopm}">${h.horariopm}</option>`
      )
      .join("");
    const clientsOptionsHtml = [
      ...new Set(clients.map((c) => c.cliente).filter(Boolean)),
    ]
      .map((cliente) => `<option value="${cliente}">${cliente}</option>`)
      .join("");
    const hotelsOptionsHtml = hotels
      .map(
        (hotel) => `<option value="${hotel.nombre}">${hotel.nombre}</option>`
      )
      .join("");
    const servicesOptionsHtml = services
      .map(
        (servicio) =>
          `<option value="${servicio.nombre}">${servicio.nombre}</option>`
      )
      .join("");

    const { value: formValues } = await Swal.fire({
      title: "Agregar Nuevo Tour",
      html: `
          <style>
            .swal2-input { width: 400px !important; }
          </style>
          <div style="display: flex; flex-direction: column; align-items: center;">
            <input id="swal-input1" type="date" class="swal2-input" placeholder="Fecha del tour">
            <input id="swal-input2" type="text" class="swal2-input" placeholder="Horario" list="horario-options-modal">
            <datalist id="horario-options-modal">${horariosOptionsHtml}</datalist>
            <input id="swal-input3" type="text" class="swal2-input" placeholder="Número de voucher">
            <input id="swal-input4" type="text" class="swal2-input" placeholder="Empresa/Cliente" list="clients-options-modal">
            <datalist id="clients-options-modal">${clientsOptionsHtml}</datalist>
            <input id="swal-input5" type="text" class="swal2-input" placeholder="Cliente de referencia">
            <input id="swal-input6" type="text" class="swal2-input" placeholder="Hotel/Address" list="hotels-options-modal">
            <datalist id="hotels-options-modal">${hotelsOptionsHtml}</datalist>
            <input id="swal-input7" type="text" class="swal2-input" placeholder="Recepcionista">
            <input id="swal-input8" type="number" class="swal2-input" placeholder="Número de pasajeros">
            <select id="swal-input9" class="swal2-input">
              <option value="">Seleccione tipo de tour</option>
              ${servicesOptionsHtml}
            </select>
          </div>
        `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Agregar Tour",
      preConfirm: () => {
        const fechadeltour = document.getElementById("swal-input1").value;
        if (!fechadeltour) {
          Swal.showValidationMessage("La fecha del tour es obligatoria.");
          return;
        }
        const horario = document.getElementById("swal-input2").value;
        const numerodevoucher = document.getElementById("swal-input3").value;
        const empresaocliente = document.getElementById("swal-input4").value;
        const clientedereferencia = document.getElementById("swal-input5").value;
        const hotel = document.getElementById("swal-input6").value;
        const recepcionista = document.getElementById("swal-input7").value;
        const numerodepasajeros = Number(document.getElementById("swal-input8").value);
        const tipodetour = document.getElementById("swal-input9").value;

        let valor = 0;
        if (tipodetour) {
          const service = services.find(
            (servicio) =>
              servicio.nombre.trim().toLowerCase() ===
              tipodetour.trim().toLowerCase()
          );
          if (service) {
            valor = parseFloat(service.valor);
          }
        }
        const valorFormateado = parseFloat(valor.toFixed(2));
        const total = parseFloat((numerodepasajeros * valorFormateado).toFixed(2));

        return {
          fechadeltour,
          horario,
          numerodevoucher,
          empresaocliente,
          clientedereferencia,
          hotel,
          recepcionista,
          numerodepasajeros,
          tipodetour,
          valordetour: valorFormateado,
          total,
        };
      },
    });

    if (formValues) {
      await addData(
        formValues.fechadeltour,
        formValues.horario,
        formValues.numerodevoucher,
        formValues.empresaocliente,
        formValues.clientedereferencia,
        formValues.hotel,
        formValues.recepcionista,
        formValues.numerodepasajeros,
        formValues.tipodetour,
        formValues.valordetour,
        formValues.total
      );
      Swal.fire(
        "Tour agregado",
        "El tour se ha agregado correctamente.",
        "success"
      );
    }
  };

  useEffect(() => {
    const idsConVoucher = homepageDataSorted.reduce((acc, [id, item]) => {
      if (item.numerodevoucher && item.numerodevoucher.trim() !== "") {
        acc.push(id);
      }
      return acc;
    }, []);
    setSelectedRows((prevSelected) =>
      Array.from(new Set([...prevSelected, ...idsConVoucher]))
    );
  }, [homepageDataSorted]);

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
        <div>
          {user && user.name ? <p>Hola!, {user.name}</p> : <p>No user</p>}
        </div>
        <div>
          <h1>
            <img src={logo} alt="Logo" id="logologin" className="logo-slidebar" />
          </h1>
        </div>
        <p>REPORTE GENERAL</p>
        <button className="menu-item" onClick={() => navigate("/agendageneral")}>
          Tours Activos Agendados
        </button>
        <p>AGENDAR</p>
        <button className="menu-item" onClick={() => navigate("/agendarserviciosdasc")}>
          Agendar Tours DASC
        </button>
        <button className="menu-item" onClick={() => navigate("/agendarservicioscross")}>
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
        <button className="menu-item" onClick={() => navigate("/configuracionservicios")}>
          Configuracion De Servicios
        </button>
        <button className="menu-item" onClick={() => navigate("/configuracionhoteles")}>
          Configuracion De Hoteles
        </button>
        <button className="menu-item" onClick={() => navigate("/configuracionclientes")}>
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
        <h1 className="title-page">Agendar Tours "DASC"</h1>
        <div className="current-date">
          <div>{currentDateTime.date}</div>
          <div>{currentDateTime.time}</div>
        </div>
        <div className="filters">
          <button className="create-table-button" onClick={handleAddNewTour}>
            Agendar Nuevo Tour
          </button>
          <div className="datepicker-container" style={{ display: "inline-block", margin: "0 0.5rem" }}>
            <DateFilterButton filter={filter} setFilter={setFilter} />
          </div>
          <button className={`filter-button ${filterVoucher ? "active" : ""}`} onClick={() => setFilterVoucher(!filterVoucher)}>
            Filtrar Sin Voucher
          </button>
          <button className={`filter-button ${statusFilter === "realizado" ? "active" : ""}`} onClick={() => setStatusFilter(statusFilter === "realizado" ? "all" : "realizado")}>
            Realizado
          </button>
          <button className={`filter-button ${statusFilter === "pendiente" ? "active" : ""}`} onClick={() => setStatusFilter(statusFilter === "pendiente" ? "all" : "pendiente")}>
            Pendiente O Cancelado
          </button>
          <button className="discard-filter-button" onClick={() => {
              setFilter({ fechaInicio: null, fechaFin: null });
              setFilterVoucher(false);
              setStatusFilter("all");
            }}>
            Descartar Filtros
          </button>
          <button className="create-facture-button" onClick={generateExcel}>
            Generar Excel
          </button>
          <button className="create-facture-button" onClick={generatePDF}>
            Generar Factura en PDF
          </button>
          <button className="create-facture-button" onClick={generatePDFVoucherSinDatos}>
            Generar Factura Sin Voucher
          </button>
          <button className="create-facture-button" onClick={handleSendDataToHistory}>
            Enviar Datos A Historial De Facturas
          </button>
        </div>
        <div className="table-container">
          <table className="service-table">
            <thead>
              <tr>
                <th className="box-fixed-th">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={filteredData.length > 0 && selectedRows.length === filteredData.length}
                    style={{ width: "2.6ch", height: "2.6ch", padding: "0px", margin: "0px" }}
                  />
                </th>
                <th>Fecha del tour</th>
                <th>Horario</th>
                <th>Voucher</th>
                <th>R Or P</th>
                <th>Empresa/Cliente</th>
                <th>Cliente de referencia</th>
                <th>Address Or Hotel</th>
                <th>Recepcionista</th>
                <th style={{ paddingLeft: "25px", paddingRight: "25px" }}>PAX</th>
                <th>Tipo de tour</th>
                <th>Valor del tour</th>
                <th style={{ width: "2.6ch", height: "2.6ch", paddingLeft: "20px", paddingRight: "20px" }}>Total</th>
                <th>Acción</th>
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
                        disabled={item.numerodevoucher && item.numerodevoucher.trim() !== ""}
                        onChange={(e) => {
                          if (item.numerodevoucher && item.numerodevoucher.trim() !== "") return;
                          handleSelectRow(id, e.target.checked);
                        }}
                        style={{ width: "3ch", height: "3ch", marginLeft: "0" }}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={item.fechadeltour || ""}
                        onChange={(e) =>
                          update(ref(database, `agendartoursdasc/${id}`), { fechadeltour: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <div className="custom-select-container">
                        <input
                          type="text"
                          value={item.horario || ""}
                          onChange={(e) =>
                            update(ref(database, `agendartoursdasc/${id}`), { horario: e.target.value })
                          }
                          onFocus={(e) => e.target.setAttribute("list", `horario-options-${id}`)}
                          onBlur={(e) =>
                            setTimeout(() => e.target.removeAttribute("list"), 200)
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
                          update(ref(database, `agendartoursdasc/${id}`), { numerodevoucher: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        className="checkbox-rp"
                        checked={item.realizado || false}
                        onChange={(e) =>
                          update(ref(database, `agendartoursdasc/${id}`), { realizado: e.target.checked })
                        }
                        style={{ width: "16px", height: "16px", marginLeft: "0" }}
                      />
                    </td>
                    <td>
                      <div className="custom-select-container">
                        <input
                          type="text"
                          value={item.empresaocliente || ""}
                          onChange={(e) =>
                            update(ref(database, `agendartoursdasc/${id}`), { empresaocliente: e.target.value })
                          }
                          onFocus={(e) => e.target.setAttribute("list", `empresa-options-${id}`)}
                          onBlur={(e) =>
                            setTimeout(() => e.target.removeAttribute("list"), 200)
                          }
                          className="custom-select-input"
                        />
                        <datalist id={`empresa-options-${id}`}>
                          {[...new Set(clients.map((client) => client.cliente).filter(Boolean))].map((cliente, index) => (
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
                          update(ref(database, `agendartoursdasc/${id}`), { clientedereferencia: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <div className="custom-select-container">
                        <input
                          type="text"
                          value={item.hotel || ""}
                          onChange={(e) =>
                            update(ref(database, `agendartoursdasc/${id}`), { hotel: e.target.value })
                          }
                          onFocus={(e) =>
                            e.target.setAttribute("list", `hotel-options-${id}`)
                          }
                          onBlur={(e) =>
                            setTimeout(() => e.target.removeAttribute("list"), 200)
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
                          update(ref(database, `agendartoursdasc/${id}`), { recepcionista: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.numerodepasajeros || 0}
                        onChange={async (e) => {
                          const pasajeros = parseInt(e.target.value, 10) || 0;
                          const total = parseFloat((pasajeros * (item.valordetour || 0)).toFixed(2));
                          await update(ref(database, `agendartoursdasc/${id}`), { numerodepasajeros: pasajeros, total });
                          if (pasajeros > 0 && item.empresaocliente) {
                            const clienteNombre = item.empresaocliente;
                            const clientesRef = ref(database, "clientes");
                            const snapshotClientes = await new Promise((resolve) =>
                              onValue(clientesRef, (snap) => resolve(snap), { onlyOnce: true })
                            );
                            const clienteExiste = snapshotClientes.exists()
                              ? Object.values(snapshotClientes.val()).some((cliente) => cliente.cliente === clienteNombre)
                              : false;
                            if (!clienteExiste) {
                              const newClientRef = push(clientesRef);
                              await set(newClientRef, {
                                cliente: clienteNombre,
                                clientedereferencia: item.clientedereferencia || "Sin referencia",
                                fechadeltour: item.fechadeltour || "Fecha no registrada",
                                tipodetour: item.tipodetour || "Sin tour asignado",
                              }).catch((error) => {
                                console.error("Error al agregar cliente: ", error);
                              });
                            }
                          }
                          if (item.hotel) {
                            const hotelNombre = item.hotel;
                            const hotelesRef = ref(database, "hoteles");
                            const snapshotHoteles = await new Promise((resolve) =>
                              onValue(hotelesRef, (snap) => resolve(snap), { onlyOnce: true })
                            );
                            const hotelExiste = snapshotHoteles.exists()
                              ? Object.values(snapshotHoteles.val()).some((hotel) => hotel.nombre === hotelNombre)
                              : false;
                            if (!hotelExiste) {
                              const newHotelRef = push(hotelesRef);
                              await set(newHotelRef, {
                                nombre: hotelNombre,
                                ubicacion: item.ubicacion || "Ubicación no especificada",
                              }).catch((error) => {
                                console.error("Error al agregar hotel: ", error);
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
                          const total = parseFloat(((item.numerodepasajeros || 0) * valorFormateado).toFixed(2));
                          update(ref(database, `agendartoursdasc/${id}`), {
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
                      <input type="text" value={formatDollar(Number(item.valordetour || 0))} readOnly />
                    </td>
                    <td>
                      <input type="text" value={formatDollar(Number(item.total || 0))} readOnly />
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
                              remove(ref(database, `agendartoursdasc/${id}`))
                                .then(() => {
                                  Swal.fire({
                                    title: "¡Borrado!",
                                    text: "El servicio ha sido eliminado.",
                                    icon: "success",
                                    timer: 2000,
                                    showConfirmButton: false,
                                  });
                                })
                                .catch((error) => {
                                  Swal.fire({
                                    title: "Error",
                                    text: "No se pudo eliminar el servicio.",
                                    icon: "error",
                                    timer: 2000,
                                    showConfirmButton: false,
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
                  <td colSpan="12">No hay datos disponibles</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Componente FacturaInvoice oculto para generación de PDF */}
      <div style={{ position: "absolute", top: "-10000px", left: "-10000px" }}>
        <FacturaInvoice
          data={homepageDataSorted.filter(([id]) => selectedRows.includes(id)).map(([, item]) => item)}
          totalBalanceDue={homepageDataSorted
            .filter(([id]) => selectedRows.includes(id))
            .reduce((acc, [, item]) => acc + (Number(item.total) || 0), 0)}
          invoiceNumber={invoiceNumber}
        />
      </div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .checkbox-rp:checked {
            accent-color: green;
          }
          .filter-button {
            margin: 0 0.5rem;
            padding: 0.5rem 1rem;
            background-color: #6a1b9a;
            border: none;
            cursor: pointer;
          }
          .filter-button.active {
            background-color: rgb(185, 73, 255);
            color: #fff;
          }
          .discard-filter-button {
            margin: 0 0.5rem;
            padding: 0.5rem 1rem;
            border: none;
            cursor: pointer;
          }
        `}
      </style>
    </div>
  );
};

export default Hojadeservicios;
