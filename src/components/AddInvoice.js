import React, { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/AddInvoice.css"; // will contain updated unified styles
import Supplier from "./Supplier";
import Button from './ui/Button';

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
        (invoice) => invoice.invoiceNo === invoiceNo &&
          invoice.supplier === selectedSupplier?.id
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
    <div className="app-modal-overlay" onClick={closeModal}>
      <div className="app-modal wide" role="dialog" aria-modal="true" aria-label="Adauga factura" onClick={e => e.stopPropagation()}>
        <div className="app-modal-header">
          <h2 className="app-modal-title">Adauga factura noua</h2>
          <button className="app-modal-close" type="button" onClick={closeModal} aria-label="Inchide">✕</button>
        </div>
        <div className="app-modal-body">
          {successMessage && <div className="modal-success-banner">{successMessage}</div>}
          <form onSubmit={handleSubmit} className="app-modal-form add-invoice-form">
            <div className="form-grid">
              <div className="form-span-2">
                <Supplier setSelectedSupplier={setSelectedSupplier} />
              </div>
              <div className="form-field">
                <label className="input-label">Nr. factura</label>
                <input
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  required
                  className="input"
                  placeholder="Ex: INV-123"
                  maxLength={60}
                />
              </div>
              <div className="form-field">
                <label className="input-label">Total</label>
                <input
                  type="number"
                  value={totalSum}
                  onChange={(e) => setTotalSum(e.target.value)}
                  required
                  className="input"
                  min={0}
                  step="0.01"
                />
              </div>
              <div className="form-field">
                <label className="input-label">Data emitere</label>
                <DatePicker
                  selected={issueDate}
                  onChange={setIssueDate}
                  className="input date-picker"
                  dateFormat="dd-MM-yyyy"
                />
              </div>
              <div className="form-field">
                <label className="input-label">Data scadenta</label>
                <DatePicker
                  selected={paymentDate}
                  onChange={setPaymentDate}
                  className="input date-picker"
                  dateFormat="dd-MM-yyyy"
                />
              </div>
              <div className="form-field">
                <label className="input-label">Proiect</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="input"
                >
                  <option value="" disabled hidden>Selecteaza un proiect</option>
                  {projectOptions.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-actions">
              <Button type="submit" variant="primary" size="sm" disabled={loading || !invoiceNo || !selectedSupplier}>{loading ? 'Adaugare...' : 'Adauga factura'}</Button>
              <Button type="button" variant="neutral" size="sm" onClick={closeModal}>Anuleaza</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddInvoice;
