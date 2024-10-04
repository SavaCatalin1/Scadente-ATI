import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import moment from "moment";
import "../styles/Projects.css";
import AddProjectModal from "./AddProject";
import InvoiceItem from "./InvoiceItem";

function Projects({
  projects,
  fetchProjects,
  fetchInvoices,
  fetchInvoicesHome,
}) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false); // Track editing state
  const [newProjectName, setNewProjectName] = useState(""); // Track new project name
  const [totalSum, setTotalSum] = useState(0);
  const [unpaidTotalSum, setUnpaidTotalSum] = useState(0);
  const [showProjects, setShowProjects] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch all invoices for the selected project
  const fetchInvoicesForProject = async (projectId) => {
    setSelectedProject(projectId);
    setShowProjects(false);

    try {
      const q = query(
        collection(db, "invoices"),
        where("project", "==", projectId)
      );
      const querySnapshot = await getDocs(q);

      const project = projects.find(([id]) => id === projectId);
      const projectName = project ? project[1] : "Unknown Project";

      const invoiceList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        projectName,
      }));

      setInvoices(invoiceList);

      const total = invoiceList.reduce(
        (acc, invoice) => acc + Number(invoice.totalSum),
        0
      );
      setTotalSum(total);

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
    const project = projects.find(([id]) => id === selectedProject);
    return project ? project[1] : "";
  };

  // Edit Project Name
  const startEditingProjectName = () => {
    const project = projects.find(([id]) => id === selectedProject);
    setNewProjectName(project[1]); // Set the current project name in the input field
    setIsEditingProjectName(true); // Enable editing mode
  };

  // Save the new project name to Firestore
  const saveProjectName = async () => {
    if (!newProjectName.trim()) return;

    try {
      const projectRef = doc(db, "projects", selectedProject);
      await updateDoc(projectRef, { name: newProjectName.trim() });

      setIsEditingProjectName(false); // Exit editing mode
      fetchProjects(); // Refresh the projects list to show the updated name
    } catch (error) {
      console.error("Error updating project name:", error);
    }
  };

  return (
    <div className="page-content">
      <div className="projects-header-flex">
        <h2 className="page-title">Proiecte</h2>
        <button className="add-project-button" onClick={openModal}>
          Adauga Proiect
        </button>
      </div>

      {/* Show the selected project name with edit button */}
      {selectedProject && !showProjects && (
        <div className={`selected`}>
          <div className="da">
            <div className="project-item-icon">📁</div>
            {isEditingProjectName ? (
              <input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="edit-project-input"
              />
            ) : (
              getSelectedProjectName()
            )}
          </div>
          {!isEditingProjectName ? (
            <button className="edit-button" onClick={startEditingProjectName}>
              Edit
            </button>
          ) : (
            <div>
              <button onClick={saveProjectName} className="edit-button ml">Save</button>
              <button onClick={() => setIsEditingProjectName(false)} className="edit-button ml">
                Cancel
              </button>
            </div>
          )}
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
                <div>
                  <span className="project-item-icon">📁</span>
                  {projectName}
                </div>
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
