/**
 * Email Notification Service
 * 
 * Handles sending email notifications for:
 * - Compliance analysis completion
 * - Critical issues found
 * - Report generation
 * - Subscription alerts
 */

import { notifyOwner } from '../_core/notification';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface ComplianceAlertPayload {
  userEmail: string;
  userName: string;
  projectName: string;
  analysisId: string;
  compliant: boolean;
  issueCount: number;
  criticalIssues: number;
  reportUrl?: string;
}

interface ReportGeneratedPayload {
  userEmail: string;
  userName: string;
  projectName: string;
  reportId: string;
  reportUrl: string;
  format: 'pdf' | 'json';
}

interface SubscriptionAlertPayload {
  userEmail: string;
  userName: string;
  alertType: 'upgrade_available' | 'renewal_reminder' | 'cancellation_confirmed';
  planName?: string;
  renewalDate?: Date;
}

export class EmailNotificationService {
  /**
   * Send compliance analysis completion notification
   */
  static async sendComplianceAlert(payload: ComplianceAlertPayload): Promise<boolean> {
    try {
      const template = this.buildComplianceTemplate(payload);
      
      // Send to user
      await this.sendEmail(payload.userEmail, template);
      
      // Notify owner if critical issues found
      if (payload.criticalIssues > 0) {
        await notifyOwner({
          title: `Critical Issues Found - ${payload.projectName}`,
          content: `User ${payload.userName} has ${payload.criticalIssues} critical compliance issues in project "${payload.projectName}". Analysis ID: ${payload.analysisId}`,
        });
      }
      
      return true;
    } catch (error) {
      console.error('[EmailNotificationService] Failed to send compliance alert:', error);
      return false;
    }
  }

  /**
   * Send report generation notification
   */
  static async sendReportGenerated(payload: ReportGeneratedPayload): Promise<boolean> {
    try {
      const template = this.buildReportTemplate(payload);
      await this.sendEmail(payload.userEmail, template);
      
      // Notify owner
      await notifyOwner({
        title: `Report Generated - ${payload.projectName}`,
        content: `User ${payload.userName} generated a ${payload.format.toUpperCase()} report for project "${payload.projectName}". Report ID: ${payload.reportId}`,
      });
      
      return true;
    } catch (error) {
      console.error('[EmailNotificationService] Failed to send report notification:', error);
      return false;
    }
  }

  /**
   * Send subscription alert
   */
  static async sendSubscriptionAlert(payload: SubscriptionAlertPayload): Promise<boolean> {
    try {
      const template = this.buildSubscriptionTemplate(payload);
      await this.sendEmail(payload.userEmail, template);
      return true;
    } catch (error) {
      console.error('[EmailNotificationService] Failed to send subscription alert:', error);
      return false;
    }
  }

  /**
   * Build compliance alert email template
   */
  private static buildComplianceTemplate(payload: ComplianceAlertPayload): EmailTemplate {
    const statusColor = payload.compliant ? '#22c55e' : '#ef4444';
    const statusText = payload.compliant ? 'COMPLIANT' : 'NON-COMPLIANT';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .status { color: ${statusColor}; font-weight: bold; font-size: 18px; }
            .summary { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .issues { margin: 20px 0; }
            .issue-item { background: #fff3cd; padding: 10px; margin: 10px 0; border-left: 4px solid #ffc107; border-radius: 4px; }
            .critical { background: #f8d7da; border-left-color: #dc3545; }
            .button { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Compliance Analysis Complete</h1>
              <p>Hi ${payload.userName},</p>
              <p>Your compliance analysis for <strong>${payload.projectName}</strong> has been completed.</p>
            </div>

            <div class="summary">
              <p><strong>Status:</strong> <span class="status">${statusText}</span></p>
              <p><strong>Total Issues:</strong> ${payload.issueCount}</p>
              <p><strong>Critical Issues:</strong> <span style="color: #dc3545;">${payload.criticalIssues}</span></p>
              <p><strong>Analysis ID:</strong> ${payload.analysisId}</p>
            </div>

            ${payload.issueCount > 0 ? `
              <div class="issues">
                <h3>Key Findings:</h3>
                <p>Your analysis found ${payload.issueCount} compliance issue(s):</p>
                ${payload.criticalIssues > 0 ? `
                  <div class="issue-item critical">
                    <strong>⚠️ ${payload.criticalIssues} Critical Issue(s)</strong>
                    <p>These require immediate attention to ensure code compliance.</p>
                  </div>
                ` : ''}
              </div>
            ` : `
              <div class="summary" style="background: #d4edda; border-left: 4px solid #28a745;">
                <p>✓ <strong>Great news!</strong> Your building is compliant with all applicable codes.</p>
              </div>
            `}

            ${payload.reportUrl ? `
              <a href="${payload.reportUrl}" class="button">View Detailed Report</a>
            ` : ''}

            <div class="footer">
              <p>This is an automated notification from CodeComply. Do not reply to this email.</p>
              <p>Questions? Contact our support team or visit our help center.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Compliance Analysis Complete

Hi ${payload.userName},

Your compliance analysis for "${payload.projectName}" has been completed.

Status: ${statusText}
Total Issues: ${payload.issueCount}
Critical Issues: ${payload.criticalIssues}
Analysis ID: ${payload.analysisId}

${payload.reportUrl ? `View your detailed report: ${payload.reportUrl}` : ''}

---
This is an automated notification from CodeComply.
    `;

    return { subject: `Compliance Analysis Complete - ${payload.projectName}`, html, text };
  }

  /**
   * Build report generation email template
   */
  private static buildReportTemplate(payload: ReportGeneratedPayload): EmailTemplate {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .button { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; font-weight: bold; }
            .footer { color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Report is Ready</h1>
              <p>Hi ${payload.userName},</p>
              <p>Your ${payload.format.toUpperCase()} compliance report for <strong>${payload.projectName}</strong> has been generated successfully.</p>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Report ID:</strong> ${payload.reportId}</p>
              <p><strong>Format:</strong> ${payload.format.toUpperCase()}</p>
              <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <p>Your report is ready to download and share with stakeholders, contractors, or regulatory authorities.</p>

            <a href="${payload.reportUrl}" class="button">Download Report</a>

            <div style="margin-top: 30px; padding: 20px; background: #e7f3ff; border-left: 4px solid #007bff; border-radius: 4px;">
              <p><strong>💡 Tip:</strong> You can generate reports anytime from your project dashboard. Reports include all findings, recommendations, and code references.</p>
            </div>

            <div class="footer">
              <p>This is an automated notification from CodeComply. Do not reply to this email.</p>
              <p>Questions? Contact our support team or visit our help center.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Your Report is Ready

Hi ${payload.userName},

Your ${payload.format.toUpperCase()} compliance report for "${payload.projectName}" has been generated successfully.

Report ID: ${payload.reportId}
Format: ${payload.format.toUpperCase()}
Generated: ${new Date().toLocaleDateString()}

Download your report: ${payload.reportUrl}

---
This is an automated notification from CodeComply.
    `;

    return { subject: `Your Compliance Report is Ready - ${payload.projectName}`, html, text };
  }

  /**
   * Build subscription alert email template
   */
  private static buildSubscriptionTemplate(payload: SubscriptionAlertPayload): EmailTemplate {
    let subject = '';
    let html = '';
    let text = '';

    if (payload.alertType === 'upgrade_available') {
      subject = 'Upgrade Your CodeComply Plan';
      html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; font-weight: bold; }
              .footer { color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Upgrade Your Plan</h1>
                <p>Hi ${payload.userName},</p>
                <p>We noticed you're using many of your plan's features. Consider upgrading to ${payload.planName} for unlimited access.</p>
              </div>

              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Why Upgrade?</h3>
                <ul>
                  <li>Unlimited projects and analyses</li>
                  <li>Advanced compliance reporting</li>
                  <li>Priority support</li>
                  <li>Custom rule sets</li>
                </ul>
              </div>

              <a href="https://complycode.ca/billing" class="button">View Plans</a>

              <div class="footer">
                <p>This is an automated notification from CodeComply.</p>
              </div>
            </div>
          </body>
        </html>
      `;
      text = `
Upgrade Your Plan

Hi ${payload.userName},

We noticed you're using many of your plan's features. Consider upgrading to ${payload.planName} for unlimited access.

View available plans: https://complycode.ca/billing
      `;
    } else if (payload.alertType === 'renewal_reminder') {
      subject = 'Your CodeComply Subscription Renews Soon';
      html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .footer { color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Subscription Renewal Reminder</h1>
                <p>Hi ${payload.userName},</p>
                <p>Your CodeComply subscription will renew on <strong>${payload.renewalDate?.toLocaleDateString()}</strong>.</p>
              </div>

              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p>Your current plan: <strong>${payload.planName}</strong></p>
                <p>No action is required. Your subscription will automatically renew.</p>
              </div>

              <div class="footer">
                <p>This is an automated notification from CodeComply.</p>
              </div>
            </div>
          </body>
        </html>
      `;
      text = `
Subscription Renewal Reminder

Hi ${payload.userName},

Your CodeComply subscription will renew on ${payload.renewalDate?.toLocaleDateString()}.

Current plan: ${payload.planName}
No action is required. Your subscription will automatically renew.
      `;
    } else if (payload.alertType === 'cancellation_confirmed') {
      subject = 'Your CodeComply Subscription Has Been Cancelled';
      html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .button { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; font-weight: bold; }
              .footer { color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Subscription Cancelled</h1>
                <p>Hi ${payload.userName},</p>
                <p>Your CodeComply subscription has been cancelled as requested.</p>
              </div>

              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p>You will continue to have access to your projects and data until your current billing period ends.</p>
              </div>

              <div style="margin-top: 30px; padding: 20px; background: #e7f3ff; border-left: 4px solid #007bff; border-radius: 4px;">
                <p><strong>We'd love to have you back!</strong> If you change your mind, you can reactivate your subscription anytime.</p>
              </div>

              <a href="https://complycode.ca/billing" class="button">Reactivate Subscription</a>

              <div class="footer">
                <p>This is an automated notification from CodeComply.</p>
                <p>If you have questions about your cancellation, please contact our support team.</p>
              </div>
            </div>
          </body>
        </html>
      `;
      text = `
Subscription Cancelled

Hi ${payload.userName},

Your CodeComply subscription has been cancelled as requested.

You will continue to have access to your projects and data until your current billing period ends.

If you change your mind, you can reactivate your subscription anytime:
https://complycode.ca/billing
      `;
    }

    return { subject, html, text };
  }

  /**
   * Mock email sending (replace with actual email service)
   */
  private static async sendEmail(email: string, template: EmailTemplate): Promise<void> {
    // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
    console.log(`[EmailNotificationService] Sending email to ${email}`);
    console.log(`Subject: ${template.subject}`);
    console.log(`Body: ${template.text.substring(0, 100)}...`);
    
    // In production, this would call:
    // await emailService.send({
    //   to: email,
    //   subject: template.subject,
    //   html: template.html,
    //   text: template.text,
    // });
  }
}

export const emailNotificationService = new EmailNotificationService();
