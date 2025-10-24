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

    // TODO: Send email using your preferred service (SendGrid, Resend, etc.)
    // For now, just log it
    console.log('Contact form submission:', {
      name,
      email,
      message: message.substring(0, 100),
      ip,
      timestamp: new Date().toISOString()
    });

    // In production, you would send an email here
    // Example with Resend (if configured):
    // const RESEND_API_KEY = process.env.RESEND_API_KEY;
    // if (RESEND_API_KEY) {
    //   await fetch('https://api.resend.com/emails', {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${RESEND_API_KEY}`,
    //       'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({
    //       from: 'contact@ayotype.com',
    //       to: CONTACT_EMAIL,
    //       subject: `Contact Form: ${name}`,
    //       text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    //     })
    //   });
    // }

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
