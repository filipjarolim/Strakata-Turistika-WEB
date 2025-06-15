import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

// Initialize Resend with API key (you would get this from your environment variables)
const resend = new Resend(process.env.RESEND_API_KEY);

// Define schema for contact form data validation
const contactFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(3),
  message: z.string().min(10),
  type: z.enum(['bug', 'contact', 'feedback']).optional(),
  bugType: z.enum(['ui', 'functionality', 'performance', 'security', 'other']).optional(),
  pageInfo: z.object({
    url: z.string(),
    path: z.string(),
    timestamp: z.string(),
    screenshot: z.string().nullable()
  })
});

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the data
    const validatedData = contactFormSchema.parse(body);
    
    // For development without an API key, simulate a successful response
    if (!process.env.RESEND_API_KEY) {
      console.log('Development mode: Email would be sent with the following data:', validatedData);
      
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json({ success: true, message: 'Email simulated in development mode' });
    }
    
    const getEmailTemplate = (data: z.infer<typeof contactFormSchema>) => {
      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('cs-CZ', {
          dateStyle: 'full',
          timeStyle: 'long'
        });
      };

      if (data.type === 'bug') {
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Nová zpráva o chybě</h2>
            <p><strong>Od:</strong> ${data.name} (${data.email})</p>
            <p><strong>Typ chyby:</strong> ${data.bugType}</p>
            <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
              <p><strong>Popis:</strong></p>
              <p>${data.message.replace(/\n/g, '<br>')}</p>
            </div>
            <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
              <p><strong>Informace o stránce:</strong></p>
              <p><strong>URL:</strong> ${data.pageInfo.url}</p>
              <p><strong>Cesta:</strong> ${data.pageInfo.path}</p>
              <p><strong>Čas:</strong> ${formatDate(data.pageInfo.timestamp)}</p>
              ${data.pageInfo.screenshot ? `
                <div style="margin-top: 15px;">
                  <p><strong>Screenshot:</strong></p>
                  <img src="${data.pageInfo.screenshot}" alt="Screenshot" style="max-width: 100%; border-radius: 5px; border: 1px solid #ddd;" />
                </div>
              ` : ''}
            </div>
            <p style="margin-top: 30px; font-size: 12px; color: #777;">
              Tato zpráva byla automaticky odeslána prostřednictvím formuláře pro nahlášení chyb.
            </p>
          </div>
        `;
      }

      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Nová zpráva z kontaktního formuláře</h2>
          <p><strong>Od:</strong> ${data.name} (${data.email})</p>
          <p><strong>Předmět:</strong> ${data.subject}</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
            <p><strong>Zpráva:</strong></p>
            <p>${data.message.replace(/\n/g, '<br>')}</p>
          </div>
          <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
            <p><strong>Informace o stránce:</strong></p>
            <p><strong>URL:</strong> ${data.pageInfo.url}</p>
            <p><strong>Cesta:</strong> ${data.pageInfo.path}</p>
            <p><strong>Čas:</strong> ${formatDate(data.pageInfo.timestamp)}</p>
            ${data.pageInfo.screenshot ? `
              <div style="margin-top: 15px;">
                <p><strong>Screenshot:</strong></p>
                <img src="${data.pageInfo.screenshot}" alt="Screenshot" style="max-width: 100%; border-radius: 5px; border: 1px solid #ddd;" />
              </div>
            ` : ''}
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #777;">
            Tato zpráva byla automaticky odeslána prostřednictvím kontaktního formuláře na webu.
          </p>
        </div>
      `;
    };
    
    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Use Resend's default domain for development
      to: 'jarolimfilip07@gmail.com',
      subject: validatedData.type === 'bug' 
        ? `Bug Report: ${validatedData.bugType}` 
        : validatedData.subject,
      html: getEmailTemplate(validatedData),
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { success: false, message: 'Nepodařilo se odeslat email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Email úspěšně odeslán' });
  } catch (error) {
    console.error('Error processing contact form:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Neplatná data formuláře', errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Nastala chyba při zpracování požadavku' },
      { status: 500 }
    );
  }
} 