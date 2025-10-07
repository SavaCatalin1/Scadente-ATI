import React, { useState, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/AddProjectModal.css"; // retain for now (will override with new classes)
import Button from './ui/Button';

function AddProjectModal({ isOpen, closeModal, setProjects }) {
  const [projectName, setProjectName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      alert("Please enter a valid project name");
      return;
    }

    try {
      // Add new project to Firestore
      const newProjectRef = await addDoc(collection(db, "projects"), {
        name: projectName.trim(),
      });

      // Update the projects state in App with the new project
      setProjects((prevProjects) => ({
        ...prevProjects,
        [newProjectRef.id]: projectName.trim(),
      }));

      closeModal();
      setProjectName(""); // Reset the input after adding a new project
    } catch (error) {
      console.error("Error adding project:", error);
    }
  };

  // Reset the projectName when the modal is closed
  useEffect(() => {
    if (!isOpen) {
      setProjectName(""); // Clear input when modal is closed
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="app-modal-overlay" onClick={closeModal}>
      <div className="app-modal" role="dialog" aria-modal="true" aria-label="Adauga Proiect" onClick={e => e.stopPropagation()}>
        <div className="app-modal-header">
          <h2 className="app-modal-title">Adauga Proiect Nou</h2>
          <button className="app-modal-close" type="button" onClick={closeModal} aria-label="Inchide">✕</button>
        </div>
        <div className="app-modal-body">
          <form onSubmit={handleSubmit} className="app-modal-form add-project-form">
            <label className="input-label">Numele Proiectului</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              className="input"
              placeholder="Introduceți numele proiectului"
              maxLength={80}
            />
            <div className="form-actions">
              <Button type="submit" variant="primary" size="sm" disabled={!projectName.trim()}>Adauga</Button>
              <Button type="button" variant="neutral" size="sm" onClick={closeModal}>Anuleaza</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddProjectModal;
