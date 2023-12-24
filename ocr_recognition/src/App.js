import React, { useState } from 'react';
import axios from 'axios';

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [ocrData, setOcrData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [ocrRecords, setOcrRecords] = useState([]);
  const [showRecords, setShowRecords] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const extractInfo = (thaiText) => {
    const lines = thaiText.split('\n');

  const identificationIndex = lines.findIndex(line => line.includes('Identification Number'));
  const nameIndex = lines.findIndex(line => line.includes('Name'));
  const lnameIndex = lines.findIndex(line => line.includes('Last name'));
  const dobIndex = lines.findIndex(line => line.includes('Date of Birth'));
  const issueDateIndex = lines.findIndex(line => line.includes('Date of Issue'));
  const expiryDateIndex = lines.findIndex(line => line.includes('Date of Expiry'));

  const identificationNumber = lines[identificationIndex - 2].trim();
  const name = lines[nameIndex].split('Name')[1].trim();
  const lname = lines[lnameIndex].split('Last name')[1].trim();
  const dateOfBirth = lines[dobIndex].split('Date of Birth')[1].trim();
  const dateOfIssue = lines[issueDateIndex-1].trim();
  const dateOfExpiry = lines[expiryDateIndex-1].trim();

  return {
    identification_number: identificationNumber,
    name,
    last_name: lname, // Assuming last name is the third part of the name
    date_of_birth: dateOfBirth,
    date_of_issue: dateOfIssue,
    date_of_expiry: dateOfExpiry,
  };
  };

  const createRecord = async () => {
    if (ocrData && ocrData.text) {
      try {
        const extractedInfo = extractInfo(ocrData.text);
        const currentTime = new Date().toISOString();

        const recordData = {
          ocrResult: extractedInfo,
          timestamp: currentTime,
          status: 'success', // You can set status based on your logic
          errorMessage: '', // Set error message if applicable
        };

        const response = await axios.post('http://localhost:5001/ocr/create', recordData);
        console.log('Record created:', response.data);
        setOcrRecords([response.data.data]); // Update frontend records
      } catch (error) {
        console.error('Error creating record:', error);
      }
    }
  };


  const displayRecords = () => {
    if (showRecords) {
      return (
        <div>
          <h2>OCR Records</h2>
          <ul>
            {ocrRecords[0].map((record, index) => (
              <li key={index}>
                <strong>OCR Result:</strong> {JSON.stringify(record.ocrResult)} <br />
                <strong>Timestamp:</strong> {record.timestamp} <br />
                <strong>Status:</strong> {record.status} <br />
                <strong>Error Message:</strong> {record.errorMessage} <br />
                <hr />
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return null;
  };
  

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file.');
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);

    const options = {
      method: 'POST',
      url: 'https://ocr-extract-text.p.rapidapi.com/ocr',
      headers: {
        'X-RapidAPI-Key': '035ad44342msha264ebda7b3dbdbp1205b1jsnbd25e58d15d6', // Replace with your RapidAPI key
        'X-RapidAPI-Host': 'ocr-extract-text.p.rapidapi.com'
      },
      data: formData
    };

    try {
      const response = await axios.request(options);
      setOcrData(response.data);
      console.log(response.data);

      if (ocrData && ocrData.text) {
        const extractedInfo = extractInfo(ocrData.text);
        console.log(extractedInfo);
      }
    } catch (error) {
      setErrorMessage('Error uploading file.');
      console.error('Error:', error);
    }
  };

  const handleDisplay = () => {
    setShowRecords(true); // Set showRecords to true when Display button is clicked
  };

  return (
    <div>
      <h1>Thai ID Card OCR</h1>
      <input type="file" accept=".png, .jpg, .jpeg" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Upload</button>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      {ocrData && (
        <div>
          <h2>Extracted Data</h2>
          <pre>
            {Object.entries(extractInfo(ocrData.text)).map(([key, value]) => (
              <div key={key}>
                <strong>{key}:</strong> {value}
              </div>
            ))}
          </pre>
          <div>
            <button onClick={createRecord}>Create</button>
            <button onClick={handleDisplay}>Display</button>
          </div>
          {displayRecords()}
        </div>
      )}
    </div>
  );
};

export default App;
