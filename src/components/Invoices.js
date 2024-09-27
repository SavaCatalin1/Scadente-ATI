import React from "react";
import "../styles/Invoices.css";

function Invoices({ invoices }) {
  return (
    <div className="page-content">
      <h2 className="page-title2">Toate facturile</h2>
      <ul className="invoice-list">
        {invoices.map((invoice) => (
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
                <b>Data emitere:</b> {invoice.issueDate}
              </span>
              <span>
                <b>Data scadenta:</b> {invoice.paymentDate}
              </span>
              <span>
                <b>Total plata:</b> {invoice.totalSum} LEI
              </span>
              <span className="paid-status"></span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Invoices;
