import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import moment from "moment";
import "../styles/Projects.css";
import AddProjectModal from "./AddProject";
import InvoiceItem from "./InvoiceItem";
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderIcon from '@mui/icons-material/Folder';
import SummarizeIcon from '@mui/icons-material/Summarize';

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
    <div className="projects-page-wrapper">
      <div className="projects-topbar">
        <h1 className="projects-title">Proiecte</h1>
        <Button variant="primary" onClick={openModal}>Adauga Proiect</Button>
      </div>

      {showProjects && (
        <div className="projects-grid">
          {sortedProjects.length === 0 && (
            <Card className="project-empty-card">
              <Badge variant="info">Niciun proiect</Badge>
              <p>Adauga primul proiect pentru a incepe sa urmaresti facturile.</p>
            </Card>
          )}
          {sortedProjects.map(([projectId, projectName]) => {
            const projectInvoiceCount = invoices.filter(inv => inv.project === projectId).length;
            const unpaidAmount = invoices.filter(inv => inv.project === projectId && !inv.paid).reduce((acc,i)=>acc+Number(i.remainingSum||0),0);
            return (
              <Card
                key={projectId}
                className={`project-card ${projectId === selectedProject ? 'active' : ''}`}
                onClick={() => fetchInvoicesForProject(projectId)}
              >
                <div className="proj-head">
                  <div className="proj-icon"><FolderIcon fontSize="small" /></div>
                  <div className="proj-name" title={projectName}>{projectName}</div>
                </div>
                <div className="proj-metrics">
                  <div className="metric-mini">
                    <span className="mlabel">Facturi</span>
                    <span className="mvalue">{projectInvoiceCount}</span>
                  </div>
                  <div className="metric-mini">
                    <span className="mlabel">Neplatite</span>
                    <span className="mvalue warn">{unpaidAmount.toFixed(2)} LEI</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!showProjects && selectedProject && (
        <div className="project-detail-view">
          <div className="detail-header">
            <Button variant="neutral" size="xs" onClick={toggleProjects} className="back-btn-compact"><ArrowBackIcon fontSize="inherit" /> Inapoi</Button>
            <div className="detail-title-group">
              {isEditingProjectName ? (
                <input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="project-name-input input"
                  autoFocus
                />
              ) : (
                <h2 className="detail-title">{getSelectedProjectName()}</h2>
              )}
              {!isEditingProjectName && (
                <Button variant="outline" size="sm" onClick={startEditingProjectName}><EditIcon fontSize="inherit" /> Edit</Button>
              )}
              {isEditingProjectName && (
                <div className="edit-actions">
                  <Button variant="success" size="sm" onClick={saveProjectName}>Salveaza</Button>
                  <Button variant="danger" size="sm" onClick={() => setIsEditingProjectName(false)}>Anuleaza</Button>
                </div>
              )}
            </div>
            <div className="detail-stats-bar">
              <div className="ds-chip"><span className="ds-label">Total</span><span className="ds-value">{total.toFixed(2)} LEI</span></div>
              <div className="ds-chip warn"><span className="ds-label">Neplatite</span><span className="ds-value">{unpaidTotal.toFixed(2)} LEI</span></div>
              <div className="ds-chip"><span className="ds-label">Facturi</span><span className="ds-value">{projectInvoices.length}</span></div>
            </div>
          </div>
          <Card className="project-invoices-card">
            {projectInvoices.length === 0 ? (
              <div className="empty-project-invoices">Nu exista facturi pentru acest proiect.</div>
            ) : (
              <ul className="invoice-list modern">
                {loading ? (
                  <p>Loading suppliers...</p>
                ) : (
                  projectInvoices.map((invoice) => (
                    <InvoiceItem
                      key={invoice.id}
                      invoice={invoice}
                      projects={projects}
                      supplierName={suppliers[invoice.supplier] || 'Unknown Supplier'}
                      selectedProject={selectedProject}
                    />
                  ))
                )}
              </ul>
            )}
          </Card>
        </div>
      )}

      <AddProjectModal isOpen={isModalOpen} closeModal={closeModal} setProjects={setProjects} />
    </div>
  );
}

export default Projects;
