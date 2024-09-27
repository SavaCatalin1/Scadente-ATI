// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Homepage from "./components/Homepage";
import "./App.css";
import Invoices from "./components/Invoices";
import AddInvoice from "./components/AddInvoice";
import { collection, getDocs, query, where } from "firebase/firestore";
import moment from "moment";
import { db } from "./firebase";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [invoicesHome, setInvoicesHome] = useState([]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const fetchInvoices = async () => {
    const querySnapshot = await getDocs(collection(db, "invoices"));
    const allInvoices = [];
    querySnapshot.forEach((doc) => {
      const invoice = { id: doc.id, ...doc.data() };
      const paymentStatus = moment(invoice.paymentDate, "DD-MM-YYYY").isBefore(
        moment(),
        "day"
      )
        ? "Scadenta depasita"
        : moment(invoice.paymentDate, "DD-MM-YYYY").isSame(moment(), "day")
        ? "Scadenta astazi"
        : "In termen";

      allInvoices.push({ ...invoice, status: paymentStatus });
    });
    setInvoices(allInvoices);
  };

  console.log(invoices);

  const fetchInvoicesHome = async () => {
    const today = moment().format("DD-MM-YYYY");
    const q = query(
      collection(db, "invoices"),
      where("paymentDate", "==", today),
      where("paid", "==", false) // Only fetch unpaid invoices
    );
    const querySnapshot = await getDocs(q);
    const invoicesDue = [];
    querySnapshot.forEach((doc) => {
      invoicesDue.push({ id: doc.id, ...doc.data() });
    });
    setInvoicesHome(invoicesDue);
  };

  useEffect(() => {
    fetchInvoices();
    fetchInvoicesHome();
  }, []);

  useEffect(() => {
    console.log(invoices);
  }, [invoices]);

  return (
    <Router>
      <div className="app-container">
        <Sidebar openModal={openModal} />
        <div className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <Homepage
                  invoices={invoicesHome}
                  setInvoices={setInvoicesHome}
                  fetchInvoices={fetchInvoices}
                />
              }
            />
            <Route
              path="/invoices"
              element={<Invoices invoices={invoices} />}
            />
          </Routes>
        </div>
        <AddInvoice
          isOpen={isModalOpen}
          closeModal={closeModal}
          fetchInvoices={fetchInvoices}
          fetchInvoicesHome={fetchInvoicesHome}
        />
      </div>
    </Router>
  );
}

export default App;
