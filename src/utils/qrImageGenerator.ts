import QRCode from 'qrcode';
import { StudentProfile } from '../types';

/**
 * Generates and downloads a clean, high-resolution QR code image with Hassty branding
 */
export async function downloadStudentQRImage(student: StudentProfile, filename?: string): Promise<void> {
  const canvas = document.createElement('canvas');
  const size = 600;
  canvas.width = size;
  canvas.height = size + 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top Branded Header Bar
  ctx.fillStyle = '#1E3A8A';
  ctx.fillRect(0, 0, canvas.width, 90);

  // Header Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('منصة حِصّتي — كود حضور الطالب', size / 2, 55);

  // Generate QR Canvas
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, student.qrCode, {
    width: 440,
    margin: 2,
    color: {
      dark: '#1E3A8A',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'H'
  });

  // Draw QR code centered
  ctx.drawImage(qrCanvas, (size - 440) / 2, 110);

  // Student Info Box at bottom
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(30, 560, size - 60, 160);
  
  // Border around info box
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 560, size - 60, 160);

  // Student Name
  ctx.fillStyle = '#1E3A8A';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(student.name, size / 2, 600);

  // Student Grade & City
  ctx.fillStyle = '#64748B';
  ctx.font = '18px sans-serif';
  ctx.fillText(`${student.grade} • ${student.governorate} (${student.area})`, size / 2, 635);

  // QR Code String
  ctx.fillStyle = '#2563EB';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(student.qrCode, size / 2, 680);

  // Trigger Download
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename || `hassty-qr-${student.qrCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates and downloads the full branded student card as a high-resolution PNG image
 */
export async function downloadFullStudentCardImage(student: StudentProfile, filename?: string): Promise<void> {
  const canvas = document.createElement('canvas');
  const width = 800;
  const height = 1100;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Base Gradient Background (Deep Navy)
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#1E3A8A');
  grad.addColorStop(1, '#0F172A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Card Outer Glow Border
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)';
  ctx.lineWidth = 10;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // 2. Header Section
  ctx.fillStyle = '#2563EB';
  ctx.beginPath();
  ctx.arc(100, 90, 35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('حِصّتي', width - 80, 95);

  ctx.fillStyle = '#93C5FD';
  ctx.font = '20px sans-serif';
  ctx.fillText('بطاقة طالب ذكية معتمدة 2026', width - 80, 130);

  // Header Divider
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 160);
  ctx.lineTo(width - 60, 160);
  ctx.stroke();

  // 3. Student Profile Info Box
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(60, 190, width - 120, 140);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(student.name, width - 100, 245);

  ctx.fillStyle = '#93C5FD';
  ctx.font = '22px sans-serif';
  ctx.fillText(student.grade, width - 100, 285);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = '18px sans-serif';
  ctx.fillText(`المحافظة: ${student.governorate} — ${student.area}`, width - 100, 315);

  // 4. White QR Container
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(120, 370, width - 240, 500);

  // QR Outer Border
  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 4;
  ctx.strokeRect(120, 370, width - 240, 500);

  // Generate QR
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, student.qrCode, {
    width: 380,
    margin: 2,
    color: {
      dark: '#1E3A8A',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'H'
  });

  ctx.drawImage(qrCanvas, (width - 380) / 2, 410);

  // QR Code label under QR code
  ctx.fillStyle = '#1E3A8A';
  ctx.font = 'bold 30px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(student.qrCode, width / 2, 830);

  // 5. Footer & Verification Bar
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 920);
  ctx.lineTo(width - 60, 920);
  ctx.stroke();

  ctx.fillStyle = '#10B981';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('✓ موثق رسمياً بنظام تتبع الحضور الذكي', width - 80, 970);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('العام الدراسي 2026/2027', 80, 970);

  ctx.fillStyle = '#64748B';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('احفظ هذه الصورة على هاتفك وأظهرها للمعلم عند كل حصة', width / 2, 1030);

  // Trigger Download
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename || `hassty-student-card-${student.name.replace(/\s+/g, '-')}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
