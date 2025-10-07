import React, { useState, useEffect, useRef } from "react";
import "../styles/Invoices.css";
import { deleteDoc, doc, writeBatch, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import InvoiceItem from "./InvoiceItem";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import FilterListIcon from "@mui/icons-material/FilterList";

function Invoices({ projects, invoices, suppliers, setInvoices, loading }) {
  const [filteredInvoices, setFilteredInvoices] = useState(invoices);
  const [supplierFilter, setSupplierFilter] = useState("");
  const [invoiceNoFilter, setInvoiceNoFilter] = useState("");
  const [issueDateFilter, setIssueDateFilter] = useState(null);
  const [paymentDateFilter, setPaymentDateFilter] = useState(null);
  const [sortOrder, setSortOrder] = useState({ field: "", order: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [bulkPayLoading, setBulkPayLoading] = useState(false);
  const [bulkPayMessage, setBulkPayMessage] = useState("");
  const [dedupeLoading, setDedupeLoading] = useState(false);
  const [dedupeMessage, setDedupeMessage] = useState("");
  const filtersRef = useRef(null);
  const filtersButtonRef = useRef(null);

  useEffect(() => {
    let filtered = invoices.filter((invoice) => {
      const supplierName = suppliers[invoice.supplier] || invoice.supplier;
      const matchesSupplier = supplierName
        ?.toLowerCase()
        .includes(supplierFilter.toLowerCase());

      const matchesInvoiceNo = invoice.invoiceNo
        .toLowerCase()
        .includes(invoiceNoFilter.toLowerCase());

      const matchesIssueDate =
        !issueDateFilter || new Date(invoice.issueDate).toDateString() === issueDateFilter.toDateString();

      const matchesPaymentDate =
        !paymentDateFilter || new Date(invoice.paymentDate).toDateString() === paymentDateFilter.toDateString();

      return matchesSupplier && matchesInvoiceNo && matchesIssueDate && matchesPaymentDate;
    });

    if (sortOrder.field) {
      filtered = filtered.sort((a, b) => {
        const dateA = new Date(a[sortOrder.field]);
        const dateB = new Date(b[sortOrder.field]);
        return sortOrder.order === "asc" ? dateA - dateB : dateB - dateA;
      });
    }

    setFilteredInvoices(filtered);
  }, [
    invoices,
    suppliers,
    supplierFilter,
    invoiceNoFilter,
    issueDateFilter,
    paymentDateFilter,
    sortOrder,
  ]);

  const deleteInvoice = async (invoiceId) => {
    const confirmDelete = window.confirm("Sunteti sigur ca vreti sa stergeti aceasta factura?");
    if (!confirmDelete) return;

    try {
      // Delete the invoice from Firestore
      await deleteDoc(doc(db, "invoices", invoiceId));

      // Update application state to remove the invoice
      setInvoices((prevInvoices) => prevInvoices.filter((invoice) => invoice.id !== invoiceId));

      // Update localStorage to remove the invoice
      const cachedInvoices = JSON.parse(localStorage.getItem("invoicesCache")) || [];
      const updatedInvoicesCache = cachedInvoices.filter((invoice) => invoice.id !== invoiceId);
      localStorage.setItem("invoicesCache", JSON.stringify(updatedInvoicesCache));

      console.log("Invoice deleted from both Firestore and localStorage.");
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

  const unpaidFilteredInvoices = filteredInvoices.filter((inv) => !inv.paid);

  // Close filters when clicking outside
  useEffect(() => {
    if (!showFilters) return; // only listen when visible
    const handleClickOutside = (e) => {
      if (
        filtersRef.current &&
        !filtersRef.current.contains(e.target) &&
        filtersButtonRef.current &&
        !filtersButtonRef.current.contains(e.target)
      ) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilters]);

  const bulkMarkAsPaid = async () => {
    if (unpaidFilteredInvoices.length === 0) return;
    const confirmBulk = window.confirm(`Marcati ca platite ${unpaidFilteredInvoices.length} facturi filtrate?`);
    if (!confirmBulk) return;
    setBulkPayLoading(true);
    setBulkPayMessage("");
    try {
      const batch = writeBatch(db);
      unpaidFilteredInvoices.forEach((invoice) => {
        const ref = doc(db, "invoices", invoice.id);
        // Set remainingSum to 0 and add a paymentHistory entry for full payment if there is remainingSum > 0
        const updates = { paid: true, remainingSum: 0 };
        if (invoice.remainingSum > 0) {
          updates.paymentHistory = [
            ...(invoice.paymentHistory || []),
            { amount: Number(invoice.remainingSum), date: Timestamp.fromDate(new Date()) },
          ];
        }
        batch.update(ref, updates);
      });
      await batch.commit();
      setBulkPayMessage(`Au fost marcate ca platite ${unpaidFilteredInvoices.length} facturi.`);
      // Optimistic UI update (optional because onSnapshot will refresh) 
      setInvoices((prev) => prev.map(inv => unpaidFilteredInvoices.find(f => f.id === inv.id) ? { ...inv, paid: true, remainingSum: 0 } : inv));
      setTimeout(() => setBulkPayMessage(""), 4000);
    } catch (e) {
      console.error("Bulk pay error", e);
      setBulkPayMessage("Eroare la marcarea bulk.");
    } finally {
      setBulkPayLoading(false);
    }
  };

  const findDuplicateInvoices = () => {
    // Map of normalized invoiceNo to list of invoices
    const map = new Map();
    invoices.forEach(inv => {
      const key = (inv.invoiceNo || "").trim().toLowerCase();
      if (!key) return; // skip empty numbers
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(inv);
    });
    // Return arrays with length > 1
    return Array.from(map.values()).filter(group => group.length > 1);
  };

  const deleteDuplicateInvoices = async () => {
    setDedupeMessage("");
    const duplicates = findDuplicateInvoices();
    if (duplicates.length === 0) {
      setDedupeMessage("Nu exista facturi duplicate.");
      setTimeout(() => setDedupeMessage(""), 4000);
      return;
    }

    // Determine which invoices to keep: keep earliest issueDate (or first entered if issueDate missing)
    // Collect invoices to delete
    const toDelete = [];
    duplicates.forEach(group => {
      const sorted = group.slice().sort((a,b) => new Date(a.issueDate) - new Date(b.issueDate));
      // Keep first, delete rest
      sorted.slice(1).forEach(inv => toDelete.push(inv));
    });

    const confirmMsg = `S-au gasit ${toDelete.length} facturi duplicate. Doriti sa le stergeti? (Se pastreaza cea mai veche la fiecare numar)`;
    const confirmDel = window.confirm(confirmMsg);
    if (!confirmDel) return;
    setDedupeLoading(true);
    try {
      // Firestore batched deletes (batch limit 500)
      const chunks = [];
      for (let i = 0; i < toDelete.length; i += 450) { // use 450 for safety
        chunks.push(toDelete.slice(i, i + 450));
      }
      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(inv => {
          batch.delete(doc(db, "invoices", inv.id));
        });
        await batch.commit();
      }
      setDedupeMessage(`Au fost sterse ${toDelete.length} facturi duplicate.`);
      // Optimistic state update
      setInvoices(prev => prev.filter(inv => !toDelete.find(d => d.id === inv.id)));
      // Update localStorage cache too
      const cached = JSON.parse(localStorage.getItem("invoicesCache") || "[]");
      const updatedCache = cached.filter(inv => !toDelete.find(d => d.id === inv.id));
      localStorage.setItem("invoicesCache", JSON.stringify(updatedCache));
      setTimeout(() => setDedupeMessage(""), 5000);
    } catch (e) {
      console.error("Eroare la stergerea duplicatelor", e);
      setDedupeMessage("Eroare la stergerea duplicatelor.");
    } finally {
      setDedupeLoading(false);
    }
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

        <div className="filters-dropdown" ref={filtersButtonRef}>
          <button onClick={() => setShowFilters(!showFilters)} className="filters-button">
            <FilterListIcon /> {showFilters ? "Ascunde filtre" : "Arata filtre"}
          </button>
          {showFilters && (
            <div className="filters-section" ref={filtersRef}>
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
        </div>

        <div className="bulk-actions width align-right">
          <button
            className="bulk-pay-button"
            disabled={bulkPayLoading || unpaidFilteredInvoices.length === 0}
            onClick={bulkMarkAsPaid}
          >
            {bulkPayLoading ? "Se proceseaza..." : `Marcheaza (${unpaidFilteredInvoices.length}) ca platite`}
          </button>
          <button
            className="dedupe-button"
            disabled={dedupeLoading}
            onClick={deleteDuplicateInvoices}
            title="Sterge facturile duplicate dupa numarul facturii (pastreaza cea mai veche)"
          >
            {dedupeLoading ? "Verific..." : "Sterge Duplicatele"}
          </button>
        </div>


        <div className="width align-right totals-area">
          <b>De plata:</b> {totalUnpaidSum.toFixed(2)} LEI
          <div className="status-messages">
            {bulkPayMessage && (
              <div className="bulk-pay-message">{bulkPayMessage}</div>
            )}
            {!bulkPayMessage && dedupeMessage && (
              <div className="dedupe-message">{dedupeMessage}</div>
            )}
          </div>
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
