A Full Stack web application for visualizing and analyzing structured data from CSV, JSON files, or APIS. The application offers various types of charts, descriptive statistics, and export functionalities to improve data comprehension for users.

Features:

 Data Upload: Import CSV or JSON files for visualization and analysis.
 
 API connectivity: Retrieve and visualize data dicrectly from external APIs.
 
 Dynamic Charts: Generate car, line or scatter charts using D3.js.
 
 Stastical Insights: Access essential statistics such as Mean, Median, Standard Deviation and Correlation Matrix.
 
 Export Capabilities: Can download the cleaned data, Stastical Report and the Charts.
 
 Chart Configuration: Select X and Y axes, and chart types from the dropdown menus.

Technologies Utilized:

*Frontend*

 React + Vite
 
 D3.js
 
 jsPDF + AutoTable
 
 PapaParse

*Backend*

FastAPI

PySpark for data cleaning and stats

CORS Middleware

Directory Structure:

![image](https://github.com/user-attachments/assets/f3df22d3-c294-4fa2-8f6d-9f7d41392ab0)

Getting Started:

*Install Requirements*

cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

*Run the Backend*

uvicorn main:app --reload

*Run the Frontend*

cd frontend
npm install
npm run dev

API Endpoints:

POST /upload-csv : Upload CSV or JSON file for cleaning
POST /descriptive-stats : Gets stats for uploaded/parsed data

Author: Chashara Devindy Bandaranayake  
Project for Bachelors Thesis 

