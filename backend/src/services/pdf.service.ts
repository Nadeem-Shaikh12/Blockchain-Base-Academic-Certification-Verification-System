import PDFDocument from 'pdfkit';

export class PDFService {
  static async generateCertificatePDF(certData: any, qrCodeBase64: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margin: 50
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });

        // Add border
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#111827');
        doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50).stroke('#4F46E5');

        // Header
        doc.font('Helvetica-Bold').fontSize(32).fillColor('#111827').text(certData.institutionName, { align: 'center' });
        doc.moveDown(0.5);
        
        doc.font('Helvetica-Oblique').fontSize(24).text('CERTIFICATE OF DEGREE', { align: 'center' });
        doc.moveDown(1);
        
        doc.font('Helvetica').fontSize(16).text('This is to certify that', { align: 'center' });
        doc.moveDown(0.5);
        
        doc.font('Helvetica-Bold').fontSize(28).fillColor('#4F46E5').text(certData.studentName, { align: 'center' });
        doc.moveDown(0.5);
        
        doc.font('Helvetica').fontSize(16).fillColor('#111827').text('has successfully completed', { align: 'center' });
        doc.moveDown(0.5);
        
        doc.font('Helvetica-Bold').fontSize(20).text(certData.course, { align: 'center' });
        doc.moveDown(0.5);
        
        doc.font('Helvetica').fontSize(16).text(`with CGPA: ${certData.cgpa} / Grade: ${certData.grade}`, { align: 'center' });
        doc.moveDown(0.5);
        
        doc.text(`Passing Year: ${certData.passingYear}`, { align: 'center' });
        doc.moveDown(2);

        // QR Code and ID
        doc.fontSize(12).text(`Certificate ID: ${certData.certificateId}`, 50, doc.page.height - 150);
        doc.text(`Issued Date: ${certData.issueDate}`, 50, doc.page.height - 130);
        
        doc.text('Authorized Signature', doc.page.width - 250, doc.page.height - 130, { align: 'center' });
        doc.moveTo(doc.page.width - 250, doc.page.height - 140).lineTo(doc.page.width - 50, doc.page.height - 140).stroke();

        // Add QR Code
        const qrImageBuffer = Buffer.from(qrCodeBase64.split(',')[1], 'base64');
        doc.image(qrImageBuffer, doc.page.width / 2 - 50, doc.page.height - 170, { width: 100 });
        doc.fontSize(10).text('Scan to verify certificate authenticity', doc.page.width / 2 - 100, doc.page.height - 60, { width: 200, align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
