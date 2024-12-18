import React, { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import "../styles/Prediction.css";
import InvoiceItem from "./InvoiceItem";

function Prediction({ projects, suppliers, loading }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [predictedInvoices, setPredictedInvoices] = useState([]);
  const [totalSum, setTotalSum] = useState(0);

  // Fetch invoices up to the selected date and link with project names
  const fetchPredictedInvoices = async () => {
    if (!selectedDate) return;

    const selectedDateEndOfDay = moment(selectedDate).endOf("day").toDate();

    const invoicesQuery = query(
      collection(db, "invoices"),
      where("paymentDate", "<=", selectedDateEndOfDay),
      where("paid", "==", false)
    );

    try {
      const invoicesSnapshot = await getDocs(invoicesQuery);
      const invoicesData = [];
      let sum = 0;

      // Convert projects to an array of [id, name] pairs for easy lookup
      const projectArray = Object.entries(projects);

      invoicesSnapshot.forEach((doc) => {
        const invoice = { id: doc.id, ...doc.data() };
        // Find the project name by id
        const projectName = projectArray.find(([id]) => id === invoice.project)?.[1] || "N/A";
        invoicesData.push({ ...invoice, projectName });
        sum += Number(invoice.totalSum);
      });

      setPredictedInvoices(invoicesData);
      setTotalSum(sum);
    } catch (error) {
      console.error("Error fetching predicted invoices:", error);
    }
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
