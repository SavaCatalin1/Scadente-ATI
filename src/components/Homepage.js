import React from "react";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/Homepage.css";

function Homepage({ invoices, setInvoices, fetchInvoices }) {
  // Function to mark an invoice as paid
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
      setInvoices(invoices.filter((invoice) => invoice.id !== invoiceId));
      fetchInvoices();
    } catch (error) {
      console.error("Error updating invoice status:", error);
    }
  };

  const totalSum = invoices.reduce(
    (acc, invoice) => acc + Number(invoice.totalSum),
    0
  );

  return (
    <div className="page-content">
      <h2 className="page-title">
        Facturile scadente astazi ({invoices.length})
      </h2>
      <div>
        <b>Total plata: {totalSum.toFixed(2)} LEI</b>
      </div>
      <ul className="invoice-list">
        {invoices.length === 0 ? (
          <li className="invoice-empty">
            Nu sunt facturi cu data scadenta astazi.
          </li>
        ) : (
          invoices.map((invoice) => (
            <li className="invoice-item" key={invoice.id}>
              <div className="flex">
                <div className="item">
                  <b>
                    Furnizor:<br></br>
                  </b>
                  {invoice.supplier}
                </div>
                <div className="item">
                  <b>Nr. factura:</b> {invoice.invoiceNo}
                </div>
                <div className="item">
                  <b>Data emitere:</b> {invoice.issueDate}
                </div>
                <div className="item">
                  <b>Data scadenta:</b> {invoice.paymentDate}
                </div>
                <div className="item">
                  <b>Total:</b> {Number(invoice.totalSum).toFixed(2)}
                </div>
              </div>
              <div
                className="paid-button"
                onClick={() => markAsPaid(invoice.id)}
              >
                Am platit
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default Homepage;
