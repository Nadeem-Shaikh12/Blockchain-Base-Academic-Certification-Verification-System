import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const addStudent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, roll_number, enrollment_number, email, course, department, admission_year, passing_year } = req.body;

    let instId = user.institution_id;
    if (user.role === 'SUPER_ADMIN' && !instId) {
       const inst = await prisma.institution.findFirst();
       if (inst) instId = inst.id;
    }

    if (!instId) {
      return res.status(400).json({ message: 'No institution associated' });
    }

    const count = await prisma.student.count({ where: { institution_id: instId } });
    const student_id = `STU${passing_year}${(count + 1).toString().padStart(4, '0')}`;

    const student = await prisma.student.create({
      data: {
        student_id,
        name,
        roll_number,
        enrollment_number,
        email,
        course,
        department,
        admission_year: parseInt(admission_year),
        passing_year: parseInt(passing_year),
        institution_id: instId
      }
    });

    res.status(201).json(student);
  } catch (error: any) {
    console.error('ADD STUDENT ERROR:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Duplicate roll number, enrollment number or email.' });
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getStudents = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let instId = user.institution_id;
    if (user.role === 'SUPER_ADMIN' && !instId) {
       const inst = await prisma.institution.findFirst();
       if (inst) instId = inst.id;
    }

    let whereClause = {};
    if (instId) {
       whereClause = { institution_id: instId };
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: { _count: { select: { certificates: true } } }
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
