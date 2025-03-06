import React, { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import "../styles/Prediction.css";
import InvoiceItem from "./InvoiceItem";

function Prediction({ projects, invoices, suppliers, loading }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [predictedInvoices, setPredictedInvoices] = useState([]);
  const [totalSum, setTotalSum] = useState(0);

  // Fetch invoices up to the selected date and link with project names
  const fetchPredictedInvoices = () => {
    if (!selectedDate) return;

    const selectedDateEndOfDay = moment(selectedDate).endOf("day").toDate();

    const filteredInvoices = invoices.filter((invoice) => {
      const paymentDate =
        invoice.paymentDate instanceof Date
          ? invoice.paymentDate
          : new Date(invoice.paymentDate);
      return (
        (moment(paymentDate).isBefore(moment(selectedDateEndOfDay), "day") ||
          moment(paymentDate).isSame(moment(selectedDateEndOfDay), "day")) &&
        !invoice.paid
      );
    });

    // For each invoice, add the corresponding projectName from the projects map.
    const projectArray = Object.entries(projects);
    const invoicesData = filteredInvoices.map((invoice) => {
      const projectName =
        projectArray.find(([id]) => id === invoice.project)?.[1] || "N/A";
      return { ...invoice, projectName };
    });

    // Sum up the totalSum of the filtered invoices.
    const sum = invoicesData.reduce(
      (acc, curr) => acc + Number(curr.totalSum),
      0
    );

    setPredictedInvoices(invoicesData);
    setTotalSum(sum);
  };

  return (
    <div className="page-content">
      <h2 className="page-title">Cheltuieli previzionate</h2>

      <div className="date-picker-container">
        <label>Selectati o data: </label>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="dd-MM-yyyy"
          className="date-picker"
        />
        <button className="fetch-button" onClick={fetchPredictedInvoices}>
          Prezice
        </button>
      </div>

      {predictedInvoices.length > 0 ? (
        <>
          <div>
            Total de plata la data de:{" "}
            <b>{moment(selectedDate).format("DD-MM-YYYY")}</b>:{" "}
            <i>{totalSum.toFixed(2)} LEI</i>
          </div>
          <ul className="invoice-list">
            {loading ? (
              <p>Loading suppliers...</p>
            ) : (
              predictedInvoices.map((invoice) => (
                <InvoiceItem
                  key={invoice.id}
                  invoice={invoice}
                  supplierName={suppliers[invoice.supplier] || "Unknown Supplier"}
                />
              ))
            )}
          </ul>
        </>
      ) : (
        <p>Nu sunt facturi scadente la data selectata.</p>
      )}
    </div>
  );
}

export default Prediction;
