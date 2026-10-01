import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import certificateRoutes from './routes/certificate.routes';
import blockchainRoutes from './routes/blockchain.routes';
import verificationRoutes from './routes/verification.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/verify', verificationRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend is running' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
