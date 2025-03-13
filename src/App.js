import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Homepage from "./components/Homepage";
import "./App.css";
import Invoices from "./components/Invoices";
import AddInvoice from "./components/AddInvoice";
import { collection, doc, getDoc, onSnapshot, Timestamp } from "firebase/firestore";
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

  // Load cached projects and invoices on component mount
  useEffect(() => {
    const cachedProjects = JSON.parse(localStorage.getItem("projectsCache"));
    const cachedInvoices = JSON.parse(localStorage.getItem("invoicesCache"));
    if (cachedProjects) {
      setProjects(cachedProjects);
      setProjectsLoaded(true);
    }
    if (cachedInvoices) {
      setInvoices(cachedInvoices.map((invoice) => ({
        ...invoice,
        issueDate: new Date(invoice.issueDate),
        paymentDate: new Date(invoice.paymentDate),
      })));
    }

    // Set up real‑time listener for projects
    const unsubscribeProjects = onSnapshot(
      collection(db, "projects"),
      (snapshot) => {
        const projectsMap = {};
        snapshot.forEach((doc) => {
          projectsMap[doc.id] = doc.data().name;
        });
        setProjects(projectsMap);
        setProjectsLoaded(true);

        // Optionally update cache
        localStorage.setItem("projectsCache", JSON.stringify(projectsMap));
        localStorage.setItem("projectsFetchTime", Date.now());
      },
      (error) => {
        if (error.code === "resource-exhausted") {
          setIsFirebaseQuotaExceeded(true);
        } else {
          console.error("Error with onSnapshot for projects:", error);
        }
      }
    );

    return () => unsubscribeProjects();
  }, []);

  // Set up real‑time listener for invoices (wait until projects are loaded)
  useEffect(() => {
    if (projectsLoaded) {
      console.log("Setting up real‑time listener for invoices...");
      const unsubscribe = onSnapshot(
        collection(db, "invoices"),
        (snapshot) => {
          const allInvoices = snapshot.docs.map((doc) => {
            const invoice = { id: doc.id, ...doc.data() };

            const issueDate = invoice.issueDate
              ? (invoice.issueDate instanceof Timestamp
                ? invoice.issueDate.toDate()
                : new Date(invoice.issueDate))
              : null;

            const paymentDate = invoice.paymentDate
              ? (invoice.paymentDate instanceof Timestamp
                ? invoice.paymentDate.toDate()
                : new Date(invoice.paymentDate))
              : null;

            const paymentStatus = moment(paymentDate).isBefore(moment(), "day")
              ? "Scadenta depasita"
              : moment(paymentDate).isSame(moment(), "day")
                ? "Scadenta astazi"
                : "In termen";

            const projectName = projects[invoice.project] || "N/A";

            return {
              ...invoice,
              issueDate,
              paymentDate,
              status: paymentStatus,
              projectName,
            };
          });

          // Sort invoices by issue date descending
          allInvoices.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
          setInvoices(allInvoices);

          // Update cache for invoices
          localStorage.setItem("invoicesCache", JSON.stringify(
            allInvoices.map((invoice) => ({
              ...invoice,
              issueDate: invoice.issueDate ? invoice.issueDate.toISOString() : null,
              paymentDate: invoice.paymentDate ? invoice.paymentDate.toISOString() : null,
            }))
          ));
          localStorage.setItem("invoicesFetchTime", Date.now());
        },
        (error) => {
          if (error.code === "resource-exhausted") {
            setIsFirebaseQuotaExceeded(true);
          } else {
            console.error("Error with onSnapshot for invoices:", error);
          }
        }
      );

      return () => unsubscribe();
    }
  }, [projectsLoaded, projects]);

  // Filter invoices for home view
  const getHomeInvoices = () => {
    const today = moment().endOf("day");

    return invoices.filter((invoice) => {
      const paymentDate = invoice.paymentDate instanceof Date
        ? invoice.paymentDate
        : new Date(invoice.paymentDate);

      return (
        (moment(paymentDate).isBefore(today, "day") || moment(paymentDate).isSame(today, "day")) &&
        !invoice.paid
      );
    });
  };

  // Set up real‑time listener for suppliers (depends on invoices)
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
            Din cauza traficului ridicat, serviciul este inchis tempor.
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
                  invoices={getHomeInvoices()}
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
                  projects={Object.entries(projects).sort((a, b) => a[1].localeCompare(b[1]))}
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
                  projects={Object.entries(projects).sort((a, b) => a[1].localeCompare(b[1]))}
                  invoices={invoices}
                  suppliers={suppliers}
                  loading={loading}
                />
              }
            />
            <Route
              path="/projects"
              element={
                <Projects
                  projects={Object.entries(projects).sort((a, b) => a[1].localeCompare(b[1]))}
                  invoices={invoices}
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
          projects={Object.entries(projects).sort((a, b) => a[1].localeCompare(b[1]))}
          setInvoices={setInvoices}
          invoices={invoices}
        />
      </div>
    </Router>
  );
}

export default App;
