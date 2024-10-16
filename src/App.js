import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Homepage from "./components/Homepage";
import "./App.css";
import Invoices from "./components/Invoices";
import AddInvoice from "./components/AddInvoice";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import moment from "moment";
import { db } from "./firebase";
import Prediction from "./components/Prediction";
import Notfound from "./components/Notfound";
import Projects from "./components/Projects";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [invoicesHome, setInvoicesHome] = useState([]);
  const [projects, setProjects] = useState({}); // Store projects as a map
  const [projectsLoaded, setProjectsLoaded] = useState(false); // Flag to track if projects have been fetched
  const [suppliers, setSuppliers] = useState({});
  const [loading, setLoading] = useState(true);

  const [isFirebaseQuotaExceeded, setIsFirebaseQuotaExceeded] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Fetch all projects and store them as a map
  const fetchProjects = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "projects"));
      const projectsMap = {};
      querySnapshot.forEach((doc) => {
        projectsMap[doc.id] = doc.data().name; // Map project ID to project name
      });
      setProjects(projectsMap); // Set the projects in state
      setProjectsLoaded(true); // Indicate that projects have been fetched
    } catch (error) {
      if (error.code === "resource-exhausted") {
        setIsFirebaseQuotaExceeded(true);
        console.log("yes")
      } else {
        console.error("Firebase error:", error);
      }
    }
  };

  // Fetch all invoices and link projects
  const fetchInvoices = async () => {
    if (!projectsLoaded) return; // Ensure projects are loaded before fetching invoices

    try {
      const querySnapshot = await getDocs(collection(db, "invoices"));
      const allInvoices = [];

      querySnapshot.forEach((doc) => {
        const invoice = { id: doc.id, ...doc.data() };
        const paymentDate = invoice.paymentDate.toDate();

        // Determine the payment status based on the current date
        const paymentStatus = moment(paymentDate).isBefore(moment(), "day")
          ? "Scadenta depasita"
          : moment(paymentDate).isSame(moment(), "day")
            ? "Scadenta astazi"
            : "In termen";

        // Link project name to the invoice
        const projectName = projects[invoice.project] || "N/A"; // Fetch project name by project ID

        // Add invoice with status and linked project name
        allInvoices.push({ ...invoice, status: paymentStatus, projectName });
      });

      // Set the invoices state with the fetched and updated invoices
      setInvoices(allInvoices);
    } catch (error) {
      if (error.code === "resource-exhausted") {
        setIsFirebaseQuotaExceeded(true);
        console.log("yes")
      } else {
        console.error("Firebase error:", error);
      }
    }
  };

  const fetchInvoicesHome = async () => {
    if (!projectsLoaded) return; // Ensure projects are loaded before fetching invoices

    const today = moment().endOf("day").toDate();

    const todayQuery = query(
      collection(db, "invoices"),
      where("paymentDate", "==", today),
      where("paid", "==", false)
    );

    const pastDueQuery = query(
      collection(db, "invoices"),
      where("paymentDate", "<", today),
      where("paid", "==", false)
    );

    try {
      const [todaySnapshot, pastDueSnapshot] = await Promise.all([
        getDocs(todayQuery),
        getDocs(pastDueQuery),
      ]);

      const invoicesDue = [];

      todaySnapshot.forEach((doc) => {
        const invoice = { id: doc.id, ...doc.data() };
        const projectName = projects[invoice.project] || "N/A"; // Link project name
        invoicesDue.push({ ...invoice, projectName });
      });

      pastDueSnapshot.forEach((doc) => {
        const invoice = { id: doc.id, ...doc.data() };
        const projectName = projects[invoice.project] || "N/A"; // Link project name
        invoicesDue.push({ ...invoice, projectName });
      });

      setInvoicesHome(invoicesDue);
    } catch (error) {
      if (error.code === "resource-exhausted") {
        setIsFirebaseQuotaExceeded(true);
        console.log("yes")
      } else {
        console.error("Firebase error:", error);
      }
    }
  };

  // Fetch projects first, then fetch invoices once projects are loaded
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch invoices after projects have been loaded
  useEffect(() => {
    if (projectsLoaded) {
      fetchInvoices();
      fetchInvoicesHome();
    }
  }, [projectsLoaded]); // Trigger when projects are loaded

  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true);
      const supplierData = {};
      const supplierPromises = invoices.map(async (invoice) => {
        if (invoice.supplier && !supplierData[invoice.supplier]) {
          const supplierDoc = await getDoc(doc(db, "suppliers", invoice.supplier));
          if (supplierDoc.exists()) {
            supplierData[invoice.supplier] = supplierDoc.data().name;
          } else {
            supplierData[invoice.supplier] = "Unknown Supplier";
          }
        }
      });

      await Promise.all(supplierPromises);
      setSuppliers(supplierData);
      setLoading(false);
    };

    fetchSuppliers();
  }, [invoices]);

  if (isFirebaseQuotaExceeded) {
    return (
      <div className="app-closed-container">
        <div className="app-closed-message">
          <h1>Serviciu indisponibil momentan</h1>
          <p>
            Din cauza traficului ridicat, serviciul este inchis temporar.
          </p>
          <p>Traficul se reseteaza la ora 10:00 AM zilnic.</p>
        </div>
      </div>
    )
  }

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
                  fetchInvoicesHome={fetchInvoicesHome}
                  suppliers={suppliers}
                  loading={loading}
                />
              }
            />
            <Route
              path="/invoices"
              element={
                <Invoices
                  projects={Object.entries(projects)}
                  fetchProjects={fetchProjects}
                  invoices={invoices}
                  fetchInvoices={fetchInvoices}
                  fetchInvoicesHome={fetchInvoicesHome}
                  suppliers={suppliers}
                  loading={loading}
                />
              }
            />
            <Route
              path="/prediction"
              element={
                <Prediction
                  projects={projects}
                  fetchProjects={fetchProjects}
                  fetchInvoices={fetchInvoices}
                  fetchInvoicesHome={fetchInvoicesHome}
                  suppliers={suppliers}
                  loading={loading}
                />
              }
            />
            <Route
              path="/projects"
              element={
                <Projects
                  projects={Object.entries(projects)}
                  fetchProjects={fetchProjects}
                  suppliers={suppliers}
                  loading={loading}
                />
              }
            />
            <Route path="*" element={<Notfound />} />
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
