import React, { useState, useEffect } from "react";
import "../styles/Invoices.css";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import InvoiceItem from "./InvoiceItem";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import AddRemainingSumToInvoices from "./FIX";

function Invoices({
  projects,
  fetchProjects,
  invoices,
  fetchInvoices,
  fetchInvoicesHome,
}) {
  const [filteredInvoices, setFilteredInvoices] = useState(invoices);
  const [supplierFilter, setSupplierFilter] = useState("");
  const [issueDateFilter, setIssueDateFilter] = useState(null); // Issue Date Filter
  const [paymentDateFilter, setPaymentDateFilter] = useState(null); // Payment Date Filter
  const [sortOrder, setSortOrder] = useState({ field: "", order: "" }); // Sorting order

  useEffect(() => {
    // Filter based on supplier, issue date, and payment date
    let filtered = invoices.filter((invoice) => {
      const matchesSupplier = invoice.supplier
        .toLowerCase()
        .includes(supplierFilter.toLowerCase());

      const matchesIssueDate =
        !issueDateFilter ||
        invoice.issueDate.toDate().toDateString() ===
          issueDateFilter.toDateString(); // Compare issue date

      const matchesPaymentDate =
        !paymentDateFilter ||
        invoice.paymentDate.toDate().toDateString() ===
          paymentDateFilter.toDateString(); // Compare payment date

      return matchesSupplier && matchesIssueDate && matchesPaymentDate;
    });

    // Sort invoices based on selected sorting order
    if (sortOrder.field) {
      filtered = filtered.sort((a, b) => {
        const dateA = a[sortOrder.field].toDate();
        const dateB = b[sortOrder.field].toDate();

        return sortOrder.order === "asc"
          ? dateA - dateB // Ascending
          : dateB - dateA; // Descending
      });
    }

    setFilteredInvoices(filtered);
  }, [invoices, supplierFilter, issueDateFilter, paymentDateFilter, sortOrder]);

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

  // Updated totalUnpaidSum to use remainingSum
  const totalUnpaidSum = filteredInvoices
    .filter((invoice) => !invoice.paid)
    .reduce((acc, invoice) => acc + Number(invoice.remainingSum), 0);

  // Clear Filters
  const clearFilters = () => {
    setSupplierFilter("");
    setIssueDateFilter(null);
    setPaymentDateFilter(null);
  };

  // Sorting logic for issue and payment date
  const toggleSort = (field) => {
    setSortOrder((prevState) => {
      if (prevState.field === field) {
        return {
          field,
          order: prevState.order === "asc" ? "desc" : "asc",
        }; // Toggle between ascending and descending
      } else {
        return { field, order: "asc" }; // Default to ascending on first click
      }
    });
  };

  return (
    <div className="page-content">
      <div className="invoices-flex">
        <div className="page-title2 width">Toate facturile</div>
        {/* <AddRemainingSumToInvoices /> */}
        {/* Supplier Filter */}
        <div className="supplier-flex width">
          <span className="supplier-text">
            <b>Furnizor:</b>{" "}
          </span>
          <input
            className="supplier-input"
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)} // Update filter on input change
          />
        </div>

        {/* Issue Date Filter */}
        <div className="supplier-flex width">
          <span className="supplier-text">
            <b>Data emitere:</b>{" "}
          </span>
          <DatePicker
            selected={issueDateFilter}
            onChange={(date) => setIssueDateFilter(date)} // Update filter on date change
            className="supplier-input"
            dateFormat="dd-MM-yyyy"
            placeholderText="Selecteaza data emitere"
          />
        </div>

        {/* Payment Date Filter */}
        <div className="supplier-flex width">
          <span className="supplier-text">
            <b>Data scadenta:</b>{" "}
          </span>
          <DatePicker
            selected={paymentDateFilter}
            onChange={(date) => setPaymentDateFilter(date)} // Update filter on date change
            className="supplier-input"
            dateFormat="dd-MM-yyyy"
            placeholderText="Selecteaza data scadenta"
          />
        </div>

        {/* Clear Filters Button */}
        <div className="filters-clear-section">
          <button onClick={clearFilters} className="clear-filters-button">
            <ClearAllIcon />
          </button>
        </div>

        <div className="width align-right">
          <b>De plata:</b> {totalUnpaidSum.toFixed(2)} LEI
        </div>
      </div>

      {/* Sorting Buttons */}
      <div className="sort-buttons">
        <button onClick={() => toggleSort("issueDate")} className="sort-button">
          Sorteaza dupa Data Emitere (
          {sortOrder.field === "issueDate" ? sortOrder.order : "none"})
        </button>
        <button
          onClick={() => toggleSort("paymentDate")}
          className="sort-button"
        >
          Sorteaza dupa Data Scadenta (
          {sortOrder.field === "paymentDate" ? sortOrder.order : "none"})
        </button>
      </div>

      {/* Invoice List */}
      <ul className="invoice-list">
        {filteredInvoices.map((invoice) => (
          <InvoiceItem
            key={invoice.id}
            invoice={invoice}
            projects={projects}
            fetchProjects={fetchProjects}
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
