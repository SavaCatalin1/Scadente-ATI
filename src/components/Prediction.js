// src/components/Prediction.js
import React, { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import "../styles/Prediction.css";

function Prediction() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [predictedInvoices, setPredictedInvoices] = useState([]);
  const [totalSum, setTotalSum] = useState(0);

  const fetchPredictedInvoices = async () => {
    if (!selectedDate) return;

    // Convert the selected date to the end of the day
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

      invoicesSnapshot.forEach((doc) => {
        const invoice = { id: doc.id, ...doc.data() };
        invoicesData.push(invoice);
        sum += Number(invoice.totalSum); // Sum up the totalSum of each invoice
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
            {predictedInvoices.map((invoice) => (
              <li className="invoice-item" key={invoice.id}>
                <div>
                  <b>Furnizor:</b> {invoice.supplier}
                </div>
                <div>
                  <b>Nr. factura:</b> {invoice.invoiceNo}
                </div>
                <div>
                  <b>Data emitere:</b>{" "}
                  {moment(invoice.issueDate.toDate()).format("DD-MM-YYYY")}
                </div>
                <div>
                  <b>Data scadenta:</b>{" "}
                  {moment(invoice.paymentDate.toDate()).format("DD-MM-YYYY")}
                </div>
                <div>
                  <b>Total:</b> {Number(invoice.totalSum).toFixed(2)} LEI
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>Nu sunt facturi scadente la data selectata.</p>
      )}
    </div>
  );
}

export default Prediction;
