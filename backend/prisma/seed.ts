import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { BlockchainService } from '../src/services/blockchain.service';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Genesis Block
  await BlockchainService.createGenesisBlock();

  // Create Super Admin
  const superAdminExists = await prisma.user.findUnique({ where: { email: 'admin@system.com' } });
  if (!superAdminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'admin@system.com',
        password_hash: hashedPassword,
        role: 'SUPER_ADMIN'
      }
    });
    console.log('Super Admin created (admin@system.com / admin123)');
  }

  // Create Institution
  const mgmExists = await prisma.institution.findUnique({ where: { code: 'MGM' } });
  let mgm;
  if (!mgmExists) {
    mgm = await prisma.institution.create({
      data: {
        name: 'MGM University',
        code: 'MGM',
        email: 'info@mgm.edu',
        address: 'MGM Campus, City'
      }
    });
    console.log('Institution MGM created.');
  } else {
    mgm = mgmExists;
  }

  // Create College Admin
  const collegeAdminExists = await prisma.user.findUnique({ where: { email: 'admin@mgm.edu' } });
  if (!collegeAdminExists) {
    const hashedPassword = await bcrypt.hash('mgm123', 10);
    await prisma.user.create({
      data: {
        name: 'MGM Admin',
        email: 'admin@mgm.edu',
        password_hash: hashedPassword,
        role: 'COLLEGE_ADMIN',
        institution_id: mgm.id
      }
    });
    console.log('College Admin created (admin@mgm.edu / mgm123)');
  }

  // Create sample student
  const studentExists = await prisma.student.findUnique({ where: { email: 'nadeem@student.mgm.edu' } });
  if (!studentExists) {
    await prisma.student.create({
        data: {
            student_id: 'STU20270001',
            name: 'Nadeem Shaikh',
            roll_number: '101',
            enrollment_number: 'EN2027101',
            email: 'nadeem@student.mgm.edu',
            course: 'B.Tech CSE',
            department: 'Computer Science',
            admission_year: 2023,
            passing_year: 2027,
            institution_id: mgm.id
        }
    });
    
    const hashedPassword = await bcrypt.hash('student123', 10);
    await prisma.user.create({
        data: {
            name: 'Nadeem Shaikh',
            email: 'nadeem@student.mgm.edu',
            password_hash: hashedPassword,
            role: 'STUDENT',
            institution_id: mgm.id
        }
    });
    console.log('Sample Student created (nadeem@student.mgm.edu / student123)');
  }

  console.log('Seed completed successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
