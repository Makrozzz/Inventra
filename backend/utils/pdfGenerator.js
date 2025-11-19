const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const PMaintenance = require('../models/PMaintenance');
const { pool } = require('../config/database');

class PDFGenerator {
    constructor() {
        this.templatePath = path.join(__dirname, '../templates/pm-report-template.html');
        this.outputDir = path.join(__dirname, '../uploads/pm-reports');
        this.ensureDirectories();
    }

    async ensureDirectories() {
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
        } catch (error) {
            console.error('Error creating directories:', error);
        }
    }

    /**
     * Sanitize text for use in filenames
     * @param {string} text - Text to sanitize
     * @returns {string} - Sanitized text safe for filenames
     */
    sanitizeForFilename(text) {
        if (!text) return 'UNKNOWN';
        return text
            .replace(/\s+/g, '_')        // Replace spaces with underscores
            .replace(/[^a-zA-Z0-9_-]/g, '') // Remove special characters
            .toUpperCase()               // Convert to uppercase
            .substring(0, 50);           // Limit length to 50 characters
    }

    /**
     * Generate PDF report for a specific PM record
     * @param {number} pmId - The PM_ID from PMAINTENANCE table
     * @returns {Promise<Object>} - { success, filepath, filename, error }
     */
    async generatePMReport(pmId) {
        let browser;
        try {
            // 1. Fetch PM data with all details
            console.log(`Fetching PM data for PM_ID: ${pmId}`);
            const pmData = await PMaintenance.getDetailedPM(pmId);
            
            if (!pmData) {
                throw new Error(`PM record not found for PM_ID: ${pmId}`);
            }

            // 2. Get PM sequence number for this asset
            const pmSequenceNumber = await this.getPMSequenceNumber(pmId, pmData.Asset_ID);
            console.log(`This is PM #${pmSequenceNumber} for Asset_ID ${pmData.Asset_ID}`);

            // 3. Fetch checklist results
            const checklistResults = await this.getChecklistResults(pmId);
            
            // 4. Format data for template
            const templateData = this.formatDataForTemplate(pmData, checklistResults, pmSequenceNumber);

            // 4. Load and compile HTML template
            console.log('Loading HTML template...');
            const templateHtml = await fs.readFile(this.templatePath, 'utf8');
            const template = handlebars.compile(templateHtml);
            const html = template(templateData);

            // 5. Generate filename
            const timestamp = new Date().getTime();
            // Use Customer_Name if available, otherwise use 'UNKNOWN'
            const customerName = pmData.Customer_Name ? this.sanitizeForFilename(pmData.Customer_Name) : 'UNKNOWN';
            const filename = `PM_Report_${customerName}_${pmData.Asset_Serial_Number}_${timestamp}.pdf`;
            const filepath = path.join(this.outputDir, filename);
            
            console.log('Customer_Name from DB:', pmData.Customer_Name);
            console.log('Sanitized customer name:', customerName);
            console.log('Generated filename:', filename);

            // 6. Launch Puppeteer and generate PDF
            console.log('Launching Puppeteer to generate PDF...');
            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });

            await page.pdf({
                path: filepath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '10mm',
                    right: '10mm',
                    bottom: '10mm',
                    left: '10mm'
                }
            });

            console.log(`PDF generated successfully: ${filename}`);

            // 7. Update database with RELATIVE file path (not absolute)
            // Store relative path so it works across different developer machines
            const relativePath = path.join('uploads', 'pm-reports', filename);
            await this.updatePMFilePath(pmId, relativePath);

            return {
                success: true,
                filepath: relativePath,  // Return relative path
                filename: filename
            };

        } catch (error) {
            console.error('Error generating PDF:', error);
            return {
                success: false,
                error: error.message
            };
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    /**
     * Get PM sequence number for an asset (e.g., if this is the 3rd PM done on this asset, return 3)
     */
    async getPMSequenceNumber(pmId, assetId) {
        try {
            const query = `
                SELECT COUNT(*) as pm_count
                FROM PMAINTENANCE
                WHERE Asset_ID = ?
                AND PM_Date <= (SELECT PM_Date FROM PMAINTENANCE WHERE PM_ID = ?)
                ORDER BY PM_Date ASC
            `;
            
            const [result] = await pool.execute(query, [assetId, pmId]);
            
            return result[0].pm_count || 1;
        } catch (error) {
            console.error('Error getting PM sequence number:', error);
            return 1;
        }
    }

    /**
     * Get checklist results for a PM record
     */
    async getChecklistResults(pmId) {
        try {
            const query = `
                SELECT 
                    pmr.PM_Result_ID,
                    pmr.Is_OK_bool,
                    pmr.Remarks,
                    pmc.Check_Item
                FROM PM_RESULT pmr
                LEFT JOIN PM_CHECKLIST pmc ON pmr.Checklist_ID = pmc.Checklist_ID
                WHERE pmr.PM_ID = ?
                ORDER BY pmr.Checklist_ID
            `;
            
            const [results] = await pool.execute(query, [pmId]);
            
            console.log(`Found ${results.length} checklist items for PM_ID ${pmId}`);
            
            // Add index and ensure Is_OK_bool is boolean
            return results.map((item, index) => ({
                Check_Item: item.Check_Item || 'N/A',
                Is_OK_bool: item.Is_OK_bool === 1 || item.Is_OK_bool === true,
                Remarks: item.Remarks || null,
                index: index + 1
            }));
        } catch (error) {
            console.error('Error fetching checklist results:', error);
            return [];
        }
    }

    /**
     * Format data for Handlebars template
     */
    formatDataForTemplate(pmData, checklistResults, pmSequenceNumber = 1) {
        // Format date
        const pmDate = new Date(pmData.PM_Date);
        const formattedDate = pmDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        // Current date for footer
        const generatedDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Format status for CSS class
        let statusClass = 'in-process';
        if (pmData.Status) {
            statusClass = pmData.Status.toLowerCase().replace(/\s+/g, '-');
        }

        return {
            // PM Information
            PM_ID: pmData.PM_ID,
            PM_Sequence_Number: pmSequenceNumber,
            PM_Date_Formatted: formattedDate,
            Status: pmData.Status || 'In Process',
            Remarks: pmData.Remarks,

            // Asset Information
            Asset_Serial_Number: pmData.Asset_Serial_Number,
            Asset_Tag_ID: pmData.Asset_Tag_ID,
            Item_Name: pmData.Item_Name,
            Category: pmData.Category,
            Model: pmData.Model || '-',
            Asset_Status: pmData.Asset_Status || 'Active',
            Customer_Name: pmData.Customer_Name || 'N/A',

            // Recipient Information
            Recipient_Name: pmData.Recipient_Name || '-',
            Department: pmData.Department || '-',

            // Checklist Results
            checklist_results: checklistResults,

            // Footer
            Generated_Date: generatedDate
        };
    }

    /**
     * Update PMAINTENANCE table with generated PDF file path
     */
    async updatePMFilePath(pmId, filepath) {
        try {
            const query = `
                UPDATE PMAINTENANCE 
                SET file_path = ?
                WHERE PM_ID = ?
            `;
            
            await pool.execute(query, [filepath, pmId]);
            console.log(`Updated PM_ID ${pmId} with file path: ${filepath}`);
        } catch (error) {
            console.error('Error updating PM file path:', error);
            throw error;
        }
    }

    /**
     * Check if PDF exists for a PM record
     */
    async checkPDFExists(pmId) {
        try {
            const query = `SELECT file_path FROM PMAINTENANCE WHERE PM_ID = ?`;
            const [rows] = await pool.execute(query, [pmId]);
            
            if (rows.length > 0 && rows[0].file_path) {
                const filepath = rows[0].file_path;
                
                // Build absolute path from relative path stored in database
                const absolutePath = path.join(__dirname, '../', filepath);
                
                // Check if file actually exists on disk
                try {
                    await fs.access(absolutePath);
                    console.log(`✅ PDF exists locally: ${absolutePath}`);
                    return { exists: true, filepath };
                } catch {
                    console.log(`❌ PDF path in DB but file missing locally: ${absolutePath}`);
                    return { exists: false, filepath: null };
                }
            }
            
            return { exists: false, filepath: null };
        } catch (error) {
            console.error('Error checking PDF existence:', error);
            return { exists: false, filepath: null };
        }
    }
}

module.exports = new PDFGenerator();
