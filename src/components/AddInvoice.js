import React, { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/AddInvoice.css";
import Supplier from "./Supplier";

function AddInvoice({ isOpen, closeModal, setInvoices, projects, invoices }) {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [totalSum, setTotalSum] = useState(0);
  const [issueDate, setIssueDate] = useState(new Date());
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [selectedProject, setSelectedProject] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check for an existing invoice with the same invoice number
      const existingInvoice = invoices.find(
        (invoice) => invoice.invoiceNo === invoiceNo
      );
      if (existingInvoice) {
        alert("O factura cu acest numar de factura exista deja.");
        setLoading(false);
        return;
      }

      // Add the new invoice to Firestore.
      // The onSnapshot listener in App will automatically update the invoice list.
      await addDoc(collection(db, "invoices"), {
        supplier: selectedSupplier?.id,
        invoiceNo,
        totalSum,
        remainingSum: totalSum,
        issueDate: Timestamp.fromDate(issueDate),
        paymentDate: Timestamp.fromDate(paymentDate),
        project: selectedProject,
        paid: false,
      });

      setSuccessMessage("Factura a fost adaugata cu succes!");
      setTimeout(() => setSuccessMessage(""), 3000);

      // Clear input fields and close modal
      closeModal();
      setSelectedSupplier(null);
      setInvoiceNo("");
      setTotalSum(0);
      setSelectedProject("");
    } catch (error) {
      console.error("Error adding invoice:", error);
    } finally {
      setLoading(false);
    }
  };


  if (!isOpen) return null;

  // Convert projects object to an array for dropdown options
  const projectOptions = Object.entries(projects).map(([id, name]) => ({
    id,
    name,
  }));

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Adauga factura noua</h2>

        {successMessage && <div className="success-message">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <Supplier setSelectedSupplier={setSelectedSupplier} />

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

          <label className="modal-label">Proiect</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="modal-input"
          >
            <option value="" disabled hidden>
              Selecteaza un proiect
            </option>
            {projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <button type="submit" className="modal-submit" disabled={loading}>
            {loading ? "Adaugare..." : "Adauga factura"}
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
