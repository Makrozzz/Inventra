-- Performance Optimization Indexes for Inventra Database
-- Add indexes to improve query performance and reduce database load

-- ============================================
-- ASSET Table Indexes
-- ============================================

-- Index on Status for filtering active/inactive assets
CREATE INDEX IF NOT EXISTS idx_asset_status ON ASSET(Status);

-- Index on Category_ID for category-based queries
CREATE INDEX IF NOT EXISTS idx_asset_category ON ASSET(Category_ID);

-- Index on Model_ID for model-based queries
CREATE INDEX IF NOT EXISTS idx_asset_model ON ASSET(Model_ID);

-- Index on Recipients_ID for recipient-based queries
CREATE INDEX IF NOT EXISTS idx_asset_recipient ON ASSET(Recipients_ID);

-- Index on Project_ID for project-based asset queries
CREATE INDEX IF NOT EXISTS idx_asset_project ON ASSET(Project_ID);

-- Index on Serial Number for fast serial number lookups
CREATE INDEX IF NOT EXISTS idx_asset_serial ON ASSET(Asset_Serial_Number);

-- Index on Tag ID for fast tag lookups
CREATE INDEX IF NOT EXISTS idx_asset_tag ON ASSET(Asset_Tag_ID);

-- Composite index for common search queries (Status + Category)
CREATE INDEX IF NOT EXISTS idx_asset_search ON ASSET(Status, Category_ID, Model_ID);

-- ============================================
-- INVENTORY Table Indexes
-- ============================================

-- Index on Customer_ID for customer-based inventory queries
CREATE INDEX IF NOT EXISTS idx_inventory_customer ON INVENTORY(Customer_ID);

-- Index on Project_ID for project-based inventory queries
CREATE INDEX IF NOT EXISTS idx_inventory_project ON INVENTORY(Project_ID);

-- Index on Asset_ID for reverse lookups
CREATE INDEX IF NOT EXISTS idx_inventory_asset ON INVENTORY(Asset_ID);

-- Composite index for common inventory queries
CREATE INDEX IF NOT EXISTS idx_inventory_project_customer ON INVENTORY(Project_ID, Customer_ID);

-- ============================================
-- PROJECT Table Indexes
-- ============================================

-- Index on Project_Ref_Number for reference number lookups
CREATE INDEX IF NOT EXISTS idx_project_ref ON PROJECT(Project_Ref_Number);

-- Index on Solution_Principal_ID for SP-based queries
CREATE INDEX IF NOT EXISTS idx_project_sp ON PROJECT(Solution_Principal_ID);

-- ============================================
-- CUSTOMER Table Indexes
-- ============================================

-- Index on Customer_Ref_Number for reference lookups
CREATE INDEX IF NOT EXISTS idx_customer_ref ON CUSTOMER(Customer_Ref_Number);

-- Index on Branch for branch-based queries
CREATE INDEX IF NOT EXISTS idx_customer_branch ON CUSTOMER(Branch);

-- Index on Customer_Name for name-based searches
CREATE INDEX IF NOT EXISTS idx_customer_name ON CUSTOMER(Customer_Name);

-- ============================================
-- RECIPIENTS Table Indexes
-- ============================================

-- Index on Recipient_Name for name-based searches
CREATE INDEX IF NOT EXISTS idx_recipient_name ON RECIPIENTS(Recipient_Name);

-- Index on Department for department-based queries
CREATE INDEX IF NOT EXISTS idx_recipient_dept ON RECIPIENTS(Department);

-- ============================================
-- MODEL Table Indexes
-- ============================================

-- Index on Model_Name for model name searches
CREATE INDEX IF NOT EXISTS idx_model_name ON MODEL(Model_Name);

-- ============================================
-- CATEGORY Table Indexes
-- ============================================

-- Index on Category name for category searches
CREATE INDEX IF NOT EXISTS idx_category_name ON CATEGORY(Category);

-- ============================================
-- PERIPHERAL Table Indexes
-- ============================================

-- Index on Asset_ID for peripheral lookups by asset
CREATE INDEX IF NOT EXISTS idx_peripheral_asset ON PERIPHERAL(Asset_ID);

-- Index on Peripheral_Type_ID for type-based queries
CREATE INDEX IF NOT EXISTS idx_peripheral_type ON PERIPHERAL(Peripheral_Type_ID);

-- ============================================
-- PM (Preventive Maintenance) Table Indexes
-- ============================================

-- Index on Asset_ID for PM records lookup by asset
CREATE INDEX IF NOT EXISTS idx_pm_asset ON PMAINTENANCE(Asset_ID);

-- Index on PM_Date for date-based queries
CREATE INDEX IF NOT EXISTS idx_pm_date ON PMAINTENANCE(PM_Date);

-- Composite index for PM queries (Asset + Date)
CREATE INDEX IF NOT EXISTS idx_pm_asset_date ON PMAINTENANCE(Asset_ID, PM_Date);

-- ============================================
-- SOFTWARE Bridge Table Indexes
-- ============================================

-- Index on Asset_ID for software lookups by asset
CREATE INDEX IF NOT EXISTS idx_asset_software_asset ON ASSET_SOFTWARE_BRIDGE(Asset_ID);

-- Index on Software_ID for reverse lookups
CREATE INDEX IF NOT EXISTS idx_asset_software_software ON ASSET_SOFTWARE_BRIDGE(Software_ID);

-- ============================================
-- HISTORY_LOG Table Indexes (if exists)
-- ============================================

-- Index on Asset_ID for history lookups
CREATE INDEX IF NOT EXISTS idx_history_asset ON HISTORY_LOG(Asset_ID);

-- Index on Action for filtering by action type
CREATE INDEX IF NOT EXISTS idx_history_action ON HISTORY_LOG(Action);

-- Index on Created_At for chronological queries
CREATE INDEX IF NOT EXISTS idx_history_date ON HISTORY_LOG(Created_At);

-- ============================================
-- Verification
-- ============================================

-- Show all indexes created
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX
FROM 
    INFORMATION_SCHEMA.STATISTICS
WHERE 
    TABLE_SCHEMA = DATABASE()
    AND INDEX_NAME LIKE 'idx_%'
ORDER BY 
    TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
