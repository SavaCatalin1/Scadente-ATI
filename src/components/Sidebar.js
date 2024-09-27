// src/components/Sidebar.js
import React from "react";
import { Link } from "react-router-dom";
import "../styles/Sidebar.css";
import logo from "../static/ATI_LOGO.png";

function Sidebar({ openModal }) {
  return (
    <div className="sidebar">
      <img src={logo} alt="ATI Logo" className="sidebar-logo" />
      <ul className="sidebar-menu">
        <li className="sidebar-item">
          <Link to="/" className="sidebar-link">
            Acasa
          </Link>
        </li>
        <li className="sidebar-item">
          <Link to="/invoices" className="sidebar-link">
            Toate facturile
          </Link>
        </li>
        <li className="sidebar-item">
          <button onClick={openModal} className="sidebar-button">
            Adauga factura
          </button>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
