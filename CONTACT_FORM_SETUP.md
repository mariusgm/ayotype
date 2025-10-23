# Contact Form Setup Guide

This guide explains how to set up the contact form with Google reCAPTCHA Enterprise verification.

## 🔐 reCAPTCHA Enterprise Configuration

### Already Configured

✅ **Site Key**: `6Lc59O0rAAAAAKLeWUqH19MWIRHKqioKToimR0yS`
✅ **Project ID**: `ayotype-1742503865580`
✅ **Frontend**: contact.html uses reCAPTCHA Enterprise (invisible/score-based)

### What You Need to Add

❌ **API Key**: Google Cloud API key for backend verification

## 📝 Setup Steps

### 1. Get Your Google Cloud API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `ayotype-1742503865580`
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **API Key**
5. Copy the API key
6. **Restrict the API key**:
   - Go to API restrictions
   - Select "Restrict key"
   - Choose "reCAPTCHA Enterprise API"
   - Save

### 2. Add API Key to .env

Edit `.env` file and replace `YOUR_GOOGLE_CLOUD_API_KEY_HERE`:

```bash
RECAPTCHA_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 3. Start the Contact API Server

```bash
node contact-api-server.cjs
```

The server will start on **port 3003** and show:
- ✅ reCAPTCHA configured
- Project and Site Key details
- Available endpoints

### 4. Test the Contact Form

1. Open http://127.0.0.1:3000/contact.html
2. Fill in the form
3. Click "Send Message" (reCAPTCHA runs invisibly in background)

## 🔧 API Verification Flow

```
Frontend (contact.html)
  ↓ 1. User submits form
  ↓ 2. Executes invisible reCAPTCHA Enterprise (v3)
  ↓ 3. Gets token automatically (no user interaction)
  ↓
Backend (contact-api-server.cjs)
  ↓ 4. Receives form data + token
  ↓ 5. Sends token to Google reCAPTCHA Enterprise API
  ↓
Google reCAPTCHA Enterprise
  ↓ 6. Returns risk assessment
  ↓ 7. Score: 0.0 (bot) → 1.0 (human)
  ↓
Backend
  ↓ 8. Validates score >= 0.5
  ↓ 9. Logs submission to contact-submissions/
  ↓ 10. Sends email via SendGrid
  ↓ 11. Returns success/error to frontend
  ↓
Frontend
  ↓ 12. Shows success/error message
```

## 📧 Email Configuration

The contact form supports **two email services**: Resend (recommended) or SendGrid.

### Option A: Resend (Recommended) ⭐

**Why Resend?**
- ✅ **3,000 free emails/month** (vs SendGrid's limited free tier)
- ✅ Modern, developer-friendly API
- ✅ Simple domain verification
- ✅ No credit card required for free tier

**Setup Steps:**

1. **Create Resend Account**:
   - Go to https://resend.com/signup
   - Sign up (free, no credit card needed)

2. **Get API Key**:
   - Go to https://resend.com/api-keys
   - Click "Create API Key"
   - Name: "AyoType Contact Form"
   - Permission: "Sending access"
   - Copy the API key (starts with `re_`)

3. **Verify Domain** (for sending from @ayotype.com):
   - Go to https://resend.com/domains
   - Click "Add Domain"
   - Enter: `ayotype.com`
   - Add these DNS records to Namecheap:
     - **SPF**: TXT record (provided by Resend)
     - **DKIM**: TXT record (provided by Resend)
   - Wait for verification (usually 5-10 minutes)

4. **Add to .env**:
   ```bash
   EMAIL_SERVICE=resend
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=noreply@ayotype.com
   EMAIL_TO=support@ayotype.com
   ```

### Option B: SendGrid (Alternative)

**Setup Steps:**

1. **Get SendGrid API Key**:
   - Go to https://app.sendgrid.com/settings/api_keys
   - Click "Create API Key"
   - Name it "AyoType Contact Form"
   - Choose "Full Access" or "Mail Send" permissions
   - Copy the API key

2. **Add to .env**:
   ```bash
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=noreply@ayotype.com
   EMAIL_TO=support@ayotype.com
   ```

3. **Verify Sender Email** (required by SendGrid):
   - Go to https://app.sendgrid.com/settings/sender_auth/senders
   - Add `noreply@ayotype.com` as verified sender
   - Or use existing domain authentication for ayotype.com

### Alternative: AWS SES
```javascript
const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-east-1' });

await ses.sendEmail({
  Source: 'noreply@ayotype.com',
  Destination: { ToAddresses: ['hello@ayotype.com'] },
  Message: {
    Subject: { Data: `Contact Form: ${formData.subject}` },
    Body: {
      Text: { Data: `From: ${formData.name} (${formData.email})\n\n${formData.message}` }
    }
  }
}).promise();
```

**Option C: Nodemailer (SMTP)**
```javascript
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

await transporter.sendMail({
  from: 'noreply@ayotype.com',
  to: 'hello@ayotype.com',
  subject: `Contact Form: ${formData.subject}`,
  text: `From: ${formData.name} (${formData.email})\n\n${formData.message}`
});
```

## 📁 Submission Logs

All form submissions are logged to:
```
contact-submissions/
  ├── 2025-10-17T14-30-15-John-Doe.json
  ├── 2025-10-17T15-45-22-Jane-Smith.json
  └── ...
```

Each file contains:
- Timestamp
- Form data (name, email, subject, message)
- reCAPTCHA score and reasons

## 🔍 Troubleshooting

### Issue: "reCAPTCHA verification failed"

**Cause**: API key not configured or invalid

**Solution**:
1. Check `.env` has `RECAPTCHA_API_KEY` set
2. Verify API key has reCAPTCHA Enterprise API enabled
3. Check API key restrictions allow your IP/domain

### Issue: "Suspicious activity detected"

**Cause**: reCAPTCHA risk score < 0.5

**Solution**:
- User may be using VPN/proxy
- Multiple failed attempts
- Bot-like behavior detected
- Adjust `RECAPTCHA_MIN_SCORE` in `contact-api-server.cjs` (default: 0.5)

### Issue: "Failed to send message"

**Cause**: Network error or server not running

**Solution**:
1. Ensure `contact-api-server.cjs` is running on port 3003
2. Check console for errors
3. Verify API key is valid

## 🚀 Production Deployment

### Update Frontend URL

In production, update `contact.html` line 438:
```javascript
// Change from localhost to your domain
const response = await fetch('https://ayotype.com/api/contact', {
```

### Deploy API Server

1. **Option A: Same Server**
   - Run `contact-api-server.cjs` alongside your app
   - Use reverse proxy (nginx/Apache) to route `/api/contact` to port 3003

2. **Option B: Serverless Function**
   - Convert to AWS Lambda / Vercel / Netlify function
   - Keep reCAPTCHA verification logic

3. **Option C: Separate API Server**
   - Deploy to separate server/container
   - Update CORS headers to allow your domain

### Environment Variables for Production

```bash
# Production .env
RECAPTCHA_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SENDGRID_API_KEY=SG.XXXXXXXXXXXXXXXXXXXXXXXXXX
# or
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
# or
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
```

## 📊 Monitoring

Monitor submission logs and reCAPTCHA scores:

```bash
# View recent submissions
ls -lt contact-submissions/ | head -10

# Check reCAPTCHA scores
cat contact-submissions/*.json | jq '.recaptcha.score'

# Count submissions per day
ls contact-submissions/ | cut -d'T' -f1 | sort | uniq -c
```

## 🔒 Security Best Practices

1. ✅ **Never commit** `.env` file to git
2. ✅ **Restrict API key** to reCAPTCHA Enterprise API only
3. ✅ **Rate limiting**: Add rate limiting to prevent abuse
4. ✅ **Input validation**: Sanitize user input before processing
5. ✅ **HTTPS only**: Use HTTPS in production
6. ✅ **Email validation**: Verify email format on backend
7. ✅ **Log monitoring**: Regularly review submission logs

## 📚 Resources

- [reCAPTCHA Enterprise Docs](https://cloud.google.com/recaptcha-enterprise/docs)
- [Create API Keys](https://console.cloud.google.com/apis/credentials)
- [SendGrid Setup](https://docs.sendgrid.com/for-developers/sending-email/api-getting-started)
- [AWS SES Setup](https://docs.aws.amazon.com/ses/latest/dg/send-email-api.html)
- [Nodemailer Docs](https://nodemailer.com/about/)

---

**Note**: The contact form is fully functional for logging submissions. Email delivery needs to be configured based on your preferred service.
