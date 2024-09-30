import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import moment from "moment";
import "../styles/Projects.css";
import AddProjectModal from "./AddProject"; // Import the modal
import InvoiceItem from "./InvoiceItem"; // Import InvoiceItem

function Projects({
  projects,
  fetchProjects,
  fetchInvoices,
  fetchInvoicesHome,
}) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // Manage modal state
  const [totalSum, setTotalSum] = useState(0); // Total sum of all invoices
  const [unpaidTotalSum, setUnpaidTotalSum] = useState(0); // Total sum of unpaid invoices
  const [showProjects, setShowProjects] = useState(true); // State to show/hide projects

  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch all invoices for the selected project
  const fetchInvoicesForProject = async (projectId) => {
    setSelectedProject(projectId);
    setShowProjects(false); // Hide the projects list when a project is selected

    try {
      // Query for fetching invoices linked to the selected project
      const q = query(
        collection(db, "invoices"),
        where("project", "==", projectId)
      );
      const querySnapshot = await getDocs(q);

      // Fetch the project name from the project map or database
      const project = projects.find(([id]) => id === projectId); // Assuming projects is an array of [projectId, projectName]
      const projectName = project ? project[1] : "Unknown Project"; // Get the project name, default to "Unknown Project"

      // Map over invoices and add project name to each invoice
      const invoiceList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        projectName, // Attach the project name to each invoice
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

  // Toggle the visibility of the project list
  const toggleProjects = () => setShowProjects(!showProjects);

  // Get the name of the selected project
  const getSelectedProjectName = () => {
    const project = projects.find(([id]) => id === selectedProject); // Use array destructuring for [id, name]
    return project ? project[1] : ""; // Return project name
  };

  return (
    <div className="page-content">
      <div className="projects-header-flex">
        <h2 className="page-title">Proiecte</h2>
        <button className="add-project-button" onClick={openModal}>
          Adauga Proiect
        </button>
      </div>

      {/* Show the selected project name when the project is selected */}
      {selectedProject && !showProjects && (
        <div className={`selected`}>
          <span className="project-item-icon">📁</span>
          {getSelectedProjectName()}
        </div>
      )}

      {/* Button to toggle the projects list visibility */}
      {!showProjects && (
        <button className="toggle-projects-button" onClick={toggleProjects}>
          Arata Proiectele
        </button>
      )}

      {/* Conditionally render the projects list */}
      {showProjects && (
        <div className="projects-list">
          <ul>
            {projects?.map(([projectId, projectName]) => (
              <li
                key={projectId}
                className={` ${
                  projectId === selectedProject ? "selected" : "project-item"
                }`}
                onClick={() => fetchInvoicesForProject(projectId)}
              >
                <span className="project-item-icon">📁</span>
                {projectName}
              </li>
            ))}
          </ul>
        </div>
      )}

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
                    <InvoiceItem
                      key={invoice.id}
                      invoice={invoice}
                      projects={projects}
                      fetchInvoices={fetchInvoices}
                      fetchInvoicesHome={fetchInvoicesHome}
                    />
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
