import { useEffect, useState } from "react";
import { doc, updateDoc, arrayUnion, arrayRemove, Timestamp } from "firebase/firestore";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { db } from "../firebase";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Modal from "react-modal";
import Supplier from "./Supplier";
import '../styles/InvoiceItem.css';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';

const InvoiceItem = ({
  invoice,
  projects,
  deleteInvoice,
  supplierName
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false); // Toggle for payment history
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false); // State for payment modal
  const [paymentAmount, setPaymentAmount] = useState(""); // State for payment amount

  // Local copy for editing and immediate feedback
  const [invoiceData, setInvoiceData] = useState({
    supplier: invoice.supplier,
    invoiceNo: invoice.invoiceNo,
    totalSum: invoice.totalSum,
    remainingSum: invoice.remainingSum || invoice.totalSum,
    project: invoice.project,
    issueDate: invoice.issueDate instanceof Timestamp ? invoice.issueDate.toDate() : new Date(invoice.issueDate),
    paymentDate: invoice.paymentDate instanceof Timestamp ? invoice.paymentDate.toDate() : new Date(invoice.paymentDate),
    paymentHistory: invoice.paymentHistory || [],
    paid: invoice.paid,
  });

  const [supplier, setSupplier] = useState("");

  // Sync local state with the invoice prop when not editing
  useEffect(() => {
    if (!isEditing) {
      setInvoiceData({
        supplier: invoice.supplier,
        invoiceNo: invoice.invoiceNo,
        totalSum: invoice.totalSum,
        remainingSum: invoice.remainingSum || invoice.totalSum,
        project: invoice.project,
        issueDate: invoice.issueDate instanceof Timestamp ? invoice.issueDate.toDate() : new Date(invoice.issueDate),
        paymentDate: invoice.paymentDate instanceof Timestamp ? invoice.paymentDate.toDate() : new Date(invoice.paymentDate),
        paymentHistory: invoice.paymentHistory || [],
        paid: invoice.paid,
      });
    }
  }, [invoice, isEditing]);

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
      alert(`Suma introdusa depaseste suma ramasa de plata (${invoiceData.remainingSum} LEI).`);
      return;
    }
  
    const paymentEntry = {
      amount: paymentAmountFloat,
      date: Timestamp.fromDate(new Date()),
    };
  
    // Calculate the new remaining sum
    let newRemainingSum = Number(invoiceData.remainingSum) - Number(paymentAmountFloat);
    let isFullyPaid = newRemainingSum <= 0;
    if (isFullyPaid) {
      newRemainingSum = 0;
    }
  
    const invoiceRef = doc(db, "invoices", invoice.id);
    try {
      await updateDoc(invoiceRef, {
        remainingSum: newRemainingSum,
        paid: isFullyPaid,
        paymentHistory: arrayUnion(paymentEntry),
      });
  
      // Optionally update local state for immediate feedback.
      setInvoiceData((prevData) => ({
        ...prevData,
        remainingSum: newRemainingSum,
        paid: isFullyPaid,
        paymentHistory: [...prevData.paymentHistory, paymentEntry],
      }));
  
      closePaymentModal();
    } catch (error) {
      console.error("Error updating invoice status:", error);
    }
  };


  const markAsUnpaid = async (invoiceId) => {
    // const confirmPayment = window.confirm("Sunteti sigur ca vreti sa marcati ca neplatit?");
    // if (!confirmPayment) return;

    const invoiceRef = doc(db, "invoices", invoiceId);
    try {
      await updateDoc(invoiceRef, { paid: false });
    } catch (error) {
      console.error("Error updating invoice status:", error);
    }
  };

  const saveInvoiceChanges = async () => {
    const invoiceRef = doc(db, "invoices", invoice.id);
    try {
      // Compute the difference between the modified totalSum and the old totalSum
      const oldTotal = Number(invoice.totalSum);
      const newTotal = Number(invoiceData.totalSum);
      const difference = newTotal - oldTotal;
      
      // If the invoice is already paid (remaining sum is 0), keep it at 0.
      const updatedRemainingSum = invoice.paid || Number(invoice.remainingSum) === 0 
        ? 0 
        : Number(invoiceData.remainingSum) + difference;
      
      await updateDoc(invoiceRef, {
        supplier: supplier.id,
        invoiceNo: invoiceData.invoiceNo,
        totalSum: newTotal,
        remainingSum: updatedRemainingSum,
        project: invoiceData.project,
        issueDate: Timestamp.fromDate(invoiceData.issueDate),
        paymentDate: Timestamp.fromDate(invoiceData.paymentDate),
      });
      // Update local state to reflect changes immediately
      setInvoiceData((prevData) => ({
        ...prevData,
        remainingSum: updatedRemainingSum,
      }));
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  };


  const deletePayment = async (payment, invoiceId) => {
    const confirmDelete = window.confirm(
      `Sunteti sigur ca vreti sa stergeti aceasta plata de ${payment.amount} LEI?`
    );
    if (!confirmDelete) return;
  
    const newRemainingSum = Number(invoice.remainingSum) + Number(payment.amount);
    const isUnpaid = newRemainingSum > 0;
  
    const invoiceRef = doc(db, "invoices", invoiceId);
    try {
      await updateDoc(invoiceRef, {
        remainingSum: newRemainingSum,
        paid: false,
        paymentHistory: arrayRemove(payment),
      });
  
      setInvoiceData((prevData) => ({
        ...prevData,
        remainingSum: newRemainingSum,
        paid: isUnpaid,
        paymentHistory: prevData.paymentHistory.filter(
          (p) => p.date.toString() !== payment.date.toString()
        ),
      }));
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
    finally{
      markAsUnpaid(invoiceId);
    }
  };
console.log(projects)
  return (
    <li className="invoice-item" key={invoice.id}>
      {isEditing ? (
        <Card className="invoice-card editing">
          <div className="edit-header-row">
            <h4 className="edit-title">Editeaza factura</h4>
            <span className="edit-hint">Actualizeaza campurile si salveaza</span>
          </div>
          <div className="invoice-grid-edit">
            <div className="field">
              <Supplier hideLabel setSelectedSupplier={setSupplier} selectedSupplier={invoiceData.supplier} style={true} />
            </div>
            <div className="field">
              <label className="field-label">Numar factura</label>
              <input className="input" value={invoiceData.invoiceNo} onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNo: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">Total</label>
              <input className="input" type="number" value={invoiceData.totalSum} onChange={(e) => setInvoiceData({ ...invoiceData, totalSum: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">Proiect</label>
              <select className="input" value={invoiceData.project} onChange={(e) => setInvoiceData({ ...invoiceData, project: e.target.value })}>
                <option value="" disabled>Selecteaza un proiect</option>
                {projects.map((project) => (
                  <option key={project[0]} value={project[0]}>{project[1]}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Data emitere</label>
              <DatePicker selected={invoiceData.issueDate} onChange={(date) => setInvoiceData({ ...invoiceData, issueDate: date })} dateFormat="dd-MM-yyyy" />
            </div>
            <div className="field">
              <label className="field-label">Data scadenta</label>
              <DatePicker selected={invoiceData.paymentDate} onChange={(date) => setInvoiceData({ ...invoiceData, paymentDate: date })} dateFormat="dd-MM-yyyy" />
            </div>
          </div>
          <div className="actions-row">
            <Button variant="primary" onClick={saveInvoiceChanges}>Salveaza</Button>
            <Button variant="neutral" onClick={() => setIsEditing(false)}>Anuleaza</Button>
          </div>
        </Card>
      ) : (
        <Card className="invoice-card view-mode">
          <div className="invoice-header-row">
            <div className="info-block"><span className="label">Furnizor</span><span className="value supplier-text-full">{supplierName}</span></div>
            <div className="info-block"><span className="label">Numar factura</span><span className="value">{invoice.invoiceNo}</span></div>
            <div className="info-block"><span className="label">Proiect</span><span className="value">{invoice.projectName || 'N/A'}</span></div>
            {invoice.status && (
              <div className="info-block status-block">
                <span className="label">Status</span>
                <Badge variant={invoice.paid ? 'success' : invoice.status === 'Scadenta astazi' ? 'warning' : invoice.status === 'Scadenta depasita' ? 'danger' : 'info'}>
                  {invoice.paid ? 'Platit' : invoice.status}
                </Badge>
              </div>
            )}
          </div>
          <div className="invoice-metrics-row">
            <div className="metric"><span className="label">Data emitere</span><span className="value">{moment(invoiceData.issueDate).format('DD-MM-YYYY')}</span></div>
            <div className="metric"><span className="label">Total initial</span><span className="value">{invoice.totalSum} LEI</span></div>
            <div className="metric"><span className="label">Suma ramasa</span><span className="value">{invoice.remainingSum} LEI</span></div>
            <div className="metric"><span className="label">Data scadenta</span><span className="value">{moment(invoiceData.paymentDate).format('DD-MM-YYYY')}</span></div>
          </div>
          <div className="history-toggle-row">
            <Button variant="neutral" size="sm" onClick={togglePaymentHistory}>
              {isHistoryVisible ? 'Ascunde Istoric Plati' : 'Arata Istoric Plati'}
            </Button>
            {!invoice.paid && (
              <Button variant="primary" size="sm" onClick={openPaymentModal}>Am platit</Button>
            )}
            {invoice.status && deleteInvoice && (
              <div className="icon-actions">
                <EditIcon onClick={() => setIsEditing(true)} className="icon-btn" />
                <DeleteIcon onClick={() => deleteInvoice(invoice.id)} className="icon-btn" />
              </div>
            )}
          </div>
          <div className={`payment-history-wrapper ${isHistoryVisible && invoiceData.paymentHistory.length > 0 ? 'open' : ''}`}>
            {isHistoryVisible && invoiceData.paymentHistory.length > 0 && (
              <div className="payment-history">
                <div className="ph-summary-row">
                  <b className="ph-title">Istoric plati</b>
                  <div className="ph-progress">
                    {(() => {
                      const paidSoFar = invoiceData.paymentHistory.reduce((a,p)=> a + Number(p.amount),0);
                      const total = Number(invoice.totalSum) || 0;
                      const pct = total ? Math.min(100, (paidSoFar / total) * 100) : 0;
                      return (
                        <>
                          <div className="ph-bar"><span style={{width: pct + '%'}} /></div>
                          <span className="ph-paid-label">{paidSoFar.toFixed(2)} / {total.toFixed(2)} LEI</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <ul className="ph-list">
                  {invoiceData.paymentHistory
                    .slice()
                    .sort((a,b)=> b.date.toMillis() - a.date.toMillis())
                    .map((payment, index) => (
                      <li key={index} className="ph-item">
                        <div className="ph-dot" />
                        <div className="ph-meta">
                          <span className="ph-date">{moment(payment.date.toDate()).format('DD-MM-YYYY')}</span>
                          <span className="ph-amount">{payment.amount} LEI</span>
                        </div>
                        <Button variant="danger" size="xs" onClick={() => deletePayment(payment, invoice.id)}>Sterge</Button>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
          <Modal
            isOpen={isPaymentModalOpen}
            onRequestClose={closePaymentModal}
            overlayClassName="modal-overlay"
            className="app-modal"
            contentLabel="Introduceti suma platita"
          >
            <div className="modal-header">
              <h3 className="modal-title">Introduceti suma platita</h3>
              <Button variant="ghost" size="sm" onClick={closePaymentModal}>✕</Button>
            </div>
            <div className="modal-body">
              <p className="remaining-label">Suma ramasa: <b>{invoiceData.remainingSum} LEI</b></p>
              <input type="number" value={paymentAmount} onChange={handlePaymentAmountChange} placeholder="Introduceti suma" className="input" />
              <Button variant="outline" fullWidth onClick={handleFullPayment}>Plata completa ({invoiceData.remainingSum} LEI)</Button>
            </div>
            <div className="modal-footer">
              <Button variant="primary" onClick={submitPayment}>Confirma Plata</Button>
              <Button variant="danger" onClick={closePaymentModal}>Anuleaza</Button>
            </div>
          </Modal>
        </Card>
      )}
    </li>
  );
};

export default InvoiceItem;
