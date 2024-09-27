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
import Prediction from "./components/Prediction";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [invoicesHome, setInvoicesHome] = useState([]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const fetchInvoices = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "invoices"));
      const allInvoices = [];

      querySnapshot.forEach((doc) => {
        const invoice = { id: doc.id, ...doc.data() };

        // Convert paymentDate (Firestore timestamp) to a JavaScript Date object
        const paymentDate = invoice.paymentDate.toDate();

        // Determine the payment status based on the current date
        const paymentStatus = moment(paymentDate).isBefore(moment(), "day")
          ? "Scadenta depasita"
          : moment(paymentDate).isSame(moment(), "day")
          ? "Scadenta astazi"
          : "In termen";

        // Add invoice with status to the array
        allInvoices.push({ ...invoice, status: paymentStatus });
      });

      // Set the invoices state with the fetched and updated invoices
      setInvoices(allInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const fetchInvoicesHome = async () => {
    // Get today's date as a JavaScript Date object (end of day)
    const today = moment().endOf("day").toDate();

    // Query 1: Fetch unpaid invoices due today
    const todayQuery = query(
      collection(db, "invoices"),
      where("paymentDate", "==", today), // Compare using Date object
      where("paid", "==", false) // Fetch unpaid invoices
    );

    // Query 2: Fetch unpaid invoices with paymentDate before today
    const pastDueQuery = query(
      collection(db, "invoices"),
      where("paymentDate", "<", today), // Compare using Date object
      where("paid", "==", false) // Fetch unpaid invoices
    );

    try {
      // Run both queries in parallel
      const [todaySnapshot, pastDueSnapshot] = await Promise.all([
        getDocs(todayQuery),
        getDocs(pastDueQuery),
      ]);

      // Combine results from both queries
      const invoicesDue = [];

      todaySnapshot.forEach((doc) => {
        invoicesDue.push({ id: doc.id, ...doc.data() });
      });

      pastDueSnapshot.forEach((doc) => {
        invoicesDue.push({ id: doc.id, ...doc.data() });
      });

      // Set the combined invoices in state
      setInvoicesHome(invoicesDue);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
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
              element={
                <Invoices invoices={invoices} fetchInvoices={fetchInvoices} fetchInvoicesHome={fetchInvoicesHome}/>
              }
            />
            <Route path="/prediction" element={<Prediction />} />
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
