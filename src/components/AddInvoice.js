import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/AddInvoice.css";
import Supplier from "./Supplier";

function AddInvoice({ isOpen, closeModal, fetchInvoices, fetchInvoicesHome }) {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [totalSum, setTotalSum] = useState(0);
  const [issueDate, setIssueDate] = useState(new Date());
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [projects, setProjects] = useState([]); 
  const [selectedProject, setSelectedProject] = useState(""); 
  const [loading, setLoading] = useState(false); 
  const [selectedSupplier, setSelectedSupplier] = useState(null); 
  const [successMessage, setSuccessMessage] = useState(""); 

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "projects"));
        const projectList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(projectList);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const invoicesSnapshot = await getDocs(collection(db, "invoices"));
      const existingInvoice = invoicesSnapshot.docs.find(
        (doc) => doc.data().invoiceNo === invoiceNo
      );

      if (existingInvoice) {
        alert("O factura cu acest numar de factura exista deja.");
        setLoading(false);
        return;
      }

      const supid = selectedSupplier.id;
      await addDoc(collection(db, "invoices"), {
        supplier: supid,
        invoiceNo,
        totalSum,
        remainingSum: totalSum,
        issueDate,
        paymentDate,
        project: selectedProject,
        paid: false,
      });

      // Show success message
      setSuccessMessage("Factura a fost adaugata cu succes!");
      setTimeout(() => setSuccessMessage(""), 3000); 

      closeModal();
      fetchInvoices();
      fetchInvoicesHome();

      setSelectedSupplier("");
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
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Adauga factura noua</h2>

        {/* Success message */}
        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

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
            <option value=""></option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="modal-submit"
            disabled={loading}
          >
            {loading ? "Adaugare..." : "Adauga factura"}{" "}
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
