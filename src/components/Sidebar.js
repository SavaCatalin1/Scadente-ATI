// src/components/Sidebar.js
import React from "react";
import { Link } from "react-router-dom";
import "../styles/Sidebar.css";
import logo from "../static/ATI_LOGO.png";

function Sidebar({ openModal }) {
  return (
    <div className="sidebar">
      <div>
        <img src={logo} alt="ATI Logo" className="sidebar-logo" />
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <Link to="/" className="sidebar-link">
              Acasa
            </Link>
          </li>
          <li className="sidebar-item">
            <Link to="/prediction" className="sidebar-link">
              Predictie
            </Link>
          </li>
          <li className="sidebar-item">
            <Link to="/projects" className="sidebar-link">
              Proiecte
            </Link>
          </li>
          <li className="sidebar-item">
            <Link to="/invoices" className="sidebar-link">
              Toate facturile
            </Link>
          </li>
        </ul>
      </div>
      <div className="sidebar-item">
        <button onClick={openModal} className="sidebar-button add">
          Adauga factura
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
