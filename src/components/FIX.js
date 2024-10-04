import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase"; // Import your Firestore config

const AddRemainingSumToInvoices = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Fetch all invoices from Firestore
  const fetchInvoices = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "invoices"));
      const invoiceList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInvoices(invoiceList);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  // Add remainingSum to all invoices where it's missing or incorrect
  const addRemainingSumToAllInvoices = async () => {
    setIsUpdating(true);
    let updatedInvoicesCount = 0;

    try {
      // Loop through each invoice
      for (const invoice of invoices) {
        // Check if remainingSum is missing or incorrect
        if (
          !invoice.remainingSum ||
          invoice.remainingSum !== invoice.totalSum
        ) {
          const invoiceRef = doc(db, "invoices", invoice.id);

          // Update the invoice with remainingSum equal to totalSum
          await updateDoc(invoiceRef, {
            remainingSum: invoice.totalSum,
          });

          updatedInvoicesCount++;
        }
      }

      setUpdateCount(updatedInvoicesCount); // Set how many invoices were updated
      alert(`Updated ${updatedInvoicesCount} invoices with remainingSum!`);
    } catch (error) {
      console.error("Error updating invoices:", error);
    }

    setIsUpdating(false);
    fetchInvoices(); // Refresh invoices after update
  };

  return (
    <div>
      <h2>Adauga Remaining Sum la toate facturile</h2>

      <p>
        Facturi incarcate: {invoices.length}
        {updateCount > 0 && <span> | Facturi actualizate: {updateCount}</span>}
      </p>

      <button
        onClick={addRemainingSumToAllInvoices}
        disabled={isUpdating}
        className="add-remaining-sum-btn"
      >
        {isUpdating ? "Actualizeaza..." : "Actualizeaza Remaining Sum"}
      </button>
    </div>
  );
};

export default AddRemainingSumToInvoices;
