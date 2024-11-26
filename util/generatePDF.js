const PDFDocument = require('pdfkit');
const fs = require('fs');

/**
 * Generate a PDF with student details.
 * @param {Array} students - List of students.
 * @returns {Promise<Buffer>} - A Promise resolving to the PDF buffer.
 */
const generatePDF = (students) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();

    // Collect PDF data into a buffer
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });

    // Handle errors
    doc.on('error', reject);

    // Title
    doc.fontSize(20).text('Student Details', { align: 'center' });
    doc.moveDown();

    // Add Table Headers
    doc.fontSize(12).text('Name', 50, doc.y, { continued: true });
    doc.text('Class', 200, doc.y, { continued: true });
    doc.text('School', 300, doc.y, { continued: true });
    doc.text('Meal Preference', 400, doc.y);
    doc.moveDown();

    // Add a divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    // Populate rows
    students.forEach((student) => {
      doc.text(student.name, 50, doc.y, { continued: true });
      doc.text(student.class || '-', 200, doc.y, { continued: true });
      doc.text(student.school || '-', 300, doc.y, { continued: true });
      doc.text(student.mealPreference || 'N/A', 400, doc.y);
      doc.moveDown();
    });

    // End the PDF document
    doc.end();
  });
};

module.exports = { generatePDF };
