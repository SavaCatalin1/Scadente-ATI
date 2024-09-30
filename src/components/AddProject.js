import React, { useState, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/AddProjectModal.css";

function AddProjectModal({ isOpen, closeModal, fetchProjects }) {
  const [projectName, setProjectName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      alert("Please enter a valid project name");
      return;
    }

    try {
      // Add new project to Firestore
      await addDoc(collection(db, "projects"), {
        name: projectName.trim(),
      });
      closeModal();
      fetchProjects();
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

  if (!isOpen) return null; // Don't render if the modal is closed

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Adauga Proiect Nou</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <label className="modal-label">Numele Proiectului</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
            className="modal-input"
            placeholder="Introduceți numele proiectului"
          />
          <button type="submit" className="modal-submit">
            Adauga Proiect
          </button>
        </form>
        <button className="modal-close" onClick={closeModal}>
          X
        </button>
      </div>
    </div>
  );
}

export default AddProjectModal;
