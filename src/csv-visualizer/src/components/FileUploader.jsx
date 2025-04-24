import React from 'react';
import Papa from 'papaparse';

export default function FileUploader({ onDataLoaded }) {
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:8000/upload-csv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const blob = await response.blob();
      const text = await blob.text();

      // ✅ Use the uploaded file extension to decide parsing logic
      if (file.name.endsWith('.json')) {
        try {
          const jsonData = JSON.parse(text);
          onDataLoaded(jsonData, file);
        } catch (error) {
          console.error("Error parsing JSON:", error);
          alert("The uploaded JSON file is invalid.");
        }
      } else {
        // ✅ Parse CSV
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => onDataLoaded(results.data, file),
        });
      }

    } catch (err) {
      console.error("Upload failed:", err);
      alert('Upload failed. Please try again.');
    }
  };

  return (
    <div className="file-upload">
      <input
        id="file"
        type="file"
        accept=".csv,.json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <label htmlFor="file" className="upload-button">
         Upload CSV or JSON
      </label>
    </div>
  );
}
