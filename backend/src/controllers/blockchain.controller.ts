import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { BlockchainService } from '../services/blockchain.service';

const prisma = new PrismaClient();

export const getBlockchain = async (req: Request, res: Response) => {
  try {
    const blocks = await prisma.blockchainBlock.findMany({
      orderBy: { block_index: 'asc' }
    });
    res.json(blocks);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const checkIntegrity = async (req: Request, res: Response) => {
  try {
    const result = await BlockchainService.verifyBlockchainIntegrity();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
