import QRCode from 'qrcode';

export class QRService {
  static async generateQRCodeBase64(data: string): Promise<string> {
    try {
      const url = await QRCode.toDataURL(data);
      return url;
    } catch (err) {
      console.error(err);
      throw new Error('Failed to generate QR Code');
    }
  }
}
