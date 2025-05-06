
import React from 'react';
import Papa from 'papaparse';

export default function FileUploader({ onDataLoaded }) {
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;


    const allowedTypes = ['.csv', '.json'];
    const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      alert('Invalid file type. Please upload a .csv or .json file.');
      return;
    }

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
          const jsonData = JSON.parse(text);
          console.log(`JSON Upload + Parse Time: ${(performance.now() - startUpload).toFixed(2)} ms`);
          onDataLoaded(jsonData, file);
        } catch (error) {
          console.error("Error parsing JSON:", error);
          alert("The uploaded JSON file is invalid.");
        }
      } else {
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
            console.log(`CSV Upload + Parse Time: ${(performance.now() - startUpload).toFixed(2)} ms`);
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
        aria-label="Upload CSV or JSON file"
      />
      <label
        htmlFor="file"
        className="upload-button"
        role="button"
        tabIndex={0}
        aria-label="Click or press Enter to upload a CSV or JSON file"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            document.getElementById('file').click();
          }
        }}
      >
        Upload CSV or JSON
      </label>
    </div>
  );
}
