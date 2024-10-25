import React, { useState, useEffect } from "react";
import "../styles/Invoices.css";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import InvoiceItem from "./InvoiceItem";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import FilterListIcon from "@mui/icons-material/FilterList";

function Invoices({
  projects,
  invoices,
  suppliers,
  setInvoices,
  loading
}) {
  const [filteredInvoices, setFilteredInvoices] = useState(invoices);
  const [supplierFilter, setSupplierFilter] = useState("");
  const [invoiceNoFilter, setInvoiceNoFilter] = useState("");
  const [issueDateFilter, setIssueDateFilter] = useState(null);
  const [paymentDateFilter, setPaymentDateFilter] = useState(null);
  const [sortOrder, setSortOrder] = useState({ field: "", order: "" });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let filtered = invoices.filter((invoice) => {
      const supplierName = suppliers[invoice.supplier] || invoice.supplier;
      const matchesSupplier = supplierName
        .toLowerCase()
        .includes(supplierFilter.toLowerCase());

      const matchesInvoiceNo = invoice.invoiceNo
        .toLowerCase()
        .includes(invoiceNoFilter.toLowerCase());

      const matchesIssueDate =
        !issueDateFilter ||
        invoice.issueDate.toDate().toDateString() === issueDateFilter.toDateString();

      const matchesPaymentDate =
        !paymentDateFilter ||
        invoice.paymentDate.toDate().toDateString() === paymentDateFilter.toDateString();

      return matchesSupplier && matchesInvoiceNo && matchesIssueDate && matchesPaymentDate;
    });

    if (sortOrder.field) {
      filtered = filtered.sort((a, b) => {
        const dateA = a[sortOrder.field].toDate();
        const dateB = b[sortOrder.field].toDate();
        return sortOrder.order === "asc" ? dateA - dateB : dateB - dateA;
      });
    }

    setFilteredInvoices(filtered);
  }, [invoices, suppliers, supplierFilter, invoiceNoFilter, issueDateFilter, paymentDateFilter, sortOrder]);

  const deleteInvoice = async (invoiceId) => {
    const confirmDelete = window.confirm("Sunteti sigur ca vreti sa stergeti aceasta factura?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "invoices", invoiceId));
      setInvoices(prevInvoices => prevInvoices.filter(invoice => invoice.id !== invoiceId));
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

  const totalUnpaidSum = filteredInvoices
    .filter((invoice) => !invoice.paid)
    .reduce((acc, invoice) => acc + Number(invoice.remainingSum), 0);

  const clearFilters = () => {
    setSupplierFilter("");
    setInvoiceNoFilter("");
    setIssueDateFilter(null);
    setPaymentDateFilter(null);
  };

  const toggleSort = (field) => {
    setSortOrder((prevState) => {
      if (prevState.field === field) {
        return { field, order: prevState.order === "asc" ? "desc" : "asc" };
      } else {
        return { field, order: "asc" };
      }
    });
  };

  return (
    <div className="page-content">
      <div className="invoices-flex">
        <div className="page-title2 width">
          Toate facturile ({filteredInvoices.length})
        </div>

        <div className="filters-dropdown">
          <button onClick={() => setShowFilters(!showFilters)} className="filters-button">
            <FilterListIcon /> {showFilters ? "Ascunde filtre" : "Arata filtre"}
          </button>
        </div>

        {showFilters && (
          <div className="filters-section">
            <div className="supplier-flex width">
              <label className="label">Furnizor:</label>
              <input
                className="supplier-input"
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
              />
            </div>
            <div className="supplier-flex width">
              <label className="label">Nr. Factura:</label>
              <input
                className="supplier-input"
                value={invoiceNoFilter}
                onChange={(e) => setInvoiceNoFilter(e.target.value)}
              />
            </div>
            <div className="supplier-flex width">
              <label className="label">Data emitere:</label>
              <DatePicker
                selected={issueDateFilter}
                onChange={(date) => setIssueDateFilter(date)}
                className="date-picker"
                dateFormat="dd-MM-yyyy"
                placeholderText="Selecteaza data emitere"
              />
            </div>
            <div className="supplier-flex width">
              <label className="label">Data scadenta:</label>
              <DatePicker
                selected={paymentDateFilter}
                onChange={(date) => setPaymentDateFilter(date)}
                className="date-picker"
                dateFormat="dd-MM-yyyy"
                placeholderText="Selecteaza data scadenta"
              />
            </div>
            <button onClick={() => toggleSort("issueDate")} className="sort-button">
              Sorteaza dupa Data Emitere ({sortOrder.field === "issueDate" ? sortOrder.order : "none"})
            </button>
            <button onClick={() => toggleSort("paymentDate")} className="sort-button">
              Sorteaza dupa Data Scadenta ({sortOrder.field === "paymentDate" ? sortOrder.order : "none"})
            </button>
            <button onClick={clearFilters} className="clear-filters-button">
              <ClearAllIcon /> Curata filtrele
            </button>
          </div>
        )}

        <div className="width align-right">
          <b>De plata:</b> {totalUnpaidSum.toFixed(2)} LEI
        </div>
      </div>

      {loading ? (
        <p>Loading suppliers...</p>
      ) : (
        <ul className="invoice-list">
          {filteredInvoices.map((invoice) => (
            <InvoiceItem
              key={invoice.id}
              invoice={invoice}
              supplierName={suppliers[invoice.supplier] || "Unknown Supplier"}
              projects={projects}
              deleteInvoice={deleteInvoice}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default Invoices;
