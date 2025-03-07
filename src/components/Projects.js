import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import moment from "moment";
import "../styles/Projects.css";
import AddProjectModal from "./AddProject";
import InvoiceItem from "./InvoiceItem";

function Projects({ projects, setProjects, suppliers, loading, invoices }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectInvoices, setProjectInvoices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [showProjects, setShowProjects] = useState(true);

  // Sort projects alphabetically by project name
  const sortedProjects = projects.slice().sort((a, b) =>
    a[1].localeCompare(b[1])
  );

  // Filter the passed invoices for the selected project
  const fetchInvoicesForProject = (projectId) => {
    setSelectedProject(projectId);
    setShowProjects(false);
    const filtered = invoices.filter(
      (invoice) => invoice.project === projectId
    );
    const projectName =
      projects.find(([id]) => id === projectId)?.[1] || "Unknown Project";
    const invoiceList = filtered.map((invoice) => ({
      ...invoice,
      projectName,
    }));
    setProjectInvoices(invoiceList);
  };

  // Calculate total and unpaid sums based on projectInvoices
  const total = projectInvoices.reduce(
    (acc, invoice) => acc + Number(invoice.totalSum),
    0
  );
  const unpaidTotal = projectInvoices.reduce(
    (acc, invoice) => acc + Number(invoice.remainingSum),
    0
  );

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const toggleProjects = () => setShowProjects(!showProjects);

  const getSelectedProjectName = () => {
    return projects.find(([id]) => id === selectedProject)?.[1] || "";
  };

  const startEditingProjectName = () => {
    setNewProjectName(getSelectedProjectName());
    setIsEditingProjectName(true);
  };

  const saveProjectName = async () => {
    if (!newProjectName.trim()) return;

    try {
      const projectRef = doc(db, "projects", selectedProject);
      await updateDoc(projectRef, { name: newProjectName.trim() });

      setIsEditingProjectName(false);

      // Update the projects state locally to reflect the new name
      setProjects((prevProjects) =>
        prevProjects.map(([id, name]) =>
          id === selectedProject ? [id, newProjectName.trim()] : [id, name]
        )
      );
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

      {selectedProject && !showProjects && (
        <div className="selected">
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
              <button onClick={saveProjectName} className="edit-button ml">
                Save
              </button>
              <button
                onClick={() => setIsEditingProjectName(false)}
                className="edit-button ml"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {!showProjects && (
        <button className="toggle-projects-button" onClick={toggleProjects}>
          Arata Proiectele
        </button>
      )}

      {showProjects && (
        <div className="projects-list">
          <ul>
            {sortedProjects.map(([projectId, projectName]) => (
              <li
                key={projectId}
                className={`${projectId === selectedProject ? "selected" : "project-item"
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
        {selectedProject && !showProjects && (
          <>
            <h3 className="invoices-header">
              Facturi pentru proiectul selectat
            </h3>

            <div className="total-sums">
              <div>
                <b className="text">Total facturi:</b>{" "}
                <span className="text">{total.toFixed(2)} LEI</span>
              </div>
              <div>
                <b className="text">Total facturi neplatite:</b>{" "}
                <span className="text">{unpaidTotal.toFixed(2)} LEI</span>
              </div>
            </div>

            {projectInvoices.length > 0 ? (
              <ul className="invoice-list">
                {loading ? (
                  <p>Loading suppliers...</p>
                ) : (
                  projectInvoices.map((invoice) => {
                    const issueDateFormatted = invoice.issueDate?.toDate
                      ? moment(invoice.issueDate.toDate()).format("DD-MM-YYYY")
                      : moment(invoice.issueDate).format("DD-MM-YYYY");

                    const paymentDateFormatted = invoice.paymentDate?.toDate
                      ? moment(invoice.paymentDate.toDate()).format("DD-MM-YYYY")
                      : moment(invoice.paymentDate).format("DD-MM-YYYY");

                    return (
                      <InvoiceItem
                        key={invoice.id}
                        invoice={invoice}
                        projects={projects}
                        supplierName={
                          suppliers[invoice.supplier] || "Unknown Supplier"
                        }
                        selectedProject={selectedProject}
                      />
                    );
                  })
                )}
              </ul>
            ) : (
              <p>Nu exista facturi pentru acest proiect.</p>
            )}
          </>
        )}
      </div>

      <AddProjectModal
        isOpen={isModalOpen}
        closeModal={closeModal}
        setProjects={setProjects}
      />
    </div>
  );
}

export default Projects;
