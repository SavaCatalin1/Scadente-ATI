import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import axios from "axios";
import Modal from "react-modal";
import "../styles/Supplier.css"; // Add custom styles for the modals here

Modal.setAppElement("#root");

function Supplier({ setSelectedSupplier }) {
  const [searchInput, setSearchInput] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [error, setError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [apiSupplier, setApiSupplier] = useState(null);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [customSupplier, setCustomSupplier] = useState({
    name: "",
    cui: "",
    address: "",
    phone: "",
  });
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const supplierSnapshot = await getDocs(collection(db, "suppliers"));
        const supplierList = supplierSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSuppliers(supplierList);
      } catch (err) {
        setError("Error fetching suppliers from Firestore.");
      }
    };
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const debounceSearch = setTimeout(() => {
      if (searchInput) {
        const filtered = suppliers.filter((supplier) =>
          supplier.name.toLowerCase().includes(searchInput.toLowerCase())
        );
        setFilteredSuppliers(filtered);
        setShowDropdown(true);
      } else {
        setFilteredSuppliers([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(debounceSearch);
  }, [searchInput, suppliers]);

  const fetchSupplierFromAPI = async () => {
    try {
      const response = await axios.get(
        `https://lista-firme.info/api/v1/info?cui=${searchInput}`
      );

      if (response.data && response.status === 200) {
        const supplierData = response.data;
        const apiSupplierData = {
          cui: supplierData.cui,
          name: supplierData.name,
          address: supplierData.info.address || "N/A",
          phone: supplierData.info.phone || "N/A",
        };

        setApiSupplier(apiSupplierData);
        setShowModal(true);
      } else {
        setError("Supplier not found in API.");
        setShowCustomModal(true);
      }
    } catch (error) {
      console.error("Error fetching supplier from API:", error);
      setError("Error fetching supplier from API.");
      setShowCustomModal(true);
    }
  };

  const handleSearch = async () => {
    const existsLocally = filteredSuppliers.length > 0;
    if (!existsLocally) {
      fetchSupplierFromAPI();
    }
  };

  const handleAddSupplier = async () => {
    if (apiSupplier) {
      try {
        const docRef = await addDoc(collection(db, "suppliers"), apiSupplier);
        const newSupplier = { id: docRef.id, ...apiSupplier };
        setSelectedSupplier(newSupplier);
        setSearchInput(apiSupplier.name);
        setError("");
        setShowModal(false);
      } catch (error) {
        setError("Error adding supplier to Firestore.");
      }
    }
  };

  const handleAddCustomSupplier = async () => {
    if (customSupplier.name && customSupplier.cui) {
      try {
        const docRef = await addDoc(collection(db, "suppliers"), customSupplier);
        const newSupplier = { id: docRef.id, ...customSupplier };
        setSelectedSupplier(newSupplier);
        setSearchInput(customSupplier.name);
        setShowCustomModal(false);
      } catch (error) {
        setError("Error adding custom supplier to Firestore.");
      }
    } else {
      setError("Please provide a name and CUI for the supplier.");
    }
  };

  const handleSelectSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setSearchInput(supplier.name);
    setShowDropdown(false);
  };

  const handleKeyDown = (e) => {
    if (showDropdown && filteredSuppliers.length > 0) {
      if (e.key === "ArrowDown") {
        setActiveSuggestion((prev) =>
          prev === filteredSuppliers.length - 1 ? 0 : prev + 1
        );
      } else if (e.key === "ArrowUp") {
        setActiveSuggestion((prev) =>
          prev === 0 ? filteredSuppliers.length - 1 : prev - 1
        );
      } else if (e.key === "Enter") {
        if (showDropdown && filteredSuppliers.length > 0) {
          handleSelectSupplier(filteredSuppliers[activeSuggestion]);
        } else {
          handleSearch();
        }
      }
    } else if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      handleSearch();
    }, 150);
  };

  return (
    <div className="supplier-container" ref={dropdownRef}>
      <label className="modal-label">Furnizor</label>
      <div className="supplier-search">
        <input
          type="text"
          placeholder="Introduceti Denumire firmei sau CUI"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
        {showDropdown && filteredSuppliers.length > 0 && (
          <div className="supplier-dropdown">
            <ul className="supplier-list">
              {filteredSuppliers.map((supplier, index) => (
                <li
                  key={index}
                  className={index === activeSuggestion ? "active" : ""}
                  onClick={() => handleSelectSupplier(supplier)}
                >
                  {supplier.name} ({supplier.cui})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* {error && <p className="error">{error}</p>} */}

      <Modal
        isOpen={showModal}
        onRequestClose={() => setShowModal(false)}
        className="supplier-modal"
        contentLabel="Add Supplier Modal"
      >
        <h3>Furnizor gasit!</h3>
        <p><b>Nume:</b> {apiSupplier?.name}</p>
        <p><b>CUI:</b> {apiSupplier?.cui}</p>
        <p><b>Adresa:</b> {apiSupplier?.address}</p>
        <p><b>Telefon:</b> {apiSupplier?.phone}</p>
        <p>Doriti sa adaugati acest furnizor?</p>
        <button className="modal-btn" onClick={handleAddSupplier}>Adauga</button>
        <button className="modal-btn cancel-btn" onClick={() => setShowModal(false)}>Anuleaza</button>
      </Modal>

      <Modal
        isOpen={showCustomModal}
        onRequestClose={() => setShowCustomModal(false)}
        className="custom-supplier-modal"
        contentLabel="Add Custom Supplier Modal"
      >
        <h3>Adauga un furnizor personalizat</h3>
        <div className="modal-form">
          <label>
            Nume:
            <input
              type="text"
              value={customSupplier.name}
              onChange={(e) =>
                setCustomSupplier({ ...customSupplier, name: e.target.value })
              }
            />
          </label>
          <label>
            CUI:
            <input
              type="text"
              value={customSupplier.cui}
              onChange={(e) =>
                setCustomSupplier({ ...customSupplier, cui: e.target.value })
              }
            />
          </label>
          <label>
            Adresa:
            <input
              type="text"
              value={customSupplier.address}
              onChange={(e) =>
                setCustomSupplier({ ...customSupplier, address: e.target.value })
              }
            />
          </label>
          <label>
            Telefon:
            <input
              type="text"
              value={customSupplier.phone}
              onChange={(e) =>
                setCustomSupplier({ ...customSupplier, phone: e.target.value })
              }
            />
          </label>
        </div>
        <button className="modal-btn" onClick={handleAddCustomSupplier}>Adauga Furnizor</button>
        <button className="modal-btn cancel-btn" onClick={() => setShowCustomModal(false)}>Anuleaza</button>
      </Modal>
    </div>
  );
}

export default Supplier;
