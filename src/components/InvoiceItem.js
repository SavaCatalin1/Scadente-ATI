import { useState } from "react";
import { doc, updateDoc, arrayUnion, arrayRemove, Timestamp } from "firebase/firestore";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { db } from "../firebase";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import Modal from "react-modal";
import Supplier from "./Supplier";
import '../styles/InvoiceItem.css'

const InvoiceItem = ({
  invoice,
  projects,
  fetchInvoices,
  fetchInvoicesHome,
  fetchPredictedInvoices,
  deleteInvoice,
  supplierName,
  fetchInvoicesForProject,
  selectedProject
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false); // Toggle for payment history
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false); // State for payment modal
  const [paymentAmount, setPaymentAmount] = useState(""); // State for payment amount
  const [invoiceData, setInvoiceData] = useState({
    supplier: invoice.supplier,
    invoiceNo: invoice.invoiceNo,
    totalSum: invoice.totalSum,
    remainingSum: invoice.remainingSum || invoice.totalSum, // Use totalSum if remainingSum is not set
    project: invoice.project,
    issueDate: invoice.issueDate instanceof Timestamp ? invoice.issueDate.toDate() : new Date(invoice.issueDate),
    paymentDate: invoice.paymentDate instanceof Timestamp ? invoice.paymentDate.toDate() : new Date(invoice.paymentDate),
    paymentHistory: invoice.paymentHistory || [], // Payment history array
  });

  const [supplier, setSupplier] = useState("");

  const togglePaymentHistory = () => {
    setIsHistoryVisible(!isHistoryVisible); // Toggle payment history visibility
  };

  const handlePaymentAmountChange = (e) => {
    setPaymentAmount(e.target.value);
  };

  const openPaymentModal = () => {
    setPaymentAmount(""); // Reset payment amount
    setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
  };

  const handleFullPayment = () => {
    setPaymentAmount(invoiceData.remainingSum); // Set payment amount to full remaining sum
  };

  const submitPayment = async () => {
    const paymentAmountFloat = parseFloat(paymentAmount);
  
    if (isNaN(paymentAmountFloat) || paymentAmountFloat <= 0) {
      alert("Suma introdusa nu este valida.");
      return;
    }
  
    if (paymentAmountFloat > invoiceData.remainingSum) {
      alert(
        `Suma introdusa depaseste suma ramasa de plata (${invoiceData.remainingSum} LEI).`
      );
      return;
    }
  
    const paymentEntry = {
      amount: paymentAmountFloat,
      date: Timestamp.fromDate(new Date()), // Use Firestore Timestamp for consistency
    };
  
    // Calculate the new remaining sum
    let newRemainingSum = Number(invoiceData.remainingSum) - Number(paymentAmountFloat);
    const isFullyPaid = newRemainingSum <= 0;
  
    // Ensure remainingSum is exactly 0 if fully paid
    if (isFullyPaid) {
      newRemainingSum = 0;
    }
  
    const invoiceRef = doc(db, "invoices", invoice.id);
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
  
      if (fetchInvoices) fetchInvoices();
      if (fetchInvoicesHome) fetchInvoicesHome();
      if (fetchPredictedInvoices) fetchPredictedInvoices();
      if (fetchInvoicesForProject) fetchInvoicesForProject(selectedProject);
      closePaymentModal(); // Close the modal after submission
    } catch (error) {
      console.error("Error updating invoice status:", error);
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

  const saveInvoiceChanges = async () => {
    const invoiceRef = doc(db, "invoices", invoice.id);
    try {
      await updateDoc(invoiceRef, {
        supplier: supplier.id,
        invoiceNo: invoiceData.invoiceNo,
        totalSum: invoiceData.totalSum,
        remainingSum: invoiceData.remainingSum,
        project: invoiceData.project,
        issueDate: Timestamp.fromDate(invoiceData.issueDate),
        paymentDate: Timestamp.fromDate(invoiceData.paymentDate),
      });
      setIsEditing(false);
      fetchInvoices();
      fetchInvoicesHome();
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  };

  const deletePayment = async (payment, invoiceId) => {
    const confirmDelete = window.confirm(
      `Sunteti sigur ca vreti sa stergeti aceasta plata de ${payment.amount} LEI?`
    );
    if (!confirmDelete) return;
  
    // Calculate the new remaining sum after deleting the payment
    const newRemainingSum = Number(invoiceData.remainingSum) + Number(payment.amount);
    const isUnpaid = newRemainingSum > 0; // Mark as unpaid if remaining sum is greater than 0
  
    const invoiceRef = doc(db, "invoices", invoiceId);
    try {
      // Update the invoice in Firestore to remove the payment and adjust remaining sum
      await updateDoc(invoiceRef, {
        remainingSum: newRemainingSum,
        paid: false, // Always mark as unpaid when a payment is deleted
        paymentHistory: arrayRemove(payment), // Remove the payment from history
      });
  
      // Update local state
      setInvoiceData((prevData) => ({
        ...prevData,
        remainingSum: newRemainingSum,
        paid: isUnpaid, // Update local state to reflect unpaid status
        paymentHistory: prevData.paymentHistory.filter(
          (p) => p.date.toString() !== payment.date.toString()
        ), // Remove payment locally
      }));
  
      if (fetchInvoices) fetchInvoices();
      if (fetchInvoicesHome) fetchInvoicesHome();
      if (fetchPredictedInvoices) fetchPredictedInvoices();
      if (fetchInvoicesForProject) fetchInvoicesForProject(selectedProject);
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
  };

  return (
    <li className="invoice-item" key={invoice.id}>
      {isEditing ? (
        <>
          {/* Edit Mode */}
          <div className="invitm-div">
            <Supplier setSelectedSupplier={setSupplier} selectedSupplier={invoiceData.supplier}/>

            <label>
              <b>Numar factura:</b>
              <input
                value={invoiceData.invoiceNo}
                onChange={(e) =>
                  setInvoiceData({ ...invoiceData, invoiceNo: e.target.value })
                }
              />
            </label>

            <label>
              <b>Total:</b>
              <input
                type="number"
                value={invoiceData.totalSum}
                onChange={(e) =>
                  setInvoiceData({ ...invoiceData, totalSum: e.target.value })
                }
              />
            </label>

            <label>
              <b>Proiect:</b>
              <select
                value={invoiceData.project}
                onChange={(e) =>
                  setInvoiceData({ ...invoiceData, project: e.target.value })
                }
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
                onChange={(date) =>
                  setInvoiceData({ ...invoiceData, issueDate: date })
                }
                dateFormat="dd-MM-yyyy"
              />
            </label>

            <label>
              <b>Data scadenta:</b>
              <DatePicker
                selected={invoiceData.paymentDate}
                onChange={(date) =>
                  setInvoiceData({ ...invoiceData, paymentDate: date })
                }
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
              <b>Furnizor:</b> {supplierName}
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
              {moment(invoiceData.issueDate).format("DD-MM-YYYY")}
            </span>
            <span className="view">
              <b>Total initial:</b> {invoice.totalSum} LEI
            </span>
            <span className="view">
              <b>Suma ramasa:</b> {invoice.remainingSum} LEI
            </span>
            <span className="view">
              <b>Data scadenta:</b>{" "}
              {moment(invoiceData.paymentDate).format("DD-MM-YYYY")}
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
                    {moment(payment.date.toDate()).format("DD-MM-YYYY")}:{" "}
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
                className={`status ${invoice.paid
                  ? "platit"
                  : invoice.status.replace(/\s+/g, "-").toLowerCase()
                  }`}
              >
                <b>Status:</b> {invoice.paid ? "Platit" : invoice.status}
              </span>
            )}

            <div className="tools invitm-div">
              {!invoice.paid && (
                <div className="paid-button" onClick={openPaymentModal}>
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

          {/* Modal for Payment */}
          <Modal
            isOpen={isPaymentModalOpen}
            onRequestClose={closePaymentModal}
            className="payment-modal"
            contentLabel="Introduceti suma platita"
          >
            <h3>Introduceti suma platita</h3>
            <p>
              Suma ramasa: <b>{invoiceData.remainingSum} LEI</b>
            </p>
            <input
              type="number"
              value={paymentAmount}
              onChange={handlePaymentAmountChange}
              placeholder="Introduceti suma"
              className="modal-input"
            />
            <button onClick={handleFullPayment} className="modal-auto-complete">
              Plata completa ({invoiceData.remainingSum} LEI)
            </button>
            <div className="modal-actions">
              <button onClick={submitPayment} className="modal-submit2">
                Confirma Plata
              </button>
              <button onClick={closePaymentModal} className="modal-close">
                Anuleaza
              </button>
            </div>
          </Modal>
        </>
      )}
    </li>
  );
};

export default InvoiceItem;
