import React, { useState, useEffect } from "react";
import "../styles/Invoices.css";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import InvoiceItem from "./InvoiceItem";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ClearAllIcon from "@mui/icons-material/ClearAll";

function Invoices({
  projects,
  fetchProjects,
  invoices,
  fetchInvoices,
  fetchInvoicesHome,
}) {
  const [filteredInvoices, setFilteredInvoices] = useState(invoices);
  const [supplierFilter, setSupplierFilter] = useState("");
  const [issueDateFilter, setIssueDateFilter] = useState(null);
  const [paymentDateFilter, setPaymentDateFilter] = useState(null);
  const [suppliers, setSuppliers] = useState({});
  const [loading, setLoading] = useState(true); // Loading state for supplier fetch
  const [sortOrder, setSortOrder] = useState({ field: "", order: "" });

  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true); // Start loading
      const supplierData = {};
      const supplierPromises = invoices.map(async (invoice) => {
        if (invoice.supplier && !supplierData[invoice.supplier]) {
          const supplierDoc = await getDoc(doc(db, "suppliers", invoice.supplier));
          if (supplierDoc.exists()) {
            supplierData[invoice.supplier] = supplierDoc.data().name;
          } else {
            supplierData[invoice.supplier] = "Unknown Supplier"; // Fallback in case the supplier is not found
          }
        }
      });

      await Promise.all(supplierPromises);
      setSuppliers(supplierData);
      setLoading(false); // Stop loading after fetching
    };

    fetchSuppliers();
  }, [invoices]);
  console.log(suppliers)
  useEffect(() => {
    let filtered = invoices.filter((invoice) => {
      const supplierName = suppliers[invoice.supplier] || invoice.supplier; // Use name if available
      const matchesSupplier = supplierName
        .toLowerCase()
        .includes(supplierFilter.toLowerCase());

      const matchesIssueDate =
        !issueDateFilter ||
        invoice.issueDate.toDate().toDateString() === issueDateFilter.toDateString();

      const matchesPaymentDate =
        !paymentDateFilter ||
        invoice.paymentDate.toDate().toDateString() === paymentDateFilter.toDateString();

      return matchesSupplier && matchesIssueDate && matchesPaymentDate;
    });

    if (sortOrder.field) {
      filtered = filtered.sort((a, b) => {
        const dateA = a[sortOrder.field].toDate();
        const dateB = b[sortOrder.field].toDate();

        return sortOrder.order === "asc" ? dateA - dateB : dateB - dateA;
      });
    }

    setFilteredInvoices(filtered);
  }, [invoices, suppliers, supplierFilter, issueDateFilter, paymentDateFilter, sortOrder]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const deleteInvoice = async (invoiceId) => {
    const confirmDelete = window.confirm("Sunteti sigur ca vreti sa stergeti aceasta factura?");
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
    .reduce((acc, invoice) => acc + Number(invoice.remainingSum), 0);

  const clearFilters = () => {
    setSupplierFilter("");
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
        <div className="page-title2 width">Toate facturile ({filteredInvoices.length})</div>
        <div className="supplier-flex width">
          <span className="supplier-text">
            <b>Furnizor:</b>{" "}
          </span>
          <input
            className="supplier-input"
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
          />
        </div>
        <div className="supplier-flex width">
          <span className="supplier-text">
            <b>Data emitere:</b>{" "}
          </span>
          <DatePicker
            selected={issueDateFilter}
            onChange={(date) => setIssueDateFilter(date)}
            className="supplier-input"
            dateFormat="dd-MM-yyyy"
            placeholderText="Selecteaza data emitere"
          />
        </div>

        <div className="supplier-flex width">
          <span className="supplier-text">
            <b>Data scadenta:</b>{" "}
          </span>
          <DatePicker
            selected={paymentDateFilter}
            onChange={(date) => setPaymentDateFilter(date)}
            className="supplier-input"
            dateFormat="dd-MM-yyyy"
            placeholderText="Selecteaza data scadenta"
          />
        </div>

        <div className="filters-clear-section">
          <button onClick={clearFilters} className="clear-filters-button">
            <ClearAllIcon />
          </button>
        </div>

        <div className="width align-right">
          <b>De plata:</b> {totalUnpaidSum.toFixed(2)} LEI
        </div>
      </div>

      <div className="sort-buttons">
        <button onClick={() => toggleSort("issueDate")} className="sort-button">
          Sorteaza dupa Data Emitere ({sortOrder.field === "issueDate" ? sortOrder.order : "none"})
        </button>
        <button onClick={() => toggleSort("paymentDate")} className="sort-button">
          Sorteaza dupa Data Scadenta ({sortOrder.field === "paymentDate" ? sortOrder.order : "none"})
        </button>
      </div>

      {/* Show loading indicator if supplier data is still loading */}
      {loading ? (
        <p>Loading suppliers...</p>
      ) : (
        <ul className="invoice-list">
          {filteredInvoices.map((invoice) => (
            <InvoiceItem
              key={invoice.id}
              invoice={invoice}
              supplierName={suppliers[invoice.supplier] || "Unknown Supplier"} // Use supplier name or fallback
              projects={projects}
              fetchProjects={fetchProjects}
              fetchInvoices={fetchInvoices}
              fetchInvoicesHome={fetchInvoicesHome}
              deleteInvoice={deleteInvoice}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default Invoices;
