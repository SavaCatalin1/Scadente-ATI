import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/AddInvoice.css";

function AddInvoice({ isOpen, closeModal, fetchInvoices, fetchInvoicesHome }) {
  const [supplier, setSupplier] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [totalSum, setTotalSum] = useState(0);
  const [issueDate, setIssueDate] = useState(new Date());
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [projects, setProjects] = useState([]); // Store projects fetched from Firestore
  const [selectedProject, setSelectedProject] = useState(""); // Selected project
  const [loading, setLoading] = useState(false); // Loading state to prevent double submission

  useEffect(() => {
    // Fetch the list of projects from Firestore when the modal is opened
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
      fetchProjects(); // Only fetch projects when the modal is opened
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Set loading to true to prevent duplicate submission
    setLoading(true);

    // Check if an invoice with the same invoiceNo exists
    try {
      const invoicesSnapshot = await getDocs(collection(db, "invoices"));

      // Check if an invoice with the same invoiceNo exists in the fetched invoices
      const existingInvoice = invoicesSnapshot.docs.find(
        (doc) => doc.data().invoiceNo === invoiceNo
      );

      if (existingInvoice) {
        alert("O factura cu acest numar de factura exista deja."); // Alert the user
        setLoading(false); // Reset loading state if duplicate found
        return; // Stop form submission if the invoice already exists
      }

      // If the invoiceNo is unique, proceed with adding the new invoice
      await addDoc(collection(db, "invoices"), {
        supplier,
        invoiceNo,
        totalSum,
        issueDate, // Store issueDate as a Date object (timestamp)
        paymentDate, // Store paymentDate as a Date object (timestamp)
        project: selectedProject, // Include the selected project
        paid: false, // Default unpaid status
      });

      // Reset the form after successful submission
      closeModal();
      fetchInvoices(); // Refresh invoices
      fetchInvoicesHome(); // Refresh home invoices
      setSupplier("");
      setInvoiceNo("");
      setTotalSum(0);
      setSelectedProject("");
    } catch (error) {
      console.error("Error adding invoice:", error);
    } finally {
      setLoading(false); // Reset loading state after submission completes
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
            disabled={loading} // Disable button while loading
          >
            {loading ? "Adaugare..." : "Adauga factura"}{" "}
            {/* Show loading text */}
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
