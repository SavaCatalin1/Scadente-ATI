// src/components/AddInvoiceModal.js
import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import "../styles/AddInvoice.css";

function AddInvoice({ isOpen, closeModal, fetchInvoices, fetchInvoicesHome }) {
  const [supplier, setSupplier] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [totalSum, setTotalSum] = useState(0);
  const [issueDate, setIssueDate] = useState(new Date());
  const [paymentDate, setPaymentDate] = useState(new Date());

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "invoices"), {
        supplier,
        invoiceNo,
        totalSum,
        issueDate: moment(issueDate).format("DD-MM-YYYY"),
        paymentDate: moment(paymentDate).format("DD-MM-YYYY"),
        paid: false,
      });
      closeModal();
      fetchInvoices();
      fetchInvoicesHome();
    } catch (error) {
      console.error("Error adding invoice:", error);
    }
  };

  if (!isOpen) return null; // Don't render the modal if it's not open

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Adauga factura noua</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <label className="modal-label">Furnizor</label>
          <input
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            required
            className="modal-input"
          />

          <label className="modal-label">Nr. factura</label>
          <input
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
            required
            className="modal-input"
          />

          <label className="modal-label">Total</label>
          <input
            type="number"
            value={totalSum}
            onChange={(e) => setTotalSum(e.target.value)}
            required
            className="modal-input"
          />

          <label className="modal-label">Data emitere</label>
          <DatePicker
            selected={issueDate}
            onChange={setIssueDate}
            className="modal-datepicker"
          />

          <label className="modal-label">Data scadenta</label>
          <DatePicker
            selected={paymentDate}
            onChange={setPaymentDate}
            className="modal-datepicker"
          />

          <button type="submit" className="modal-submit">
            Adauga factura
          </button>
        </form>
        <button className="modal-close" onClick={closeModal}>
          Inchide
        </button>
      </div>
    </div>
  );
}

export default AddInvoice;
