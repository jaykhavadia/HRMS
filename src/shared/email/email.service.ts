import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private isConnected: boolean = false;

  constructor(private configService: ConfigService) {
    const emailConfig = this.configService.getEmailConfig();
    
    this.logger.log('=== Email Service Initialization ===');
    this.logger.log(`SMTP Host: ${emailConfig.host}`);
    this.logger.log(`SMTP Port: ${emailConfig.port}`);
    this.logger.log(`SMTP Secure: ${emailConfig.secure}`);
    this.logger.log(`SMTP User: ${emailConfig.auth.user || 'NOT SET'}`);
    this.logger.log(`SMTP Password: ${emailConfig.auth.pass ? '***SET***' : 'NOT SET'}`);

    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
    });
  }

  async onModuleInit() {
    await this.verifyConnection();
  }

  /**
   * Verify SMTP connection on startup
   */
  private async verifyConnection() {
    try {
      this.logger.log('🔄 Verifying SMTP connection...');
      await this.transporter.verify();
      this.isConnected = true;
      this.logger.log(`✅ Email service connected successfully to ${this.configService.get('EMAIL_HOST') || 'smtp.gmail.com'}`);
      this.logger.log('✅ Email service is ready to send emails');
    } catch (error: any) {
      this.isConnected = false;
      this.logger.error('❌ Email service connection failed!');
      this.logger.error(`   Error: ${error.message}`);
      
      if (error.code === 'EAUTH') {
        this.logger.error('   Authentication failed - check EMAIL_USER and EMAIL_PASSWORD');
      } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
        this.logger.error('   Connection timeout - check EMAIL_HOST and EMAIL_PORT');
        this.logger.error('   Ensure firewall allows outbound connections on port 587');
      } else if (error.code === 'ENOTFOUND') {
        this.logger.error('   Host not found - check EMAIL_HOST is correct');
      }
      
      this.logger.warn('⚠️  Email sending will fail until connection is fixed');
      // Don't throw - allow app to start but email sending will fail
    }
  }

  async sendWelcomeEmail(
    to: string,
    companyName: string,
    displayName: string,
  ): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn(`⚠️  Attempting to send welcome email but SMTP connection is not verified`);
    }

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

    this.logger.log(`📧 Attempting to send welcome email to: ${to}`);
    this.logger.debug(`   Subject: Welcome to HRMS - ${displayName}`);
    this.logger.debug(`   From: ${mailOptions.from}`);

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Welcome email sent successfully to ${to}`);
      this.logger.debug(`   Message ID: ${info.messageId}`);
      if (info.response) {
        this.logger.debug(`   Server Response: ${info.response}`);
      }
    } catch (error: any) {
      this.logger.error(`❌ Failed to send welcome email to ${to}`);
      this.logger.error(`   Error: ${error.message}`);
      this.logger.error(`   Error Code: ${error.code || 'N/A'}`);
      if (error.response) {
        this.logger.error(`   Server Response: ${error.response}`);
      }
      if (error.responseCode) {
        this.logger.error(`   Response Code: ${error.responseCode}`);
      }
      throw error;
    }
  }

  async sendPasswordSetupEmail(
    to: string,
    firstName: string,
    setupUrl: string,
  ): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn(`⚠️  Attempting to send password setup email but SMTP connection is not verified`);
    }

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

    this.logger.log(`📧 Attempting to send password setup email to: ${to}`);
    this.logger.debug(`   Subject: Set Up Your HRMS Account Password`);
    this.logger.debug(`   From: ${mailOptions.from}`);
    this.logger.debug(`   Recipient: ${firstName} (${to})`);

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Password setup email sent successfully to ${to}`);
      this.logger.debug(`   Message ID: ${info.messageId}`);
      if (info.response) {
        this.logger.debug(`   Server Response: ${info.response}`);
      }
    } catch (error: any) {
      this.logger.error(`❌ Failed to send password setup email to ${to}`);
      this.logger.error(`   Error: ${error.message}`);
      this.logger.error(`   Error Code: ${error.code || 'N/A'}`);
      if (error.response) {
        this.logger.error(`   Server Response: ${error.response}`);
      }
      if (error.responseCode) {
        this.logger.error(`   Response Code: ${error.responseCode}`);
      }
      throw error;
    }
  }

  async sendOtpEmail(
    to: string,
    otp: string,
    companyName: string,
  ): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn(`⚠️  Attempting to send OTP email but SMTP connection is not verified`);
    }

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

    this.logger.log(`📧 Attempting to send OTP email to: ${to}`);
    this.logger.debug(`   Subject: HRMS Registration - OTP Verification`);
    this.logger.debug(`   From: ${mailOptions.from}`);
    this.logger.debug(`   Company: ${companyName}`);
    this.logger.debug(`   OTP: ${otp}`);

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ OTP email sent successfully to ${to}`);
      this.logger.debug(`   Message ID: ${info.messageId}`);
      if (info.response) {
        this.logger.debug(`   Server Response: ${info.response}`);
      }
    } catch (error: any) {
      this.logger.error(`❌ Failed to send OTP email to ${to}`);
      this.logger.error(`   Error: ${error.message}`);
      this.logger.error(`   Error Code: ${error.code || 'N/A'}`);
      if (error.response) {
        this.logger.error(`   Server Response: ${error.response}`);
      }
      if (error.responseCode) {
        this.logger.error(`   Response Code: ${error.responseCode}`);
      }
      throw error;
    }
  }
}
