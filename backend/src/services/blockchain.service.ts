import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BlockchainService {
  
  static canonicalize(data: any): string {
    const sorted = Object.keys(data).sort().reduce((acc: any, key) => {
      acc[key] = data[key];
      return acc;
    }, {});
    return JSON.stringify(sorted);
  }

  static calculateHash(dataStr: string): string {
    return crypto.createHash('sha256').update(dataStr).digest('hex');
  }

  static calculateBlockHash(
    index: number,
    transaction_id: string,
    certificate_id: string,
    certificate_hash: string,
    previous_hash: string,
    timestamp: Date,
    issuer_id: string
  ): string {
    const dataString = `${index}${transaction_id}${certificate_id}${certificate_hash}${previous_hash}${timestamp.toISOString()}${issuer_id}`;
    return this.calculateHash(dataString);
  }

  static async createGenesisBlock() {
    const genesisExists = await prisma.blockchainBlock.findUnique({
      where: { block_index: 0 }
    });

    if (!genesisExists) {
      const timestamp = new Date();
      const currentHash = this.calculateBlockHash(
        0, 'GENESIS', 'GENESIS', 'GENESIS', '0'.repeat(64), timestamp, 'SYSTEM'
      );
      
      await prisma.blockchainBlock.create({
        data: {
          block_index: 0,
          block_id: 'GENESIS',
          transaction_id: 'GENESIS',
          certificate_id: 'GENESIS',
          certificate_hash: 'GENESIS',
          previous_hash: '0'.repeat(64),
          current_hash: currentHash,
          issuer_id: 'SYSTEM',
          timestamp: timestamp,
          status: 'VALID'
        }
      });
      console.log('Genesis block created.');
    }
  }

  static async addCertificateBlock(
    certificate_id: string,
    certificate_hash: string,
    issuer_id: string,
    transaction_id: string
  ) {
    const lastBlock = await prisma.blockchainBlock.findFirst({
      orderBy: { block_index: 'desc' }
    });

    if (!lastBlock) {
      throw new Error('Blockchain is not initialized with Genesis block.');
    }

    const index = lastBlock.block_index + 1;
    const block_id = `BLK${index.toString().padStart(6, '0')}`;
    const timestamp = new Date();
    
    const current_hash = this.calculateBlockHash(
      index,
      transaction_id,
      certificate_id,
      certificate_hash,
      lastBlock.current_hash,
      timestamp,
      issuer_id
    );

    const newBlock = await prisma.blockchainBlock.create({
      data: {
        block_index: index,
        block_id,
        transaction_id,
        certificate_id,
        certificate_hash,
        previous_hash: lastBlock.current_hash,
        current_hash,
        issuer_id,
        timestamp,
        status: 'VALID'
      }
    });

    return newBlock;
  }

  static async verifyBlockchainIntegrity() {
    const blocks = await prisma.blockchainBlock.findMany({
      orderBy: { block_index: 'asc' }
    });

    let validBlocks = 0;
    let invalidBlocks = 0;
    let affectedBlock = null;
    let reason = null;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      // Check 1: Recalculate block hash
      const recalculatedHash = this.calculateBlockHash(
        block.block_index,
        block.transaction_id,
        block.certificate_id,
        block.certificate_hash,
        block.previous_hash,
        block.timestamp,
        block.issuer_id
      );

      if (recalculatedHash !== block.current_hash) {
        invalidBlocks++;
        affectedBlock = block.block_index;
        reason = "Current hash mismatch";
        break;
      }

      // Check 2: Check previous hash linkage
      if (i > 0) {
        const previousBlock = blocks[i - 1];
        if (block.previous_hash !== previousBlock.current_hash) {
          invalidBlocks++;
          affectedBlock = block.block_index;
          reason = "Previous hash mismatch / Broken chain";
          break;
        }
      } else {
        // Genesis block check
        if (block.previous_hash !== '0'.repeat(64)) {
          invalidBlocks++;
          affectedBlock = block.block_index;
          reason = "Genesis block invalid previous hash";
          break;
        }
      }

      validBlocks++;
    }

    // Check certificate hashes against DB records
    if (invalidBlocks === 0) {
      for (const block of blocks) {
        if (block.certificate_id === 'GENESIS') continue;
        
        const cert = await prisma.certificate.findUnique({
          where: { certificate_id: block.certificate_id },
          include: { student: true, institution: true }
        });

        if (cert) {
           const certData = {
              certificate_id: cert.certificate_id,
              student_name: cert.student.name,
              roll_number: cert.student.roll_number,
              course: cert.course,
              department: cert.department,
              grade: cert.grade,
              cgpa: cert.cgpa,
              passing_year: cert.passing_year.toString(),
              issued_by: cert.institution.name,
              issue_date: cert.issue_date.toISOString().split('T')[0]
           };
           const canonical = this.canonicalize(certData);
           const certHash = this.calculateHash(canonical);
           
           if (certHash !== block.certificate_hash) {
              invalidBlocks++;
              affectedBlock = block.block_index;
              reason = "Certificate data mismatch with stored hash";
              break;
           }
        }
      }
    }

    return {
      totalBlocks: blocks.length,
      validBlocks,
      invalidBlocks,
      isValid: invalidBlocks === 0,
      affectedBlock,
      reason
    };
  }
}
