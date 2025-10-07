import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import "../styles/Prediction.css";
import InvoiceItem from "./InvoiceItem";
import Card from "./ui/Card";
import Button from "./ui/Button";

function Prediction({ projects = {}, invoices = [], suppliers = {}, loading }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [predictedInvoices, setPredictedInvoices] = useState([]);
  const [totalSum, setTotalSum] = useState(0);

  const fetchPredictedInvoices = () => {
    if (!selectedDate) return;

    const endOfDay = moment(selectedDate).endOf("day").toDate();

    const filtered = invoices.filter((inv) => {
      const paymentDate =
        inv.paymentDate instanceof Date ? inv.paymentDate : new Date(inv.paymentDate);
      return (
        (moment(paymentDate).isBefore(endOfDay, "minute") ||
          moment(paymentDate).isSame(endOfDay, "day")) && !inv.paid
      );
    });

    const projectArray = Object.entries(projects);
    const withProjectNames = filtered.map((inv) => {
      const projectName = projectArray.find(([id]) => id === inv.project)?.[1] || "N/A";
      return { ...inv, projectName };
    });

    const sum = withProjectNames.reduce((acc, curr) => acc + Number(curr.totalSum || 0), 0);
    setPredictedInvoices(withProjectNames);
    setTotalSum(sum);
  };

  const unpaidCount = predictedInvoices.filter((i) => !i.paid).length; // should equal length, but future‑proof

  return (
    <div className="page-content prediction-modern">
      <div className="prediction-header card">
        <div className="ph-head-top">
          <h1 className="ds-page-title">Cheltuieli previzionate</h1>
          <div className="pred-stats">
            <div className="pred-chip">
              <span className="chip-label">Facturi</span>
              <span className="chip-value">{predictedInvoices.length}</span>
            </div>
            <div className="pred-chip warn">
              <span className="chip-label">Neplatite</span>
              <span className="chip-value">{unpaidCount}</span>
            </div>
            <div className="pred-chip amount">
              <span className="chip-label">Total</span>
              <span className="chip-value">{totalSum.toFixed(2)} LEI</span>
            </div>
          </div>
        </div>
        <div className="pred-controls">
          <div className="control-group">
            <label className="control-label">Data referinta</label>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="dd-MM-yyyy"
              className="input date-picker"
              placeholderText="Alege data"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={fetchPredictedInvoices}
            disabled={!selectedDate}
          >
            Calculeaza
          </Button>
        </div>
        {predictedInvoices.length > 0 && (
          <div className="pred-summary-date">
            Total pentru <b>{moment(selectedDate).format("DD-MM-YYYY")}</b>
          </div>
        )}
      </div>

      <Card className="prediction-list-card">
        {predictedInvoices.length === 0 ? (
          <p className="empty-note">Nu sunt facturi scadente la data selectata.</p>
        ) : (
          <ul className="invoice-list modern">
            {loading ? (
              <p>Loading suppliers...</p>
            ) : (
              predictedInvoices.map((inv) => (
                <InvoiceItem
                  key={inv.id}
                  invoice={inv}
                  supplierName={suppliers[inv.supplier] || "Unknown Supplier"}
                />
              ))
            )}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default Prediction;
