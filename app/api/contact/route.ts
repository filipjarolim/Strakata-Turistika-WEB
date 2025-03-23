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
    
    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: 'kontaktni-formular@strakataturistika.vercel.app',
      to: 'jarolimfilip07@gmail.com', // Replace with the recipient's email
      subject: `Kontaktní formulář: ${validatedData.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Nová zpráva z kontaktního formuláře</h2>
          <p><strong>Od:</strong> ${validatedData.name} (${validatedData.email})</p>
          <p><strong>Předmět:</strong> ${validatedData.subject}</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
            <p><strong>Zpráva:</strong></p>
            <p>${validatedData.message.replace(/\n/g, '<br>')}</p>
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #777;">
            Tato zpráva byla automaticky odeslána prostřednictvím kontaktního formuláře na webu.
          </p>
        </div>
      `,
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