import React from 'react';
import Papa from 'papaparse';

export default function FileUploader({ onDataLoaded }) {
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const startUpload = performance.now();

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

      if (file.name.endsWith('.json')) {
        try {
          const parseStart = performance.now();
          const jsonData = JSON.parse(text);
          const parseEnd = performance.now();
          console.log(`JSON Upload + Parse Time: ${(parseEnd - startUpload).toFixed(2)} ms`);
          onDataLoaded(jsonData, file);
        } catch (error) {
          console.error("Error parsing JSON:", error);
          alert("The uploaded JSON file is invalid.");
        }
      } else {
        const parseStart = performance.now();
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsed = results.data.map(row => {
              const cleaned = {};
              for (const key in row) {
                const val = row[key];
                cleaned[key] = isNaN(val) || val.trim() === '' ? val : Number(val);
              }
              return cleaned;
            });
            const parseEnd = performance.now();
            console.log(`CSV Upload + Parse Time: ${(parseEnd - startUpload).toFixed(2)} ms`);
            onDataLoaded(parsed, file);
          }
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
