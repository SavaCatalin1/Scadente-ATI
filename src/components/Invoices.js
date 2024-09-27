import React, { useState, useEffect } from "react";
import moment from "moment";
import "../styles/Invoices.css";
import {
  deleteDoc,
  doc,
  updateDoc,
  getDocs,
  collection,
} from "firebase/firestore";
import { db } from "../firebase";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function Invoices({ invoices, fetchInvoices, fetchInvoicesHome }) {
  const [filteredInvoices, setFilteredInvoices] = useState(invoices);
  const [supplierFilter, setSupplierFilter] = useState("");
  const [projects, setProjects] = useState([]); // Store available projects
  const [editingInvoiceId, setEditingInvoiceId] = useState(null); // Store ID of the invoice being edited
  const [invoiceData, setInvoiceData] = useState({}); // Store editable invoice data

  useEffect(() => {
    // Filter invoices based on the supplier input
    setFilteredInvoices(
      invoices.filter((invoice) =>
        invoice.supplier.toLowerCase().includes(supplierFilter.toLowerCase())
      )
    );
  }, [invoices, supplierFilter]);

  useEffect(() => {
    // Fetch all available projects
    const fetchProjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "projects"));
        const projectList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(projectList); // Store the projects in state
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, []);

  const markAsPaid = async (invoiceId) => {
    // Show confirmation prompt
    const confirmPayment = window.confirm(
      "Sunteti sigur ca vreti sa marcati ca platit?"
    );

    if (!confirmPayment) {
      return; // Exit if the user clicks "Cancel"
    }

    const invoiceRef = doc(db, "invoices", invoiceId);

    try {
      // Update the 'paid' attribute in Firebase to true
      await updateDoc(invoiceRef, { paid: true });

      // Update the local state to remove the paid invoice from the list
      fetchInvoices();
      fetchInvoicesHome();
    } catch (error) {
      console.error("Error updating invoice status:", error);
    }
  };

  const deleteInvoice = async (invoiceId) => {
    // Show confirmation prompt
    const confirmDelete = window.confirm(
      "Sunteti sigur ca vreti sa stergeti aceasta factura?"
    );

    if (!confirmDelete) {
      return; // Exit if the user clicks "Cancel"
    }

    const invoiceRef = doc(db, "invoices", invoiceId);

    try {
      // Delete the document from Firestore
      await deleteDoc(invoiceRef);

      // Re-fetch invoices after deletion
      fetchInvoices();
      fetchInvoicesHome();
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

  const startEditing = (invoice) => {
    setEditingInvoiceId(invoice.id);
    setInvoiceData({
      supplier: invoice.supplier,
      invoiceNo: invoice.invoiceNo,
      totalSum: invoice.totalSum,
      project: invoice.project,
      issueDate: invoice.issueDate.toDate(),
      paymentDate: invoice.paymentDate.toDate(),
    });
  };

  const handleFieldChange = (field, value) => {
    setInvoiceData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const saveInvoiceChanges = async (invoiceId) => {
    const invoiceRef = doc(db, "invoices", invoiceId);

    try {
      // Update the invoice fields in Firestore
      await updateDoc(invoiceRef, {
        supplier: invoiceData.supplier,
        invoiceNo: invoiceData.invoiceNo,
        totalSum: invoiceData.totalSum,
        project: invoiceData.project,
        issueDate: invoiceData.issueDate, // Store as Firestore timestamp
        paymentDate: invoiceData.paymentDate, // Store as Firestore timestamp
      });

      // Refresh the invoices list
      fetchInvoices();
      fetchInvoicesHome();
      setEditingInvoiceId(null); // Exit edit mode
    } catch (error) {
      console.error("Error updating invoice:", error);
    }
  };

  // Calculate the total sum of unpaid invoices
  const totalUnpaidSum = filteredInvoices
    .filter((invoice) => !invoice.paid)
    .reduce((acc, invoice) => acc + Number(invoice.totalSum), 0);

  return (
    <div className="page-content">
      <div className="invoices-flex">
        <div className="page-title2 width">Toate facturile</div>
        <div className="supplier-flex width">
          <span className="supplier-text">Furnizor: </span>
          <input
            className="supplier-input"
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)} // Update filter on input change
          />
        </div>
        <div className="width align-right">
          <b>De plata:</b> {totalUnpaidSum.toFixed(2)} LEI
        </div>
      </div>
      <ul className="invoice-list">
        {filteredInvoices.map((invoice) => {
          const issueDateFormatted = moment(invoice.issueDate.toDate()).format(
            "DD-MM-YYYY"
          );
          const paymentDateFormatted = moment(
            invoice.paymentDate.toDate()
          ).format("DD-MM-YYYY");

          const isEditing = editingInvoiceId === invoice.id; // Check if this invoice is being edited

          return (
            <li className="invoice-item" key={invoice.id}>
              {isEditing ? (
                <>
                  {/* Edit Mode */}
                  <div>
                    <label>
                      <b>Furnizor:</b>
                      <input
                        value={invoiceData.supplier}
                        onChange={(e) =>
                          handleFieldChange("supplier", e.target.value)
                        }
                      />
                    </label>

                    <label>
                      <b>Numar factura:</b>
                      <input
                        value={invoiceData.invoiceNo}
                        onChange={(e) =>
                          handleFieldChange("invoiceNo", e.target.value)
                        }
                      />
                    </label>

                    <label>
                      <b>Total:</b>
                      <input
                        type="number"
                        value={invoiceData.totalSum}
                        onChange={(e) =>
                          handleFieldChange("totalSum", e.target.value)
                        }
                      />
                    </label>

                    <label>
                      <b>Proiect:</b>
                      <select
                        value={invoiceData.project}
                        onChange={(e) =>
                          handleFieldChange("project", e.target.value)
                        }
                      >
                        <option value="" disabled>
                          Selecteaza un proiect
                        </option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div>
                    <label>
                      <b>Data emitere:</b>
                      <DatePicker
                        selected={invoiceData.issueDate}
                        onChange={(date) =>
                          handleFieldChange("issueDate", date)
                        }
                        dateFormat="dd-MM-yyyy"
                      />
                    </label>

                    <label>
                      <b>Data scadenta:</b>
                      <DatePicker
                        selected={invoiceData.paymentDate}
                        onChange={(date) =>
                          handleFieldChange("paymentDate", date)
                        }
                        dateFormat="dd-MM-yyyy"
                      />
                    </label>
                  </div>

                  <button onClick={() => saveInvoiceChanges(invoice.id)}>
                    Salveaza
                  </button>
                </>
              ) : (
                <>
                  {/* View Mode */}
                  <div>
                    <span className="view">
                      <b>Furnizor:</b> {invoice.supplier}
                    </span>
                    <span className="view">
                      <b>Numar factura:</b> {invoice.invoiceNo}
                    </span>
                    <span className="view">
                      <b>Proiect:</b> {invoice.projectName || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="view">
                      <b>Data emitere:</b> {issueDateFormatted}
                    </span>
                    <span className="view">
                      <b>Data scadenta:</b> {paymentDateFormatted}
                    </span>
                    <span className="view">
                      <b>Total plata:</b> {invoice.totalSum} LEI
                    </span>
                  </div>
                  <div className="delete-flex">
                    <span
                      className={`status ${
                        invoice.paid
                          ? "platit"
                          : invoice.status.replace(/\s+/g, "-").toLowerCase()
                      }`}
                    >
                      <b>Status:</b> {invoice.paid ? "Platit" : invoice.status}
                    </span>

                    <div className="tools">
                      {!invoice.paid && (
                        <div
                          className="paid-button"
                          onClick={() => markAsPaid(invoice.id)}
                        >
                          Am platit
                        </div>
                      )}
                      <div>
                        <EditIcon
                          onClick={() => startEditing(invoice)}
                          className="edit-button"
                        />
                        <DeleteIcon
                          onClick={() => deleteInvoice(invoice.id)}
                          className="pointer"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Invoices;
