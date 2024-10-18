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
  suppliers,
  loading
}) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
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
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  // Calculate total and unpaid sums
  const total = invoices.reduce(
    (acc, invoice) => acc + Number(invoice.totalSum),
    0
  );
  const unpaidTotal = invoices.reduce(
    (acc, invoice) => acc + Number(invoice.remainingSum),
    0
  );

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const toggleProjects = () => setShowProjects(!showProjects);

  const getSelectedProjectName = () => {
    const project = projects.find(([id]) => id === selectedProject);
    return project ? project[1] : "";
  };

  const startEditingProjectName = () => {
    const project = projects.find(([id]) => id === selectedProject);
    setNewProjectName(project[1]);
    setIsEditingProjectName(true);
  };

  const saveProjectName = async () => {
    if (!newProjectName.trim()) return;

    try {
      const projectRef = doc(db, "projects", selectedProject);
      await updateDoc(projectRef, { name: newProjectName.trim() });

      setIsEditingProjectName(false);
      fetchProjects();
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

      {!showProjects && (
        <button className="toggle-projects-button" onClick={toggleProjects}>
          Arata Proiectele
        </button>
      )}

      {showProjects && (
        <div className="projects-list">
          <ul>
            {projects?.map(([projectId, projectName]) => (
              <li
                key={projectId}
                className={` ${projectId === selectedProject ? "selected" : "project-item"
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
                    loading ? <p>Loading suppliers...</p> : <InvoiceItem
                      key={invoice.id}
                      invoice={invoice}
                      projects={projects}
                      fetchInvoices={fetchInvoices}
                      fetchInvoicesHome={fetchInvoicesHome}
                      supplierName={suppliers[invoice.supplier] || "Unknown Supplier"}
                      fetchInvoicesForProject={fetchInvoicesForProject}
                      selectedProject={selectedProject}
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

      <AddProjectModal
        isOpen={isModalOpen}
        closeModal={closeModal}
        fetchProjects={fetchProjects}
      />
    </div>
  );
}

export default Projects;
