import React from "react";
import moment from "moment";
import "../styles/Invoices.css";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

function Invoices({ invoices, fetchInvoices, fetchInvoicesHome }) {
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

  return (
    <div className="page-content">
      <h2 className="page-title2">Toate facturile</h2>
      <ul className="invoice-list">
        {invoices.map((invoice) => {
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
                {!invoice.paid && (
                  <div
                    className="paid-button"
                    onClick={() => markAsPaid(invoice.id)}
                  >
                    Am platit
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Invoices;
