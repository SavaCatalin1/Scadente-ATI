import React, { useState, useEffect } from "react";
import "../styles/Invoices.css";
import { getDocs, collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import InvoiceItem from "./InvoiceItem"; // Import InvoiceItem

function Invoices({
  projects,
  fetchProjects,
  invoices,
  fetchInvoices,
  fetchInvoicesHome,
}) {
  const [filteredInvoices, setFilteredInvoices] = useState(invoices);
  const [supplierFilter, setSupplierFilter] = useState("");

  useEffect(() => {
    setFilteredInvoices(
      invoices.filter((invoice) =>
        invoice.supplier.toLowerCase().includes(supplierFilter.toLowerCase())
      )
    );
  }, [invoices, supplierFilter]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const deleteInvoice = async (invoiceId) => {
    const confirmDelete = window.confirm(
      "Sunteti sigur ca vreti sa stergeti aceasta factura?"
    );

    if (!confirmDelete) return;

    const invoiceRef = doc(db, "invoices", invoiceId);

    try {
      await deleteDoc(invoiceRef);
      fetchInvoices();
      fetchInvoicesHome();
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

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
        {filteredInvoices.map((invoice) => (
          <InvoiceItem
            key={invoice.id}
            invoice={invoice}
            projects={projects}
            fetchInvoices={fetchInvoices}
            fetchInvoicesHome={fetchInvoicesHome}
            deleteInvoice={deleteInvoice}
          />
        ))}
      </ul>
    </div>
  );
}

export default Invoices;
