import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    const emailConfig = this.configService.getEmailConfig();
    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
    });
  }

  async sendWelcomeEmail(
    to: string,
    companyName: string,
    displayName: string,
  ): Promise<void> {
    const mailOptions = {
      from: this.configService.get('EMAIL_USER'),
      to,
      subject: `Welcome to HRMS - ${displayName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to HRMS!</h2>
          <p>Dear ${companyName} Team,</p>
          <p>Congratulations! Your organization <strong>${displayName}</strong> has been successfully registered on our HRMS platform.</p>
          <p>You can now start managing your workforce efficiently with features like:</p>
          <ul>
            <li>Employee Management</li>
            <li>Attendance Tracking</li>
            <li>Admin Dashboard</li>
            <li>And much more!</li>
          </ul>
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>HRMS Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${to}:`, error);
      throw error;
    }
  }

  async sendPasswordSetupEmail(
    to: string,
    firstName: string,
    setupUrl: string,
  ): Promise<void> {
    const mailOptions = {
      from: this.configService.get('EMAIL_USER'),
      to,
      subject: 'Set Up Your HRMS Account Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome ${firstName}!</h2>
          <p>Your HRMS account has been created. To get started, please set up your password by clicking the link below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${setupUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Set Up Password
            </a>
          </div>
          <p>Or copy and paste this URL into your browser:</p>
          <p style="color: #666; word-break: break-all;">${setupUrl}</p>
          <p><strong>Note:</strong> This link will expire in 24 hours.</p>
          <p>If you didn't request this account, please ignore this email.</p>
          <p>Best regards,<br>HRMS Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password setup email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password setup email to ${to}:`, error);
      throw error;
    }
  }

  async sendOtpEmail(
    to: string,
    otp: string,
    companyName: string,
  ): Promise<void> {
    const mailOptions = {
      from: this.configService.get('EMAIL_USER'),
      to,
      subject: 'HRMS Registration - OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">OTP Verification</h2>
          <p>Hello,</p>
          <p>Thank you for registering <strong>${companyName}</strong> on HRMS.</p>
          <p>Your OTP for verification is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff;">
              ${otp}
            </div>
          </div>
          <p><strong>Note:</strong> This OTP will expire in 15 minutes.</p>
          <p>If you didn't request this registration, please ignore this email.</p>
          <p>Best regards,<br>HRMS Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`OTP email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}:`, error);
      throw error;
    }
  }
}
