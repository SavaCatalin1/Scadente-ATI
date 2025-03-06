import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Homepage from "./components/Homepage";
import "./App.css";
import Invoices from "./components/Invoices";
import AddInvoice from "./components/AddInvoice";
import { collection, doc, getDoc, getDocs, onSnapshot, Timestamp } from "firebase/firestore";
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

  // fetch projects start
  const fetchProjects = async () => {

    const cachedProjects = JSON.parse(localStorage.getItem("projectsCache"));
    const lastFetchTime = localStorage.getItem("projectsFetchTime");

    // Check if projects are cached and within the refresh period
    if (cachedProjects && Date.now() - lastFetchTime < 86400000) {
      setProjects(cachedProjects);
      setProjectsLoaded(true);
      return;
    }

    // If no valid cache, fetch from Firebase
    try {
      console.log("big fetch projects")
      const querySnapshot = await getDocs(collection(db, "projects"));
      const projectsMap = {};
      querySnapshot.forEach((doc) => {
        projectsMap[doc.id] = doc.data().name;
      });

      setProjects(projectsMap);
      setProjectsLoaded(true);

      // Save projects to localStorage
      localStorage.setItem("projectsCache", JSON.stringify(projectsMap));
      localStorage.setItem("projectsFetchTime", Date.now());
    } catch (error) {
      if (error.code === "resource-exhausted") {
        setIsFirebaseQuotaExceeded(true);
      } else {
        console.error("Firebase error:", error);
      }
    }
  };
// fetch projects end


// //fetch invoices start
//   const fetchInvoices = async () => {
//     if (!projectsLoaded) return;

//     const cachedInvoices = JSON.parse(localStorage.getItem("invoicesCache"));
//     const lastFetchTime = localStorage.getItem("invoicesFetchTime");

//     // Check if invoices are cached and within the refresh period
//     if (cachedInvoices && Date.now() - lastFetchTime < 86400000) {
//       console.log("Using cached invoices from localStorage.");
//       const formattedInvoices = cachedInvoices.map((invoice) => ({
//         ...invoice,
//         // Ensure issueDate and paymentDate are converted back to Date objects
//         issueDate: invoice.issueDate ? new Date(invoice.issueDate) : null,
//         paymentDate: invoice.paymentDate ? new Date(invoice.paymentDate) : null,
//       }));

//       formattedInvoices.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
//       setInvoices(formattedInvoices);
//       return;
//     }

//     console.log("Fetching invoices from Firebase...");
//     try {
//       console.log("big fetch")
//       const querySnapshot = await getDocs(collection(db, "invoices"));
//       const allInvoices = [];

//       querySnapshot.forEach((doc) => {
//         const invoice = { id: doc.id, ...doc.data() };

//         const issueDate = invoice.issueDate
//           ? invoice.issueDate instanceof Timestamp
//             ? invoice.issueDate.toDate()
//             : new Date(invoice.issueDate)
//           : null;  // Handle null values

//         const paymentDate = invoice.paymentDate
//           ? invoice.paymentDate instanceof Timestamp
//             ? invoice.paymentDate.toDate()
//             : new Date(invoice.paymentDate)
//           : null;


//         const paymentStatus = moment(paymentDate).isBefore(moment(), "day")
//           ? "Scadenta depasita"
//           : moment(paymentDate).isSame(moment(), "day")
//             ? "Scadenta astazi"
//             : "In termen";

//         const projectName = projects[invoice.project] || "N/A";
//         allInvoices.push({
//           ...invoice,
//           status: paymentStatus,
//           projectName,
//           issueDate,
//           paymentDate
//         });
//       });

//       allInvoices.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

//       setInvoices(allInvoices);

//       // Convert date fields to ISO strings before saving to localStorage
//       const cacheFriendlyInvoices = allInvoices.map((invoice) => ({
//         ...invoice,
//         issueDate: invoice.issueDate.toISOString(),
//         paymentDate: invoice.paymentDate.toISOString(),
//       }));

//       // Store invoices in localStorage
//       localStorage.setItem("invoicesCache", JSON.stringify(cacheFriendlyInvoices));
//       localStorage.setItem("invoicesFetchTime", Date.now());
//       console.log("Invoices cached in localStorage.");
//     } catch (error) {
//       if (error.code === "resource-exhausted") {
//         setIsFirebaseQuotaExceeded(true);
//       } else {
//         console.error("Firebase error:", error);
//       }
//     }
//   };
// //fetch invoices end

  // Set up real‑time listener for invoices using onSnapshot
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

          // Optionally update localStorage for caching purposes
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


//get home invoices start
  const getHomeInvoices = () => {
    const today = moment().endOf("day");

    return invoices.filter((invoice) => {
      // Ensure paymentDate is a Date object before using .toDate
      const paymentDate = invoice.paymentDate instanceof Date
        ? invoice.paymentDate
        : new Date(invoice.paymentDate);

      return (
        (moment(paymentDate).isBefore(today, "day") || moment(paymentDate).isSame(today, "day")) &&
        !invoice.paid
      );
    });
  };
// get home invoices end


//load cached projects and invoices start
  useEffect(() => {
    // Load cached projects and invoices on component mount
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

    // Fetch projects from Firebase if needed
    fetchProjects();
  }, []);
  //load cached projects and invoices end

  //make sure projects before invoices loaded start
  // useEffect(() => {
  //   if (projectsLoaded) {
  //     fetchInvoices();
  //   }
  // }, [projectsLoaded]);
  //make sure projects before invoices loaded end

//fetch suppliers start
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
//fetch suppliers end


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
          invoices={invoices}
        />
      </div>
    </Router>
  );
}

export default App;
