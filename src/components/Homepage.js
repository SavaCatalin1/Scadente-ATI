import React from "react";
import "../styles/Homepage.css";
import InvoiceItem from "./InvoiceItem";
import Card from './ui/Card';
import Badge from './ui/Badge';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AlarmOnIcon from '@mui/icons-material/AlarmOn';
import PaymentsIcon from '@mui/icons-material/Payments';
import ViewListIcon from '@mui/icons-material/ViewList';

function Homepage({ invoices, suppliers, loading }) {
  const totalSum = invoices.reduce(
    (acc, invoice) => acc + Number(invoice.remainingSum),
    0
  );

  // replaced "Platite" stat with total facturi; keep overdue & dueToday
  const overdueCount = invoices.filter(i => (i.status || '').toLowerCase().includes('depasita')).length;
  const dueToday = invoices.filter(i => (i.status || '').toLowerCase().includes('astazi')).length;
  const actionNeeded = overdueCount + dueToday;

  return (
    <div className="homepage-wrapper">
      <div className="hp-hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-left">
            <h1 className="hero-title">Facturi scadente</h1>
            <p className="hero-sub">Monitorizare centralizata a scadentelor de azi</p>
            <div className="hero-tags">
              <span className="tag-pill">Real-time</span>
              <span className="tag-pill">Status Tracking</span>
            </div>
          </div>
          <div className="stats-grid-hero">
            <div className="stat glass">
              <div className="icon-wrap accent"><PaymentsIcon /></div>
              <div className="stat-meta">
                <span className="s-label">De plata</span>
                <span className="s-value">{totalSum.toFixed(2)} LEI</span>
              </div>
            </div>
            <div className="stat glass">
              <div className="icon-wrap warn"><AlarmOnIcon /></div>
              <div className="stat-meta">
                <span className="s-label">Azi</span>
                <span className="s-value">{dueToday}</span>
              </div>
            </div>
            <div className="stat glass">
              <div className="icon-wrap danger"><TrendingUpIcon /></div>
              <div className="stat-meta">
                <span className="s-label">Depasite</span>
                <span className="s-value">{overdueCount}</span>
              </div>
            </div>
            <div className="stat glass">
              <div className="icon-wrap success"><ViewListIcon /></div>
              <div className="stat-meta">
                <span className="s-label">Total facturi</span>
                <span className="s-value">{invoices.length}</span>
              </div>
            </div>
          </div>
        </div>
        <div className={`hero-status-ribbon ${actionNeeded === 0 ? 'good' : 'warn'}`}>
          {actionNeeded === 0 ? 'Totul este in regula — nicio actiune urgenta' : `${actionNeeded} facturi necesita atentie`}
        </div>
      </div>

      <div className="hp-section">
        <div className="section-header">
          <h2 className="section-title">Lista facturi de astazi</h2>
        </div>
        <Card className="invoices-card-list elevated">
          {invoices.length === 0 ? (
            <div className="empty-state deluxe">
              <Badge variant="success">Zero scadente astazi</Badge>
              <p className="empty-text">Toate platile sunt in grafic. Verifica mai tarziu sau adauga noi facturi.</p>
            </div>
          ) : (
            <ul className="invoice-list modern">
              {loading ? (
                <p>Loading suppliers...</p>
              ) : (
                invoices.map((invoice) => (
                  <InvoiceItem
                    key={invoice.id}
                    invoice={invoice}
                    supplierName={suppliers[invoice.supplier] || 'Unknown Supplier'}
                  />
                ))
              )}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

export default Homepage;
