import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { BlockchainService } from '../services/blockchain.service';
import { QRService } from '../services/qr.service';
import { PDFService } from '../services/pdf.service';

const prisma = new PrismaClient();

export const issueCertificate = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let instId = user.institution_id;
    if (user.role === 'SUPER_ADMIN' && !instId) {
       const inst = await prisma.institution.findFirst();
       if (inst) instId = inst.id;
    }

    if (!instId) {
      return res.status(400).json({ message: 'User does not belong to an institution' });
    }

    const {
      student_id,
      certificate_type,
      course,
      department,
      grade,
      cgpa,
      passing_year,
      issue_date
    } = req.body;

    const student = await prisma.student.findUnique({
      where: { id: student_id }
    });

    if (!student || student.institution_id !== instId) {
      return res.status(404).json({ message: 'Student not found in this institution' });
    }

    const institution = await prisma.institution.findUnique({
      where: { id: instId }
    });

    if (!institution) return res.status(404).json({ message: 'Institution not found' });

    // Generate unique Certificate ID
    const count = await prisma.certificate.count({ where: { institution_id: institution.id } });
    const certNumber = (count + 1).toString().padStart(6, '0');
    const certificate_id = `CERT-${institution.code}-${passing_year}-${certNumber}`;

    const certDataForHash = {
      certificate_id,
      student_name: student.name,
      roll_number: student.roll_number,
      course: student.course,
      department: student.department,
      grade,
      cgpa,
      passing_year: passing_year.toString(),
      issued_by: institution.name,
      issue_date: new Date(issue_date).toISOString().split('T')[0]
    };

    const canonical = BlockchainService.canonicalize(certDataForHash);
    const certificate_hash = BlockchainService.calculateHash(canonical);
    const transaction_id = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Create DB record
    const certificate = await prisma.certificate.create({
      data: {
        certificate_id,
        student_id,
        institution_id: instId,
        certificate_type,
        course: student.course,
        department: student.department,
        grade,
        cgpa,
        passing_year: parseInt(passing_year),
        issue_date: new Date(issue_date),
        certificate_hash
      }
    });

    await BlockchainService.addCertificateBlock(
      certificate_id,
      certificate_hash,
      instId,
      transaction_id
    );

    res.status(201).json({
      message: 'Certificate issued successfully',
      certificate_id,
      certificate_hash,
      transaction_id
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getCertificates = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    let certificates;
    if (user.role === 'SUPER_ADMIN') {
      certificates = await prisma.certificate.findMany({ include: { student: true, institution: true }});
    } else if (user.role === 'COLLEGE_ADMIN') {
      certificates = await prisma.certificate.findMany({ 
        where: { institution_id: user.institution_id },
        include: { student: true, institution: true }
      });
    } else if (user.role === 'STUDENT') {
       // student user id can be matched to student record
       const student = await prisma.student.findUnique({ where: { email: user.email }});
       if (!student) return res.status(404).json({ message: 'Student profile not found' });
       
       certificates = await prisma.certificate.findMany({ 
        where: { student_id: student.id },
        include: { student: true, institution: true }
      });
    } else {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(certificates);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const downloadPDF = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const certificate = await prisma.certificate.findUnique({
      where: { certificate_id: id },
      include: { student: true, institution: true }
    });

    if (!certificate) return res.status(404).json({ message: 'Certificate not found' });

    // Ensure authorized to download
    const user = (req as any).user;
    if (user.role === 'COLLEGE_ADMIN' && certificate.institution_id !== user.institution_id) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    if (user.role === 'STUDENT') {
        const student = await prisma.student.findUnique({ where: { email: user.email }});
        if (!student || certificate.student_id !== student.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }
    }

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${certificate.certificate_id}`;
    const qrCodeBase64 = await QRService.generateQRCodeBase64(verifyUrl);

    const pdfBuffer = await PDFService.generateCertificatePDF({
      institutionName: certificate.institution.name,
      studentName: certificate.student.name,
      course: certificate.course,
      cgpa: certificate.cgpa,
      grade: certificate.grade,
      passingYear: certificate.passing_year,
      certificateId: certificate.certificate_id,
      issueDate: certificate.issue_date.toISOString().split('T')[0]
    }, qrCodeBase64);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate_${certificate.certificate_id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
};

export const revokeCertificate = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { reason } = req.body;
        const user = (req as any).user;

        const certificate = await prisma.certificate.findUnique({ where: { certificate_id: id }});
        if (!certificate) return res.status(404).json({ message: 'Certificate not found' });

        if (user.role === 'COLLEGE_ADMIN' && certificate.institution_id !== user.institution_id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        await prisma.$transaction(async (tx) => {
            await tx.certificate.update({
                where: { certificate_id: id },
                data: { status: 'REVOKED' }
            });
            await tx.revocation.create({
                data: {
                    certificate_id: id,
                    reason,
                    revoked_by: user.id
                }
            });
        });

        res.json({ message: 'Certificate revoked successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
