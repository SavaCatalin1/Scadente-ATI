import React from "react";
import "../styles/Homepage.css";
import InvoiceItem from "./InvoiceItem";

function Homepage({ invoices, setInvoices, fetchInvoices, fetchInvoicesHome }) {
  const totalSum = invoices.reduce(
    (acc, invoice) => acc + Number(invoice.totalSum),
    0
  );

  return (
    <div className="page-content">
      <h2 className="page-title">Facturile scadente ({invoices.length})</h2>
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
            <InvoiceItem
              key={invoice.id}
              invoice={invoice}
              setInvoices={setInvoices}
              fetchInvoices={fetchInvoices}
              fetchInvoicesHome={fetchInvoicesHome}
            />
          ))
        )}
      </ul>
    </div>
  );
}

export default Homepage;
