import { useState } from "react";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { db } from "../firebase";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import "react-datepicker/dist/react-datepicker.css";

const InvoiceItem = ({
  invoice,
  projects,
  fetchProjects,
  fetchInvoices,
  fetchInvoicesHome,
  fetchPredictedInvoices,
  deleteInvoice,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false); // Toggle for payment history
  const [invoiceData, setInvoiceData] = useState({
    supplier: invoice.supplier,
    invoiceNo: invoice.invoiceNo,
    totalSum: invoice.totalSum,
    remainingSum: invoice.remainingSum || invoice.totalSum, // Use totalSum if remainingSum is not set
    project: invoice.project,
    issueDate: invoice.issueDate.toDate(),
    paymentDate: invoice.paymentDate.toDate(),
    paymentHistory: invoice.paymentHistory || [], // Payment history array
  });

  const togglePaymentHistory = () => {
    setIsHistoryVisible(!isHistoryVisible); // Toggle payment history visibility
  };

  const markAsPaid = async (invoiceId) => {
    const paymentAmount = parseFloat(
      window.prompt(
        `Introduceti suma pe care doriti sa o platiti (din ${invoiceData.remainingSum} LEI):`
      )
    );

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert("Suma introdusa nu este valida.");
      return;
    }

    if (paymentAmount > invoiceData.remainingSum) {
      alert(
        `Suma introdusa depaseste suma ramasa de plata (${invoiceData.remainingSum} LEI).`
      );
      return;
    }

    const paymentEntry = {
      amount: paymentAmount,
      date: new Date(),
    };

    const newRemainingSum = invoiceData.remainingSum - paymentAmount;
    const isFullyPaid = newRemainingSum === 0;

    const invoiceRef = doc(db, "invoices", invoiceId);
    try {
      // Update the invoice in Firestore
      await updateDoc(invoiceRef, {
        remainingSum: newRemainingSum,
        paid: isFullyPaid, // Mark as fully paid if remainingSum is 0
        paymentHistory: arrayUnion(paymentEntry), // Append the new payment entry
      });

      // Update local state
      setInvoiceData((prevData) => ({
        ...prevData,
        remainingSum: newRemainingSum,
        paid: isFullyPaid,
        paymentHistory: [...prevData.paymentHistory, paymentEntry], // Update history locally
      }));

      fetchInvoices();
      fetchInvoicesHome();
      if (fetchPredictedInvoices) fetchPredictedInvoices();
    } catch (error) {
      console.error("Error updating invoice status:", error);
    }
  };

  // Delete Payment Logic
  const deletePayment = async (payment, invoiceId) => {
    const confirmDelete = window.confirm(
      `Sunteti sigur ca vreti sa stergeti aceasta plata de ${payment.amount} LEI?`
    );
    if (!confirmDelete) return;

    const newRemainingSum = invoiceData.remainingSum + payment.amount;

    const invoiceRef = doc(db, "invoices", invoiceId);
    try {
      // Update the invoice in Firestore to remove the payment and adjust remaining sum
      await updateDoc(invoiceRef, {
        remainingSum: newRemainingSum,
        paid: false, // If any payment is deleted, mark as unpaid
        paymentHistory: arrayRemove(payment), // Remove the payment from history
      });

      // Update local state
      setInvoiceData((prevData) => ({
        ...prevData,
        remainingSum: newRemainingSum,
        paid: false,
        paymentHistory: prevData.paymentHistory.filter(
          (p) => p.date !== payment.date
        ), // Remove payment locally
      }));

      fetchInvoices();
      fetchInvoicesHome();
      if (fetchPredictedInvoices) fetchPredictedInvoices();
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
  };

  const markAsUnpaid = async (invoiceId) => {
    const confirmPayment = window.confirm(
      "Sunteti sigur ca vreti sa marcati ca neplatit?"
    );
    if (!confirmPayment) return;

    const invoiceRef = doc(db, "invoices", invoiceId);
    try {
      await updateDoc(invoiceRef, { paid: false });
      fetchInvoices();
      fetchInvoicesHome();
      if (fetchPredictedInvoices) fetchPredictedInvoices();
    } catch (error) {
      console.error("Error updating invoice status:", error);
    }
  };

  const handleFieldChange = (field, value) => {
    setInvoiceData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const saveInvoiceChanges = async () => {
    const invoiceRef = doc(db, "invoices", invoice.id);
    try {
      await updateDoc(invoiceRef, {
        supplier: invoiceData.supplier,
        invoiceNo: invoiceData.invoiceNo,
        totalSum: invoiceData.totalSum,
        remainingSum: invoiceData.remainingSum,
        project: invoiceData.project,
        issueDate: invoiceData.issueDate,
        paymentDate: invoiceData.paymentDate,
      });
      setIsEditing(false);
      fetchInvoices();
      fetchInvoicesHome();
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  };

  return (
    <li className="invoice-item" key={invoice.id}>
      {isEditing ? (
        <>
          {/* Edit Mode */}
          <div className="invitm-div">
            <label>
              <b>Furnizor:</b>
              <input
                value={invoiceData.supplier}
                onChange={(e) => handleFieldChange("supplier", e.target.value)}
              />
            </label>

            <label>
              <b>Numar factura:</b>
              <input
                value={invoiceData.invoiceNo}
                onChange={(e) => handleFieldChange("invoiceNo", e.target.value)}
              />
            </label>

            <label>
              <b>Total:</b>
              <input
                type="number"
                value={invoiceData.totalSum}
                onChange={(e) => handleFieldChange("totalSum", e.target.value)}
              />
            </label>

            <label>
              <b>Proiect:</b>
              <select
                value={invoiceData.project}
                onChange={(e) => handleFieldChange("project", e.target.value)}
              >
                <option value="" disabled>
                  Selecteaza un proiect
                </option>
                {projects.map((project) => (
                  <option key={project[0]} value={project[0]}>
                    {project[1]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="invitm-div">
            <label>
              <b>Data emitere:</b>
              <DatePicker
                selected={invoiceData.issueDate}
                onChange={(date) => handleFieldChange("issueDate", date)}
                dateFormat="dd-MM-yyyy"
              />
            </label>

            <label>
              <b>Data scadenta:</b>
              <DatePicker
                selected={invoiceData.paymentDate}
                onChange={(date) => handleFieldChange("paymentDate", date)}
                dateFormat="dd-MM-yyyy"
              />
            </label>
          </div>

          <button onClick={saveInvoiceChanges} className="save-button mr">
            Salveaza
          </button>
          <button onClick={() => setIsEditing(false)} className="save-button">
            Anuleaza
          </button>
        </>
      ) : (
        <>
          {/* View Mode */}
          <div className="invitm-div">
            <span className="view">
              <b>Furnizor:</b> {invoice.supplier}
            </span>
            <span className="view">
              <b>Numar factura:</b> {invoice.invoiceNo}
            </span>
            <span className="view">
              <b>Proiect:</b> {invoice.projectName || "N/A"}
            </span>
          </div>
          <div className="invitm-div">
            <span className="view">
              <b>Data emitere:</b>{" "}
              {moment(invoice.issueDate.toDate()).format("DD-MM-YYYY")}
            </span>
            <span className="view">
              <b>Total initial:</b> {invoice.totalSum} LEI
            </span>
            <span className="view">
              <b>Suma ramasa:</b> {invoiceData.remainingSum} LEI
            </span>
            <span className="view">
              <b>Data scadenta:</b>{" "}
              {moment(invoice.paymentDate.toDate()).format("DD-MM-YYYY")}
            </span>
          </div>

          <div className="payment-history-toggle">
            <button onClick={togglePaymentHistory}>
              {isHistoryVisible
                ? "Ascunde Istoric Plati"
                : "Arata Istoric Plati"}
            </button>
          </div>

          {isHistoryVisible && invoiceData.paymentHistory.length > 0 && (
            <div className="payment-history">
              <b>Istoric plati:</b>
              <ul>
                {invoiceData.paymentHistory.map((payment, index) => (
                  <li key={index}>
                    {moment(payment.date).format("DD-MM-YYYY")}:{" "}
                    <span className="payment-amount">{payment.amount} LEI</span>
                    <button
                      className="delete-payment-btn"
                      onClick={() => deletePayment(payment, invoice.id)}
                    >
                      Sterge
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="delete-flex invitm-div">
            {invoice.status && (
              <span
                className={`status ${
                  invoice.paid
                    ? "platit"
                    : invoice.status.replace(/\s+/g, "-").toLowerCase()
                }`}
              >
                <b>Status:</b> {invoice.paid ? "Platit" : invoice.status}
              </span>
            )}

            <div className="tools invitm-div">
              {!invoice.paid && (
                <div
                  className="paid-button"
                  onClick={() => markAsPaid(invoice.id)}
                >
                  Am platit
                </div>
              )}
              {invoice.status && deleteInvoice && (
                <div className="invitm-div">
                  <EditIcon
                    onClick={() => setIsEditing(true)}
                    className="pointer"
                  />
                  {invoice.paid && (
                    <HistoryIcon
                      onClick={() => markAsUnpaid(invoice.id)}
                      className="pointer"
                    />
                  )}
                  <DeleteIcon
                    onClick={() => deleteInvoice(invoice.id)}
                    className="pointer"
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </li>
  );
};

export default InvoiceItem;
