import React from 'react';
import { Package, Cpu, HardDrive, Monitor, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import './NewOptionsDialog.css';

const NewOptionsDialog = ({ newOptions, onConfirm, onCancel }) => {
  if (!newOptions) {
    console.warn('NewOptionsDialog: newOptions is null or undefined');
    return null;
  }

  const { categories = [], models = [], software = [], windows = [], office = [] } = newOptions;
  
  const totalNewOptions = 
    categories.length + 
    models.length + 
    software.length + 
    windows.length + 
    office.length;

  console.log('NewOptionsDialog rendering with:', { 
    totalNewOptions, 
    categories: categories.length,
    models: models.length,
    software: software.length,
    windows: windows.length,
    office: office.length
  });

  if (totalNewOptions === 0) {
    console.log('NewOptionsDialog: No new options to display');
    return null;
  }

  const OptionSection = ({ icon: Icon, title, items, color }) => {
    if (items.length === 0) return null;

    return (
      <div className="option-section">
        <div className="option-section-header" style={{ borderLeftColor: color }}>
          <Icon size={18} color={color} />
          <h4>{title} ({items.length})</h4>
        </div>
        <div className="option-items">
          {items.map((item, index) => (
            <div key={index} className="option-item">
              <CheckCircle size={14} color={color} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="new-options-overlay">
      <div className="new-options-dialog">
        <div className="dialog-header">
          <div className="dialog-header-content">
            <AlertCircle size={28} color="#f59e0b" />
            <div>
              <h2>New Options Detected</h2>
              <p>The following {totalNewOptions} new option{totalNewOptions !== 1 ? 's' : ''} will be created during import:</p>
            </div>
          </div>
        </div>

        <div className="dialog-body">
          <div className="new-options-info">
            <div className="info-badge">
              <Package size={16} />
              <span>These options will be automatically added to the database and available for future use.</span>
            </div>
          </div>

          <div className="options-container">
            <OptionSection 
              icon={Package}
              title="Categories"
              items={categories}
              color="#10b981"
            />
            
            <OptionSection 
              icon={Cpu}
              title="Models"
              items={models}
              color="#3b82f6"
            />
            
            <OptionSection 
              icon={HardDrive}
              title="Software"
              items={software}
              color="#8b5cf6"
            />
            
            <OptionSection 
              icon={Monitor}
              title="Windows Versions"
              items={windows}
              color="#06b6d4"
            />
            
            <OptionSection 
              icon={FileText}
              title="Microsoft Office Versions"
              items={office}
              color="#f59e0b"
            />
          </div>
        </div>

        <div className="dialog-footer">
          <button 
            className="btn-cancel"
            onClick={onCancel}
          >
            Cancel Import
          </button>
          <button 
            className="btn-confirm"
            onClick={onConfirm}
          >
            <CheckCircle size={18} />
            Confirm & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewOptionsDialog;
