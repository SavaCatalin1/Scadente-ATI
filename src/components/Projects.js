import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import moment from "moment";
import "../styles/Projects.css";
import AddProjectModal from "./AddProject"; // Import the modal

function Projects() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // Manage modal state
  const [totalSum, setTotalSum] = useState(0); // Total sum of all invoices
  const [unpaidTotalSum, setUnpaidTotalSum] = useState(0); // Total sum of unpaid invoices

  // Fetch all projects from Firestore
  const fetchProjects = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "projects"));
      const projectList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(projectList);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch all invoices for the selected project
  const fetchInvoicesForProject = async (projectId) => {
    setSelectedProject(projectId);
    try {
      const q = query(
        collection(db, "invoices"),
        where("project", "==", projectId)
      );
      const querySnapshot = await getDocs(q);
      const invoiceList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setInvoices(invoiceList);

      // Calculate the total sum of all invoices
      const total = invoiceList.reduce(
        (acc, invoice) => acc + Number(invoice.totalSum),
        0
      );
      setTotalSum(total);

      // Calculate the total sum of unpaid invoices
      const unpaidTotal = invoiceList
        .filter((invoice) => !invoice.paid)
        .reduce((acc, invoice) => acc + Number(invoice.totalSum), 0);
      setUnpaidTotalSum(unpaidTotal);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  // Toggle modal state
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="page-content">
      <div className="projects-header-flex">
        <h2 className="page-title">Proiecte</h2>
        <button className="add-project-button" onClick={openModal}>
          Adauga Proiect
        </button>
      </div>

      <div className="projects-list">
        <ul>
          {projects.map((project) => (
            <li
              key={project.id}
              className={` ${
                project.id === selectedProject ? "selected" : "project-item"
              }`}
              onClick={() => fetchInvoicesForProject(project.id)}
            >
              <span className="project-item-icon">📁</span>
              {project.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="invoices-section">
        {selectedProject && (
          <>
            <h3 className="invoices-header">
              Facturi pentru proiectul selectat
            </h3>

            {/* Display total sums */}
            <div className="total-sums">
              <div>
                <b className="text">Total facturi:</b>{" "}
                <span className="text">{totalSum.toFixed(2)} LEI</span>
              </div>
              <div>
                <b className="text">Total facturi neplatite:</b>{" "}
                <span className="text">{unpaidTotalSum.toFixed(2)} LEI</span>
              </div>
            </div>

            {invoices.length > 0 ? (
              <ul className="invoice-list">
                {invoices.map((invoice) => {
                  const issueDateFormatted = moment(
                    invoice.issueDate.toDate()
                  ).format("DD-MM-YYYY");
                  const paymentDateFormatted = moment(
                    invoice.paymentDate.toDate()
                  ).format("DD-MM-YYYY");

                  return (
                    <li key={invoice.id} className="invoice-item">
                      <div>
                        <span className="view">
                          <b>Furnizor:</b> {invoice.supplier}
                        </span>
                        <span className="view">
                          <b>Numar factura:</b> {invoice.invoiceNo}
                        </span>
                        <span className="view">
                          <b>Data emitere:</b> {issueDateFormatted}
                        </span>
                      </div>
                      <div>
                        <span className="view">
                          <b>Total plata:</b> {invoice.totalSum} LEI
                        </span>
                        <span className="view">
                          <b>Data scadenta:</b> {paymentDateFormatted}
                        </span>
                      </div>
                      <div className="delete-flex">
                        <span
                          className={`status ${
                            invoice.paid
                              ? "platit"
                              : invoice.status
                                  .replace(/\s+/g, "-")
                                  .toLowerCase()
                          }`}
                        >
                          <b>Status:</b>{" "}
                          {invoice.paid ? "Platit" : invoice.status}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>Nu exista facturi pentru acest proiect.</p>
            )}
          </>
        )}
      </div>

      {/* Add the NewProjectModal */}
      <AddProjectModal
        isOpen={isModalOpen}
        closeModal={closeModal}
        fetchProjects={fetchProjects}
      />
    </div>
  );
}

export default Projects;
