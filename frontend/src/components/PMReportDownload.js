import React from 'react';
import { Download } from 'lucide-react';

/**
 * Component for downloading PM reports as PDF
 * Can be integrated into PMDetail.js, PreventiveMaintenance.js, or AssetDetail.js
 */
const PMReportDownload = ({ pmId, assetSerialNumber, customerName, variant = 'default', hasExistingPDF = false }) => {
  const [downloading, setDownloading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [pdfExists, setPdfExists] = React.useState(hasExistingPDF);

  // Sanitize customer name for filename
  const sanitizeForFilename = (text) => {
    if (!text) return 'UNKNOWN';
    return text
      .replace(/\s+/g, '_')        // Spaces → underscores
      .replace(/[^a-zA-Z0-9_-]/g, '') // Remove special characters
      .toUpperCase()               // Uppercase
      .substring(0, 50);           // Limit length
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError(null);

      // Fetch PDF from backend
      const response = await fetch(`http://localhost:5000/api/v1/pm/${pmId}/report`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/pdf',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download PM report');
      }

      // Get filename from Content-Disposition header or generate with customer name
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // If no filename from header, construct it with customer name
      if (!filename) {
        const sanitizedCustomer = sanitizeForFilename(customerName);
        filename = `PM_Report_${sanitizedCustomer}_${assetSerialNumber}_${Date.now()}.pdf`;
      }

      // Convert response to blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('PDF downloaded successfully');
      
      // After successful generation/download, mark that PDF now exists
      setPdfExists(true);
    } catch (err) {
      console.error('Error downloading PM report:', err);
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  // Styling based on variant (default or light for green box)
  const getButtonStyle = () => {
    const baseStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      border: 'none',
      borderRadius: '6px',
      cursor: downloading ? 'not-allowed' : 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s',
    };

    if (variant === 'light') {
      return {
        ...baseStyle,
        backgroundColor: downloading ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.9)',
        color: downloading ? '#95a5a6' : '#27ae60',
        border: '2px solid rgba(255, 255, 255, 0.5)',
      };
    }

    return {
      ...baseStyle,
      backgroundColor: downloading ? '#9ca3af' : '#667eea',
      color: 'white',
    };
  };

  const handleMouseOver = (e) => {
    if (!downloading) {
      if (variant === 'light') {
        e.target.style.backgroundColor = 'rgba(255, 255, 255, 1)';
        e.target.style.transform = 'scale(1.02)';
      } else {
        e.target.style.backgroundColor = '#5568d3';
      }
    }
  };

  const handleMouseOut = (e) => {
    if (!downloading) {
      if (variant === 'light') {
        e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        e.target.style.transform = 'scale(1)';
      } else {
        e.target.style.backgroundColor = '#667eea';
      }
    }
  };

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={downloading}
        style={getButtonStyle()}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      >
        <Download size={18} />
        {downloading 
          ? (pdfExists ? 'Downloading PDF...' : 'Generating PDF...') 
          : (pdfExists ? 'Download Form' : 'Generate Form')
        }
      </button>

      {error && (
        <div
          style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default PMReportDownload;

/**
 * USAGE EXAMPLES:
 * 
 * 1. In PMDetail.js (PM detail page - light variant for green box):
 * 
 *    import PMReportDownload from '../components/PMReportDownload';
 * 
 *    // In the green PM Overview Card:
 *    <PMReportDownload 
 *      pmId={pmDetail.PM_ID} 
 *      assetSerialNumber={pmDetail.Asset_Serial_Number}
 *      variant="light"
 *      hasExistingPDF={pmDetail.file_path ? true : false}
 *    />
 * 
 * 2. In PreventiveMaintenance.js (PM list page):
 * 
 *    import PMReportDownload from '../components/PMReportDownload';
 * 
 *    // Inside the PM card or row:
 *    <PMReportDownload 
 *      pmId={pm.PM_ID} 
 *      assetSerialNumber={pm.Asset_Serial_Number}
 *      hasExistingPDF={pm.file_path ? true : false}
 *    />
 * 
 * 3. In AssetDetail.js (Asset PM history):
 * 
 *    import PMReportDownload from '../components/PMReportDownload';
 * 
 *    // In each PM record row:
 *    {pmHistory.map(pm => (
 *      <div key={pm.PM_ID}>
 *        <span>{pm.PM_Date}</span>
 *        <PMReportDownload 
 *          pmId={pm.PM_ID} 
 *          assetSerialNumber={asset.Asset_Serial_Number}
 *          hasExistingPDF={pm.file_path ? true : false}
 *        />
 *      </div>
 *    ))}
 * 
 * PROPS:
 * - pmId: PM record ID (required)
 * - assetSerialNumber: Asset serial number for filename (required)
 * - variant: 'default' (purple) or 'light' (white with green text) (optional, default: 'default')
 * - hasExistingPDF: Boolean indicating if PDF already exists (optional, default: false)
 *   - true: Shows "Download Form" button (downloads existing PDF)
 *   - false: Shows "Generate Form" button (generates new PDF then downloads)
 */
