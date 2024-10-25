import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Homepage from "./components/Homepage";
import "./App.css";
import Invoices from "./components/Invoices";
import AddInvoice from "./components/AddInvoice";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import moment from "moment";
import { db } from "./firebase";
import Prediction from "./components/Prediction";
import Notfound from "./components/Notfound";
import Projects from "./components/Projects";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoices, setInvoices] = useState([]);  // All invoices stored once
  const [projects, setProjects] = useState({});  // Store projects as a map
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [suppliers, setSuppliers] = useState({});
  const [loading, setLoading] = useState(true);
  const [isFirebaseQuotaExceeded, setIsFirebaseQuotaExceeded] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const fetchProjects = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "projects"));
      const projectsMap = {};
      querySnapshot.forEach((doc) => {
        projectsMap[doc.id] = doc.data().name;
      });
      setProjects(projectsMap);
      setProjectsLoaded(true);
    } catch (error) {
      if (error.code === "resource-exhausted") {
        setIsFirebaseQuotaExceeded(true);
      } else {
        console.error("Firebase error:", error);
      }
    }
  };

  const fetchInvoices = async () => {
    if (!projectsLoaded) return;

    try {
      const querySnapshot = await getDocs(collection(db, "invoices"));
      const allInvoices = [];

      querySnapshot.forEach((doc) => {
        const invoice = { id: doc.id, ...doc.data() };
        const paymentDate = invoice.paymentDate.toDate();

        const paymentStatus = moment(paymentDate).isBefore(moment(), "day")
          ? "Scadenta depasita"
          : moment(paymentDate).isSame(moment(), "day")
            ? "Scadenta astazi"
            : "In termen";

        const projectName = projects[invoice.project] || "N/A";
        allInvoices.push({ ...invoice, status: paymentStatus, projectName });
      });

      setInvoices(allInvoices);
    } catch (error) {
      if (error.code === "resource-exhausted") {
        setIsFirebaseQuotaExceeded(true);
      } else {
        console.error("Firebase error:", error);
      }
    }
  };

  const getHomeInvoices = () => {
    const today = moment().endOf("day");

    return invoices.filter((invoice) => {
      const paymentDate = moment(invoice.paymentDate.toDate());
      return (
        (paymentDate.isBefore(today, "day") || paymentDate.isSame(today, "day")) &&
        !invoice.paid
      );
    });
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projectsLoaded) {
      fetchInvoices();
    }
  }, [projectsLoaded]);

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
    );
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
                  invoices={getHomeInvoices()}  // Pass filtered invoices for home
                  setInvoices={setInvoices}
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
                  invoices={invoices}
                  suppliers={suppliers}
                  loading={loading}
                  setInvoices={setInvoices}
                />
              }
            />
            <Route
              path="/prediction"
              element={
                <Prediction
                  projects={projects}
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
                  suppliers={suppliers}
                  loading={loading}
                  setProjects={setProjects}
                />
              }
            />
            <Route path="*" element={<Notfound />} />
          </Routes>
        </div>
        <AddInvoice
          isOpen={isModalOpen}
          closeModal={closeModal}
          projects={projects}
          setInvoices={setInvoices}
        />
      </div>
    </Router>
  );
}

export default App;
