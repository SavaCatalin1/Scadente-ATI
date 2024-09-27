import React, { useState, useEffect } from "react";
import moment from "moment";
import "../styles/Invoices.css";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import DeleteIcon from "@mui/icons-material/Delete";

function Invoices({ invoices, fetchInvoices, fetchInvoicesHome }) {
  const [filteredInvoices, setFilteredInvoices] = useState(invoices);
  const [supplierFilter, setSupplierFilter] = useState("");

  useEffect(() => {
    // Filter invoices based on the supplier input
    setFilteredInvoices(
      invoices.filter((invoice) =>
        invoice.supplier.toLowerCase().includes(supplierFilter.toLowerCase())
      )
    );
  }, [invoices, supplierFilter]);

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
          // Convert issueDate and paymentDate from Firestore timestamp to readable format
          const issueDateFormatted = moment(invoice.issueDate.toDate()).format(
            "DD-MM-YYYY"
          );
          const paymentDateFormatted = moment(
            invoice.paymentDate.toDate()
          ).format("DD-MM-YYYY");

          return (
            <li className="invoice-item" key={invoice.id}>
              <div>
                <span>
                  <b>Furnizor:</b> {invoice.supplier}
                </span>
                <span>
                  <b>Numar factura:</b> {invoice.invoiceNo}
                </span>
                <span
                  className={`status ${
                    invoice.paid
                      ? "platit"
                      : invoice.status.replace(/\s+/g, "-").toLowerCase()
                  }`}
                >
                  <b>Status:</b> {invoice.paid ? "Platit" : invoice.status}
                </span>
              </div>
              <div>
                <span>
                  <b>Data emitere:</b> {issueDateFormatted}
                </span>
                <span>
                  <b>Data scadenta:</b> {paymentDateFormatted}
                </span>
                <span>
                  <b>Total plata:</b> {invoice.totalSum} LEI
                </span>
                <div className="delete-flex">
                  {!invoice.paid && (
                    <div
                      className="paid-button"
                      onClick={() => markAsPaid(invoice.id)}
                    >
                      Am platit
                    </div>
                  )}

                  <DeleteIcon onClick={() => deleteInvoice(invoice.id)} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Invoices;
