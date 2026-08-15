// Quick test to check if email sending works with backend/.env.
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const required = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing email configuration: ${missing.join(', ')}`);
  process.exit(1);
}

const port = Number(process.env.EMAIL_PORT || 587);
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port,
  secure: port === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function testEmail() {
  const to = process.argv[2] || process.env.EMAIL_USER;

  try {
    console.log('Testing email configuration...');
    console.log('Host:', process.env.EMAIL_HOST);
    console.log('Port:', port);
    console.log('From:', process.env.EMAIL_FROM || process.env.EMAIL_USER);
    console.log('To:', to);

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: 'Test Email - Pragyan Verification System',
      text: 'This is a test email to verify your email configuration is working correctly.',
      html: '<b>This is a test email to verify your email configuration is working correctly.</b>',
    });

    console.log('Email sent successfully.');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (error) {
    console.error('Email test failed.');
    console.error('Error:', error instanceof Error ? error.message : error);
    if (error?.code) {
      console.error('Error Code:', error.code);
    }
    if (error?.response) {
      console.error('SMTP Response:', error.response);
    }
    process.exit(1);
  }
}

testEmail();
