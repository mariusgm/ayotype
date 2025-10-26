export const config = { runtime: "edge" };

interface ContactRequest {
  name: string;
  email: string;
  message: string;
  recaptcha?: string;
}

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "support@ayotype.com";

async function verifyRecaptcha(token: string, remoteIP: string): Promise<boolean> {
  if (!RECAPTCHA_SECRET) {
    console.warn('reCAPTCHA not configured - skipping verification');
    return true; // Allow in dev if not configured
  }

  try {
    const response = await fetch('https://recaptchaenterprise.googleapis.com/v1/projects/ayotype/assessments?key=' + RECAPTCHA_SECRET, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: {
          token,
          expectedAction: 'submit',
          siteKey: '6Lc59O0rAAAAAKLeWUqH19MWIRHKqioKToimR0yS'
        }
      })
    });

    if (!response.ok) {
      console.error('reCAPTCHA verification failed:', response.status);
      return false;
    }

    const result = await response.json();
    const score = result.riskAnalysis?.score || 0;

    // Score is 0.0 to 1.0, higher is more likely human
    return score >= 0.5;
  } catch (error) {
    console.error('reCAPTCHA error:', error);
    return false;
  }
}

export default async function handler(req: Request) {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body: ContactRequest = await req.json();
    const { name, email, message, recaptcha } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify reCAPTCHA
    const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '0.0.0.0';
    if (recaptcha) {
      const isValid = await verifyRecaptcha(recaptcha, ip);
      if (!isValid) {
        return new Response(JSON.stringify({ error: 'reCAPTCHA verification failed' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Send email via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (RESEND_API_KEY) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'AyoType Contact <noreply@ayotype.com>',
            to: [CONTACT_EMAIL],
            reply_to: email,
            subject: `Contact Form: ${name}`,
            html: `<html><body>
<h2>New Contact Form Submission</h2>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
<p><strong>IP:</strong> ${ip}</p>
<p><strong>Time:</strong> ${new Date().toISOString()}</p>
<h3>Message:</h3>
<p>${message.replace(/\n/g, '<br>')}</p>
</body></html>`,
            text: `New contact form submission:

Name: ${name}
Email: ${email}
IP: ${ip}
Time: ${new Date().toISOString()}

Message:
${message}`
          })
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error('Resend API error:', {
            status: emailResponse.status,
            statusText: emailResponse.statusText,
            body: errorText,
            timestamp: new Date().toISOString()
          });

          // Return error to user if email fails
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to send email. Please try again or contact support@ayotype.com directly.'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const result = await emailResponse.json();
        console.log('Contact form email sent successfully:', {
          id: result.id,
          name,
          email,
          to: CONTACT_EMAIL,
          timestamp: new Date().toISOString()
        });
      } catch (emailError) {
        console.error('Email sending exception:', emailError);

        // Return error to user if email fails
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to send email. Please try again or contact support@ayotype.com directly.'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      // Resend not configured - warn and return error
      console.warn('Resend API key not configured! Email not sent:', {
        name,
        email,
        message: message.substring(0, 100),
        ip,
        timestamp: new Date().toISOString()
      });

      return new Response(JSON.stringify({
        success: false,
        error: 'Email service not configured. Please contact support@ayotype.com directly.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
