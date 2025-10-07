// src/components/Sidebar.js
import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/Sidebar.css";
import logo from "../static/ATI_LOGO.png";
import { ToggleTheme } from './ui/ToggleTheme';
import Button from './ui/Button';

function Sidebar({ openModal }) {
  const links = [
    { to: '/', label: 'Scadente' },
    { to: '/prediction', label: 'Predictie' },
    { to: '/projects', label: 'Proiecte' },
    { to: '/invoices', label: 'Toate facturile' }
  ];

  return (
    <aside className="sidebar-modern redesigned">
      <div className="sidebar-inner">
        <div className="sb-brand-block">
          <div className="logo-wrap">
            <img src={logo} alt="ATI Logo" className="sidebar-logo-large" />
          </div>
            <div className="brand-meta">
              <h1 className="brand-title">ATI</h1>
              <div className="brand-sub">Scadente & Proiecte</div>
            </div>
        </div>
        <nav className="nav-group rich">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-bullet" />
              <span className="nav-label">{l.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-cta">
          <Button variant="primary" onClick={openModal} className="add-invoice-btn" size="sm">+ Adauga Factura</Button>
        </div>
        <div className="sidebar-footer">
          <ToggleTheme />
          <div className="copyright">© {new Date().getFullYear()} ATI</div>
        </div>
      </div>
      <div className="sidebar-glow" aria-hidden="true" />
    </aside>
  );
}

export default Sidebar;
