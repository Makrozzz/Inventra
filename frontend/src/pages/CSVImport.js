import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, AlertCircle } from 'lucide-react';
import CSVUploader from '../components/CSVUploader';
import ImportPreview from '../components/ImportPreview';
import ImportConfirmationDialog from '../components/ImportConfirmationDialog';
import apiService from '../services/apiService';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const CSVImport = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: Preview, 3: Import
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [validationSummary, setValidationSummary] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [processing, setProcessing] = useState(false);

  // File processing and validation
  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    setParsedData(null);
    setValidationResults(null);
    setValidationSummary(null);
    setImportResults(null);
    
    if (file) {
      setProcessing(true);
      try {
        await processFile(file);
      } catch (error) {
        console.error('Error processing file:', error);
        // Handle error - maybe show notification
      } finally {
        setProcessing(false);
      }
    } else {
      setCurrentStep(1);
    }
  };

  const processFile = async (file) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    let data = [];

    if (fileExtension === 'csv') {
      // Parse CSV
      data = await new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              console.warn('CSV parsing warnings:', results.errors);
            }
            resolve(results.data);
          },
          error: reject
        });
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Parse Excel
      data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    }

    if (data.length === 0) {
      throw new Error('No data found in the file');
    }

    setParsedData(data);
    
    // Validate the data
    const validation = await validateData(data);
    setValidationResults(validation);
    setCurrentStep(2);
  };

  const validateData = async (data) => {
    const validationResults = [];
    
    // Define validation rules
    const requiredFields = ['project_reference_num', 'serial_number', 'tag_id', 'item_name'];
    const validStatuses = ['Active', 'Inactive', 'Maintenance'];
    
    // Track unique values for uniqueness validation
    const seenSerialNumbers = new Set();
    const seenTagIds = new Set();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const errors = [];

      // Check required fields
      requiredFields.forEach(field => {
        if (!row[field] || String(row[field]).trim() === '') {
          errors.push({
            field,
            message: `${field} is required`
          });
        }
      });

      // Check unique fields
      if (row.serial_number) {
        const serialNum = String(row.serial_number).trim();
        if (seenSerialNumbers.has(serialNum)) {
          errors.push({
            field: 'serial_number',
            message: 'Serial number must be unique within the file'
          });
        } else {
          seenSerialNumbers.add(serialNum);
        }
      }

      if (row.tag_id) {
        const tagId = String(row.tag_id).trim();
        if (seenTagIds.has(tagId)) {
          errors.push({
            field: 'tag_id',
            message: 'Tag ID must be unique within the file'
          });
        } else {
          seenTagIds.add(tagId);
        }
      }

      // Check status value
      if (row.status && !validStatuses.includes(row.status)) {
        errors.push({
          field: 'status',
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }

      // Check data formats
      if (row.serial_number && !/^[a-zA-Z0-9\-_]+$/.test(row.serial_number)) {
        errors.push({
          field: 'serial_number',
          message: 'Serial number should contain only alphanumeric characters, hyphens, and underscores'
        });
      }

      validationResults.push(errors);
    }

    return validationResults;
  };

  const handleValidationComplete = (summary) => {
    setValidationSummary(summary);
  };

  const handleConfirmImport = async (importOption) => {
    setImporting(true);
    try {
      let dataToImport = parsedData;
      
      if (importOption === 'valid-only') {
        // Filter only valid rows
        dataToImport = parsedData.filter((row, index) => {
          const rowErrors = validationResults[index] || [];
          return rowErrors.length === 0;
        });
      }

      // Call the bulk import API
      const result = await apiService.bulkImportAssets(dataToImport);
      
      setImportResults(result);
      setShowConfirmDialog(false);
      setCurrentStep(3);
      
    } catch (error) {
      console.error('Import failed:', error);
      setImportResults({
        success: false,
        error: error.message,
        imported: 0,
        failed: parsedData?.length || 0
      });
      setShowConfirmDialog(false);
      setCurrentStep(3);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        project_reference_num: 'QT240000000015729',
        customer_name: 'NADMA',
        customer_reference_number: 'M24050',
        branch: 'Putrajaya',
        serial_number: 'SN-001',
        tag_id: 'TAG-001',
        item_name: 'Desktop Computer',
        category: 'Desktop',
        model: 'Dell OptiPlex 3090',
        status: 'Active',
        recipient_name: 'John Doe',
        department_name: 'IT Department'
      }
    ];

    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asset-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetImport = () => {
    setCurrentStep(1);
    setSelectedFile(null);
    setParsedData(null);
    setValidationResults(null);
    setValidationSummary(null);
    setImportResults(null);
  };

  const goToAssets = () => {
    // Navigate to assets with refresh flag to reload data
    navigate('/assets', { state: { refresh: true } });
  };

  return (
    <div className="csv-import-page">
      <style jsx>{`
        .csv-import-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: 1px solid #e2e8f0;
          color: #64748b;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-button:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #475569;
        }

        .page-title {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .btn-outline {
          background: white;
          color: #3b82f6;
          border: 1px solid #3b82f6;
        }

        .btn-outline:hover {
          background: #eff6ff;
        }

        .progress-indicator {
          display: flex;
          align-items: center;
          margin-bottom: 32px;
          max-width: 600px;
        }

        .progress-step {
          display: flex;
          align-items: center;
          flex: 1;
          position: relative;
        }

        .step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          background: #f1f5f9;
          color: #64748b;
          border: 2px solid #e2e8f0;
          z-index: 2;
          position: relative;
        }

        .progress-step.active .step-circle {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .progress-step.completed .step-circle {
          background: #22c55e;
          color: white;
          border-color: #22c55e;
        }

        .step-label {
          margin-left: 12px;
          font-weight: 500;
          color: #64748b;
        }

        .progress-step.active .step-label {
          color: #1e293b;
        }

        .step-connector {
          height: 2px;
          background: #e2e8f0;
          flex: 1;
          margin: 0 16px;
        }

        .progress-step.completed + .progress-step .step-connector {
          background: #22c55e;
        }

        .content-section {
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .section-header {
          padding: 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .section-subtitle {
          color: #64748b;
          margin: 0;
        }

        .section-content {
          padding: 24px;
        }

        .import-results {
          text-align: center;
          padding: 40px 20px;
        }

        .result-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
        }

        .result-icon.success {
          color: #22c55e;
        }

        .result-icon.error {
          color: #ef4444;
        }

        .result-title {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .result-title.success {
          color: #166534;
        }

        .result-title.error {
          color: #dc2626;
        }

        .result-message {
          color: #64748b;
          margin: 0 0 24px 0;
          font-size: 16px;
        }

        .result-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin: 24px 0;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .stat-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }

        .stat-number {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 4px 0;
          color: #1e293b;
        }

        .stat-label {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 500;
          margin: 0;
        }

        .result-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #f1f5f9;
          color: #475569;
        }
      `}</style>

      <div className="page-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/assets')}>
            <ArrowLeft size={20} />
            Back to Assets
          </button>
          <h1 className="page-title">CSV Bulk Import</h1>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={downloadTemplate}>
            <Download size={16} />
            Download Template
          </button>
        </div>
      </div>

      <div className="progress-indicator">
        <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-circle">1</div>
          <div className="step-label">Upload File</div>
        </div>
        <div className="step-connector"></div>
        <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="step-circle">2</div>
          <div className="step-label">Preview & Validate</div>
        </div>
        <div className="step-connector"></div>
        <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="step-circle">3</div>
          <div className="step-label">Import Complete</div>
        </div>
      </div>

      {currentStep === 1 && (
        <div className="content-section">
          <div className="section-header">
            <h2 className="section-title">Upload CSV File</h2>
            <p className="section-subtitle">
              Select a CSV, XLS, or XLSX file containing asset data to import. The file will be validated before import.
            </p>
          </div>
          <div className="section-content">
            <CSVUploader 
              onFileSelect={handleFileSelect}
              loading={processing}
            />
          </div>
        </div>
      )}

      {currentStep === 2 && parsedData && (
        <div className="content-section">
          <div className="section-header">
            <h2 className="section-title">Data Preview & Validation</h2>
            <p className="section-subtitle">
              Review your data and validation results before importing. Fix any issues or proceed with valid records only.
            </p>
          </div>
          <div className="section-content">
            <ImportPreview
              parsedData={parsedData}
              validationResults={validationResults}
              onValidationComplete={handleValidationComplete}
            />
            
            {validationSummary && (
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowConfirmDialog(true)}
                  style={{ marginRight: '12px' }}
                >
                  Proceed to Import
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={resetImport}
                >
                  Upload Different File
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {currentStep === 3 && importResults && (
        <div className="content-section">
          <div className="section-content">
            <div className="import-results">
              {importResults.success ? (
                <CheckCircle className="result-icon success" />
              ) : (
                <AlertCircle className="result-icon error" />
              )}
              
              <h2 className={`result-title ${importResults.success ? 'success' : 'error'}`}>
                {importResults.success ? 'Import Completed Successfully!' : 'Import Failed'}
              </h2>
              
              <p className="result-message">
                {importResults.success 
                  ? 'Your asset data has been imported and is now available in the system.'
                  : `Import failed: ${importResults.error || 'Unknown error occurred'}`
                }
              </p>

              {importResults.success && (
                <div className="result-stats">
                  <div className="stat-item">
                    <div className="stat-number">{importResults.imported || 0}</div>
                    <div className="stat-label">Imported</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{importResults.failed || 0}</div>
                    <div className="stat-label">Failed</div>
                  </div>
                </div>
              )}

              <div className="result-actions">
                <button className="btn btn-primary" onClick={goToAssets}>
                  View Assets
                </button>
                <button className="btn btn-secondary" onClick={resetImport}>
                  Import More Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ImportConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        validationSummary={validationSummary}
        parsedData={parsedData}
        onConfirmImport={handleConfirmImport}
        loading={importing}
      />
    </div>
  );
};

export default CSVImport;