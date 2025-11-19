import React, { useState, useRef, useEffect } from 'react';
import ColumnConfigService from '../services/columnConfigService';

/**
 * ColumnFilterPopup - Right sidebar component for customizing table columns
 * Features:
 * - Toggle column visibility with checkboxes
 * - Drag-and-drop reordering
 * - Search/filter columns
 * - Reset to default
 * - Sidebar design with smooth slide animation
 */
const ColumnFilterPopup = ({ isOpen, onClose, columns, onApply }) => {
  const [localColumns, setLocalColumns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const popupRef = useRef(null);

  // Initialize local state when popup opens
  useEffect(() => {
    if (isOpen) {
      setLocalColumns([...columns]);
      setSearchTerm('');
    }
  }, [isOpen, columns]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Filter columns based on search term
  const filteredColumns = localColumns.filter(col =>
    col.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    col.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle drag start
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
    e.target.style.opacity = '0.4';
  };

  // Handle drag over
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  // Handle drag end
  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Handle drop
  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      return;
    }

    // Reorder columns
    const reordered = ColumnConfigService.reorderColumns(
      localColumns,
      draggedIndex,
      dropIndex
    );
    
    setLocalColumns(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Toggle column visibility
  const handleToggle = (columnKey) => {
    const updated = ColumnConfigService.toggleColumn(localColumns, columnKey);
    setLocalColumns(updated);
  };

  // Select all columns
  const handleSelectAll = () => {
    setLocalColumns(localColumns.map(col => ({ ...col, visible: true })));
  };

  // Deselect all columns
  const handleDeselectAll = () => {
    setLocalColumns(localColumns.map(col => ({ ...col, visible: false })));
  };

  // Reset to default configuration
  const handleReset = () => {
    const defaultConfig = ColumnConfigService.resetToDefault();
    setLocalColumns(defaultConfig);
  };

  // Apply changes and close
  const handleApply = () => {
    onApply(localColumns);
    onClose();
  };

  // Cancel and close without saving
  const handleCancel = () => {
    setLocalColumns([...columns]); // Reset to original
    onClose();
  };

  // Count visible columns
  const visibleCount = localColumns.filter(col => col.visible).length;

  if (!isOpen) return null;

  return (
    <div className="column-filter-overlay">
      <div className={`column-filter-sidebar ${isOpen ? 'column-filter-sidebar-open' : ''}`} ref={popupRef}>
        {/* Header */}
        <div className="column-filter-header">
          <h3>Customize Columns</h3>
          <button 
            className="column-filter-close-btn" 
            onClick={handleCancel}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Search bar */}
        <div className="column-filter-search">
          <input
            type="text"
            placeholder="Search columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="column-filter-search-input"
          />
          <span className="column-filter-search-icon">🔍</span>
        </div>

        {/* Action buttons */}
        <div className="column-filter-actions">
          <button onClick={handleSelectAll} className="column-filter-action-btn">
            ✓ Select All
          </button>
          <button onClick={handleDeselectAll} className="column-filter-action-btn">
            ✗ Deselect All
          </button>
          <button onClick={handleReset} className="column-filter-action-btn column-filter-reset-btn">
            ↻ Reset to Default
          </button>
        </div>

        {/* Column list */}
        <div className="column-filter-list-container">
          <div className="column-filter-list-header">
            <span className="column-filter-drag-hint">💡 Drag to reorder</span>
            <span className="column-filter-visible-count">
              {visibleCount} of {localColumns.length} visible
            </span>
          </div>

          <div className="column-filter-list">
            {filteredColumns.length === 0 ? (
              <div className="column-filter-no-results">
                No columns match "{searchTerm}"
              </div>
            ) : (
              filteredColumns.map((column, index) => (
                <div
                  key={column.key}
                  className={`column-filter-item ${
                    column.visible ? 'column-filter-item-visible' : ''
                  } ${
                    draggedIndex === index ? 'column-filter-item-dragging' : ''
                  } ${
                    dragOverIndex === index ? 'column-filter-item-drag-over' : ''
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  {/* Drag handle */}
                  <span className="column-filter-drag-handle" title="Drag to reorder">
                    ⋮⋮
                  </span>

                  {/* Checkbox */}
                  <label className="column-filter-checkbox-label">
                    <input
                      type="checkbox"
                      checked={column.visible}
                      onChange={() => handleToggle(column.key)}
                      className="column-filter-checkbox"
                    />
                    <span className="column-filter-label-text">{column.label}</span>
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer action buttons */}
        <div className="column-filter-footer">
          <div className="column-filter-footer-buttons">
            <button 
              className="column-filter-cancel-btn" 
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button 
              className="column-filter-apply-btn" 
              onClick={handleApply}
              disabled={visibleCount === 0}
            >
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnFilterPopup;
