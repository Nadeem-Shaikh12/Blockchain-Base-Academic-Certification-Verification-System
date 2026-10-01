import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { BlockchainService } from '../services/blockchain.service';

const prisma = new PrismaClient();

export const verifyCertificate = async (req: Request, res: Response) => {
  try {
    const certificateId = req.params.certificateId as string;

    const certificate = await prisma.certificate.findUnique({
      where: { certificate_id: certificateId },
      include: { student: true, institution: true }
    });

    if (!certificate) {
      return res.status(404).json({ status: 'NOT_FOUND', message: 'Certificate not found' });
    }

    const block = await prisma.blockchainBlock.findFirst({
      where: { certificate_id: certificateId }
    });

    if (!block) {
      return res.status(500).json({ status: 'INVALID_BLOCKCHAIN', message: 'Blockchain record missing' });
    }

    if (certificate.status === 'REVOKED') {
      return res.json({
        status: 'REVOKED',
        certificate: {
          certificate_id: certificate.certificate_id,
          student_name: certificate.student.name,
          course: certificate.course,
          department: certificate.department,
          grade: certificate.grade,
          cgpa: certificate.cgpa,
          passing_year: certificate.passing_year,
          issued_by: certificate.institution.name,
          issue_date: certificate.issue_date,
        },
        message: 'This certificate was revoked by the issuing institution.'
      });
    }

    if (certificate.status === 'SUPERSEDED') {
      return res.json({ status: 'SUPERSEDED', message: 'This certificate has been superseded.' });
    }

    const certData = {
      certificate_id: certificate.certificate_id,
      student_name: certificate.student.name,
      roll_number: certificate.student.roll_number,
      course: certificate.course,
      department: certificate.department,
      grade: certificate.grade,
      cgpa: certificate.cgpa,
      passing_year: certificate.passing_year.toString(),
      issued_by: certificate.institution.name,
      issue_date: certificate.issue_date.toISOString().split('T')[0]
    };

    const canonical = BlockchainService.canonicalize(certData);
    const recalculatedHash = BlockchainService.calculateHash(canonical);

    if (recalculatedHash !== block.certificate_hash) {
      return res.json({
        status: 'TAMPERED',
        certificate: {
          certificate_id: certificate.certificate_id,
        },
        message: 'The certificate information does not match the cryptographic record stored by the institution.'
      });
    }

    // Record verification log
    await prisma.verificationLog.create({
      data: {
        certificate_id: certificateId,
        verification_type: 'PUBLIC',
        result: 'VERIFIED',
        ip_address: req.ip
      }
    });

    return res.json({
      status: 'VERIFIED',
      certificate: {
        certificate_id: certificate.certificate_id,
        student_name: certificate.student.name,
        course: certificate.course,
        department: certificate.department,
        grade: certificate.grade,
        cgpa: certificate.cgpa,
        passing_year: certificate.passing_year,
        issued_by: certificate.institution.name,
        issue_date: certificate.issue_date,
      },
      blockchain: {
        status: 'VALID',
        hash_status: 'MATCHED'
      }
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
  }
};
