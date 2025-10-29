import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info, ArrowRight } from 'lucide-react';

const ImportPreview = ({ parsedData, validationResults, onValidationComplete }) => {
  const [columnMapping, setColumnMapping] = useState({});
  const [validationSummary, setValidationSummary] = useState({
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    errors: []
  });

  // Define expected database fields and their display names
  const expectedFields = {
    'project_reference_num': 'Project Reference',
    'serial_number': 'Serial Number',
    'tag_id': 'Tag ID',
    'item_name': 'Item Name',
    'category': 'Category',
    'model': 'Model',
    'status': 'Status',
    'recipient_name': 'Recipient Name',
    'department_name': 'Department',
    'branch': 'Branch',
    'customer_name': 'Customer Name',
    'customer_reference_number': 'Customer Reference'
  };

  const requiredFields = ['project_reference_num', 'serial_number', 'tag_id', 'item_name'];

  useEffect(() => {
    if (parsedData && parsedData.length > 0) {
      // Auto-map columns based on header names
      const headers = Object.keys(parsedData[0]);
      const mapping = {};
      
      headers.forEach(header => {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
        // Try to find matching field
        const matchingField = Object.keys(expectedFields).find(field => 
          field === normalizedHeader || 
          field.includes(normalizedHeader) || 
          normalizedHeader.includes(field.replace(/_/g, ''))
        );
        if (matchingField) {
          mapping[header] = matchingField;
        }
      });
      
      setColumnMapping(mapping);
      calculateValidationSummary();
    }
  }, [parsedData, validationResults]);

  const calculateValidationSummary = () => {
    if (!parsedData || !validationResults) return;

    const totalRows = parsedData.length;
    const errors = [];
    let validRows = 0;

    parsedData.forEach((row, index) => {
      const rowErrors = validationResults[index] || [];
      if (rowErrors.length === 0) {
        validRows++;
      } else {
        errors.push({
          row: index + 1,
          errors: rowErrors
        });
      }
    });

    const summary = {
      totalRows,
      validRows,
      invalidRows: totalRows - validRows,
      errors: errors.slice(0, 10) // Show first 10 errors
    };

    setValidationSummary(summary);
    onValidationComplete(summary);
  };

  const getValidationIcon = (rowIndex) => {
    const rowErrors = validationResults?.[rowIndex] || [];
    if (rowErrors.length === 0) {
      return <CheckCircle className="validation-icon valid" />;
    } else {
      return <XCircle className="validation-icon invalid" />;
    }
  };

  const getFieldValidationStatus = (rowIndex, field) => {
    const rowErrors = validationResults?.[rowIndex] || [];
    const fieldError = rowErrors.find(error => error.field === field);
    return fieldError ? 'invalid' : 'valid';
  };

  const displayRows = parsedData?.slice(0, Math.min(20, parsedData.length)) || [];
  const totalRows = parsedData?.length || 0;

  if (!parsedData || parsedData.length === 0) {
    return (
      <div className="preview-empty">
        <Info className="empty-icon" />
        <h3>No Data to Preview</h3>
        <p>Upload a CSV file to see the data preview and validation results.</p>
      </div>
    );
  }

  return (
    <div className="import-preview">
      <style jsx>{`
        .import-preview {
          width: 100%;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }

        .preview-header {
          padding: 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .preview-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .preview-subtitle {
          color: #64748b;
          margin: 0;
          font-size: 14px;
        }

        .validation-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin: 16px 0;
        }

        .summary-item {
          text-align: center;
          padding: 12px;
          border-radius: 8px;
          background: white;
          border: 1px solid #e2e8f0;
        }

        .summary-number {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 4px 0;
        }

        .summary-number.total { color: #3b82f6; }
        .summary-number.valid { color: #22c55e; }
        .summary-number.invalid { color: #ef4444; }

        .summary-label {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 500;
          margin: 0;
        }

        .column-mapping {
          margin: 16px 0;
          padding: 16px;
          background: #f1f5f9;
          border-radius: 8px;
        }

        .mapping-title {
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 12px 0;
          font-size: 14px;
        }

        .mapping-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 8px;
        }

        .mapping-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .csv-column {
          color: #64748b;
          font-family: monospace;
        }

        .mapping-arrow {
          color: #94a3b8;
          width: 16px;
          height: 16px;
        }

        .db-field {
          color: #1e293b;
          font-weight: 500;
        }

        .db-field.required {
          color: #dc2626;
        }

        .preview-table-container {
          overflow-x: auto;
          max-height: 500px;
          overflow-y: auto;
        }

        .preview-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .preview-table th {
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          color: #1e293b;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .preview-table th:first-child {
          width: 60px;
          text-align: center;
        }

        .preview-table td {
          border-bottom: 1px solid #f1f5f9;
          padding: 8px;
          vertical-align: top;
        }

        .preview-table td:first-child {
          text-align: center;
          background: #f8fafc;
          font-weight: 500;
          color: #64748b;
          position: sticky;
          left: 0;
          z-index: 5;
        }

        .preview-table tr:hover {
          background: #f8fafc;
        }

        .preview-table tr.invalid {
          background: #fef2f2;
        }

        .preview-table tr.invalid:hover {
          background: #fecaca;
        }

        .cell-content {
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .cell-content.invalid {
          background: #fee2e2;
          color: #dc2626;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #fecaca;
        }

        .validation-icon {
          width: 16px;
          height: 16px;
        }

        .validation-icon.valid {
          color: #22c55e;
        }

        .validation-icon.invalid {
          color: #ef4444;
        }

        .row-more-indicator {
          text-align: center;
          padding: 16px;
          color: #64748b;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          font-style: italic;
        }

        .error-list {
          margin: 16px 0 0 0;
          padding: 16px;
          background: #fef2f2;
          border-radius: 8px;
          border: 1px solid #fecaca;
        }

        .error-list-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #dc2626;
          margin: 0 0 12px 0;
          font-size: 14px;
        }

        .error-item {
          margin: 8px 0;
          padding: 8px 12px;
          background: white;
          border-radius: 6px;
          border-left: 3px solid #ef4444;
        }

        .error-row {
          font-weight: 600;
          color: #1e293b;
          font-size: 12px;
        }

        .error-details {
          color: #64748b;
          font-size: 12px;
          margin: 4px 0 0 0;
        }

        .preview-empty {
          text-align: center;
          padding: 60px 20px;
          color: #64748b;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          color: #94a3b8;
        }

        .preview-empty h3 {
          font-size: 18px;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .preview-empty p {
          margin: 0;
        }
      `}</style>

      <div className="preview-header">
        <h3 className="preview-title">Data Preview & Validation</h3>
        <p className="preview-subtitle">
          {totalRows > 20 
            ? `Showing first 20 of ${totalRows} total records`
            : `Showing all ${totalRows} records`
          }
        </p>

        <div className="validation-summary">
          <div className="summary-item">
            <div className="summary-number total">{validationSummary.totalRows}</div>
            <div className="summary-label">Total Records</div>
          </div>
          <div className="summary-item">
            <div className="summary-number valid">{validationSummary.validRows}</div>
            <div className="summary-label">Valid Records</div>
          </div>
          <div className="summary-item">
            <div className="summary-number invalid">{validationSummary.invalidRows}</div>
            <div className="summary-label">Invalid Records</div>
          </div>
        </div>

        {Object.keys(columnMapping).length > 0 && (
          <div className="column-mapping">
            <h4 className="mapping-title">Column Mapping (CSV → Database)</h4>
            <div className="mapping-grid">
              {Object.entries(columnMapping).map(([csvColumn, dbField]) => (
                <div key={csvColumn} className="mapping-item">
                  <span className="csv-column">{csvColumn}</span>
                  <ArrowRight className="mapping-arrow" />
                  <span className={`db-field ${requiredFields.includes(dbField) ? 'required' : ''}`}>
                    {expectedFields[dbField] || dbField}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="preview-table-container">
        <table className="preview-table">
          <thead>
            <tr>
              <th>Row</th>
              {Object.keys(parsedData[0] || {}).map(header => (
                <th key={header}>
                  {header}
                  {columnMapping[header] && requiredFields.includes(columnMapping[header]) && (
                    <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>
                  )}
                </th>
              ))}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, index) => {
              const rowErrors = validationResults?.[index] || [];
              const isInvalid = rowErrors.length > 0;
              
              return (
                <tr key={index} className={isInvalid ? 'invalid' : ''}>
                  <td>{index + 1}</td>
                  {Object.entries(row).map(([key, value]) => {
                    const dbField = columnMapping[key];
                    const fieldStatus = getFieldValidationStatus(index, dbField);
                    
                    return (
                      <td key={key}>
                        <div className={`cell-content ${fieldStatus === 'invalid' ? 'invalid' : ''}`}>
                          {value || '—'}
                        </div>
                      </td>
                    );
                  })}
                  <td>
                    {getValidationIcon(index)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalRows > 20 && (
        <div className="row-more-indicator">
          ... and {totalRows - 20} more records
        </div>
      )}

      {validationSummary.errors.length > 0 && (
        <div className="error-list">
          <div className="error-list-title">
            <AlertTriangle />
            Validation Errors {validationSummary.errors.length > 10 && '(First 10)'}
          </div>
          {validationSummary.errors.map((error, index) => (
            <div key={index} className="error-item">
              <div className="error-row">Row {error.row}:</div>
              <div className="error-details">
                {error.errors.map(err => err.message).join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImportPreview;