#!/usr/bin/env node
/**
 * Contact Form API Server with reCAPTCHA Enterprise Verification
 *
 * Handles contact form submissions with Google reCAPTCHA Enterprise verification
 *
 * Usage:
 *   node contact-api-server.cjs
 *
 * Endpoints:
 *   POST /api/contact - Submit contact form
 *
 * Environment Variables:
 *   RECAPTCHA_API_KEY - Google Cloud API key for reCAPTCHA Enterprise
 *   EMAIL_SERVICE - Email service to use (console, sendgrid, ses, etc.)
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3003;

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

// Configuration
const RECAPTCHA_API_KEY = process.env.RECAPTCHA_API_KEY || 'YOUR_API_KEY_HERE';
const RECAPTCHA_PROJECT_ID = 'ayotype-1742503865580';
const RECAPTCHA_SITE_KEY = '6Lc59O0rAAAAAKLeWUqH19MWIRHKqioKToimR0yS';
const RECAPTCHA_MIN_SCORE = 0.5; // Minimum acceptable risk score (0.0 = likely bot, 1.0 = likely human)

// Email Service Configuration
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'auto'; // 'sendgrid', 'resend', or 'auto'
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@ayotype.com';
const EMAIL_TO = process.env.EMAIL_TO || 'support@ayotype.com';

// Initialize email services
let sgMail, resend;

// Determine which service to use
let activeEmailService = null;

if (EMAIL_SERVICE === 'sendgrid' || (EMAIL_SERVICE === 'auto' && SENDGRID_API_KEY && SENDGRID_API_KEY !== 'YOUR_SENDGRID_API_KEY_HERE')) {
  sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(SENDGRID_API_KEY);
  activeEmailService = 'sendgrid';
} else if (EMAIL_SERVICE === 'resend' || (EMAIL_SERVICE === 'auto' && RESEND_API_KEY && RESEND_API_KEY !== 'YOUR_RESEND_API_KEY_HERE')) {
  const { Resend } = require('resend');
  resend = new Resend(RESEND_API_KEY);
  activeEmailService = 'resend';
}

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Verify reCAPTCHA token with Google reCAPTCHA Enterprise API
 */
async function verifyRecaptcha(token, expectedAction = 'submit') {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      event: {
        token: token,
        expectedAction: expectedAction,
        siteKey: RECAPTCHA_SITE_KEY,
      }
    });

    const options = {
      hostname: 'recaptchaenterprise.googleapis.com',
      port: 443,
      path: `/v1/projects/${RECAPTCHA_PROJECT_ID}/assessments?key=${RECAPTCHA_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    console.log('🔐 Verifying reCAPTCHA token...');

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('🔍 reCAPTCHA response:', JSON.stringify(response, null, 2));

          if (response.error) {
            console.error('❌ reCAPTCHA API error:', response.error);
            reject(new Error(response.error.message || 'reCAPTCHA verification failed'));
            return;
          }

          // Check if token is valid
          if (!response.tokenProperties || !response.tokenProperties.valid) {
            console.error('❌ Invalid reCAPTCHA token');
            reject(new Error('Invalid reCAPTCHA token'));
            return;
          }

          // Check action matches
          if (response.tokenProperties.action !== expectedAction) {
            console.error('❌ Action mismatch:', response.tokenProperties.action, 'vs', expectedAction);
            reject(new Error('Action mismatch'));
            return;
          }

          // Check risk score
          const score = response.riskAnalysis?.score || 0;
          console.log(`📊 Risk score: ${score} (${score >= RECAPTCHA_MIN_SCORE ? 'PASS' : 'FAIL'})`);

          if (score < RECAPTCHA_MIN_SCORE) {
            console.error(`❌ Risk score too low: ${score} < ${RECAPTCHA_MIN_SCORE}`);
            reject(new Error('Suspicious activity detected. Please try again.'));
            return;
          }

          console.log('✅ reCAPTCHA verification successful');
          resolve({
            valid: true,
            score: score,
            reasons: response.riskAnalysis?.reasons || []
          });
        } catch (error) {
          console.error('❌ Failed to parse reCAPTCHA response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ reCAPTCHA request error:', error);
      reject(error);
    });

    req.write(requestBody);
    req.end();
  });
}

/**
 * Send email via configured service (SendGrid or Resend)
 */
async function sendEmail(formData) {
  console.log(`📧 Sending email via ${activeEmailService || 'none'}...`);
  console.log('From:', formData.email);
  console.log('Name:', formData.name);
  console.log('Subject:', formData.subject);

  if (!activeEmailService) {
    console.log('⚠️  No email service configured - email not sent');
    console.log('📝 Message preview:', formData.message.substring(0, 100) + '...');
    return false;
  }

  const textContent = `
New message from ${formData.name} (${formData.email})

Subject: ${formData.subject}

Message:
${formData.message}

---
Sent via AyoType Contact Form
${new Date().toISOString()}
  `.trim();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #FF79C6, #FFD94E); padding: 20px; text-align: center; color: #fff; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 20px; }
    .label { font-weight: bold; color: #666; display: block; margin-bottom: 5px; }
    .value { background: #fff; padding: 10px; border-left: 3px solid #FF79C6; border-radius: 4px; }
    .message-box { background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 4px; white-space: pre-wrap; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">📬 New Contact Form Message</h1>
    </div>
    <div class="content">
      <div class="field">
        <span class="label">From:</span>
        <div class="value"><strong>${formData.name}</strong></div>
      </div>

      <div class="field">
        <span class="label">Email:</span>
        <div class="value"><a href="mailto:${formData.email}">${formData.email}</a></div>
      </div>

      <div class="field">
        <span class="label">Subject:</span>
        <div class="value">${formData.subject}</div>
      </div>

      <div class="field">
        <span class="label">Message:</span>
        <div class="message-box">${formData.message.replace(/\n/g, '<br>')}</div>
      </div>

      <div class="footer">
        Sent via AyoType Contact Form<br>
        ${new Date().toLocaleString()}
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    if (activeEmailService === 'sendgrid') {
      // SendGrid
      await sgMail.send({
        to: EMAIL_TO,
        from: EMAIL_FROM,
        replyTo: formData.email,
        subject: `Contact Form: ${formData.subject}`,
        text: textContent,
        html: htmlContent
      });
      console.log('✅ Email sent successfully via SendGrid');
    } else if (activeEmailService === 'resend') {
      // Resend
      await resend.emails.send({
        from: EMAIL_FROM,
        to: EMAIL_TO,
        replyTo: formData.email,
        subject: `Contact Form: ${formData.subject}`,
        text: textContent,
        html: htmlContent
      });
      console.log('✅ Email sent successfully via Resend');
    }
    return true;
  } catch (error) {
    console.error(`❌ ${activeEmailService} error:`, error.response?.body || error.message);
    throw new Error('Failed to send email');
  }
}

/**
 * Save submission to file (backup/logging)
 */
function logSubmission(formData, recaptchaResult) {
  const logDir = path.join(__dirname, 'contact-submissions');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}-${formData.name.replace(/[^a-z0-9]/gi, '-')}.json`;
  const filepath = path.join(logDir, filename);

  const logData = {
    timestamp: new Date().toISOString(),
    formData: {
      name: formData.name,
      email: formData.email,
      subject: formData.subject,
      message: formData.message
    },
    recaptcha: {
      score: recaptchaResult.score,
      reasons: recaptchaResult.reasons
    }
  };

  fs.writeFileSync(filepath, JSON.stringify(logData, null, 2));
  console.log(`💾 Submission logged: ${filepath}`);
}

/**
 * Handle contact form submission
 */
async function handleContactForm(req, res) {
  let body = '';

  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const formData = JSON.parse(body);

      // Validate required fields
      if (!formData.name || !formData.email || !formData.subject || !formData.message || !formData.recaptcha) {
        res.writeHead(400, {
          'Content-Type': 'application/json',
          ...CORS_HEADERS
        });
        res.end(JSON.stringify({
          success: false,
          error: 'Missing required fields'
        }));
        return;
      }

      console.log('📝 Contact form submission received');
      console.log('Name:', formData.name);
      console.log('Email:', formData.email);

      // Verify reCAPTCHA
      try {
        const recaptchaResult = await verifyRecaptcha(formData.recaptcha, 'submit');

        // Log submission
        logSubmission(formData, recaptchaResult);

        // Send email
        await sendEmail(formData);

        // Success response
        res.writeHead(200, {
          'Content-Type': 'application/json',
          ...CORS_HEADERS
        });
        res.end(JSON.stringify({
          success: true,
          message: 'Message sent successfully!'
        }));

        console.log('✅ Contact form processed successfully\n');
      } catch (recaptchaError) {
        console.error('❌ reCAPTCHA verification failed:', recaptchaError.message);

        res.writeHead(403, {
          'Content-Type': 'application/json',
          ...CORS_HEADERS
        });
        res.end(JSON.stringify({
          success: false,
          error: 'reCAPTCHA verification failed. Please try again.'
        }));
      }
    } catch (error) {
      console.error('❌ Error processing contact form:', error);

      res.writeHead(500, {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      });
      res.end(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }));
    }
  });
}

/**
 * Main request handler
 */
function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, { ...CORS_HEADERS });
    res.end();
    return;
  }

  // Contact form endpoint
  if (req.method === 'POST' && url.pathname === '/api/contact') {
    handleContactForm(req, res);
    return;
  }

  // Health check
  if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/')) {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'Contact Form API',
      version: '1.0.0',
      recaptcha: {
        configured: RECAPTCHA_API_KEY !== 'YOUR_API_KEY_HERE',
        projectId: RECAPTCHA_PROJECT_ID,
        siteKey: RECAPTCHA_SITE_KEY
      }
    }, null, 2));
    return;
  }

  // 404
  res.writeHead(404, {
    'Content-Type': 'application/json',
    ...CORS_HEADERS
  });
  res.end(JSON.stringify({ error: 'Not found' }));
}

// Start server
const server = http.createServer(handleRequest);

server.listen(PORT, '127.0.0.1', () => {
  console.log('📬 Contact Form API Server');
  console.log(`🔗 http://127.0.0.1:${PORT}\n`);
  console.log('📡 Available endpoints:');
  console.log(`   • POST /api/contact - Submit contact form`);
  console.log(`   • GET /health - Health check\n`);

  if (RECAPTCHA_API_KEY === 'YOUR_API_KEY_HERE') {
    console.log('⚠️  WARNING: RECAPTCHA_API_KEY not configured!');
    console.log('   Set RECAPTCHA_API_KEY in .env file\n');
  } else {
    console.log('✅ reCAPTCHA configured');
    console.log(`   Project: ${RECAPTCHA_PROJECT_ID}`);
    console.log(`   Site Key: ${RECAPTCHA_SITE_KEY}\n`);
  }

  if (activeEmailService) {
    console.log(`✅ Email service: ${activeEmailService.toUpperCase()}`);
    console.log(`   From: ${EMAIL_FROM}`);
    console.log(`   To: ${EMAIL_TO}\n`);
  } else {
    console.log('⚠️  WARNING: No email service configured!');
    console.log('   Emails will be logged but not sent');
    console.log('   Add RESEND_API_KEY or SENDGRID_API_KEY to .env file\n');
  }
});
