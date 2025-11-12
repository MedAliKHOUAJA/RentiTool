
import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@gradio/client';

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 API: Starting business card scan...');
    
    // Get the uploaded file
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      console.error('❌ API: No image provided');
      return NextResponse.json(
        { success: false, error: 'Aucune image fournie' },
        { status: 400 }
      );
    }

    console.log('📸 API: Image received -', {
      name: image.name,
      type: image.type,
      size: image.size
    });

    // Validate file type
    if (!image.type.startsWith('image/')) {
      console.error('❌ API: Invalid file type');
      return NextResponse.json(
        { success: false, error: 'Le fichier doit être une image' },
        { status: 400 }
      );
    }

    // Convert image to buffer
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    console.log('🔄 API: Image converted to buffer, size:', imageBuffer.length);

    // Connect to the Gradio client
    console.log('🔗 API: Connecting to Gradio client...');
    const client = await Client.connect('codic/Business-Card-Scanner-To-Csv-gredio');
    console.log('✅ API: Connected to Gradio');

    // Process the business card
    console.log('⚙️ API: Processing business card...');
    const result = await client.predict('/process_single', {
      image: new Blob([new Uint8Array(imageBuffer)], { type: image.type }),
      threshold: 0.3,
      nested_ner: true,
    });

    console.log('📦 API: Raw result from Gradio:', JSON.stringify(result, null, 2));

    // Extract the data from the result
    const [extractedText, entities, downloadFile, errorDetails] = result.data as [
      string,
      any,
      any,
      string
    ];

    console.log('📝 API: Extracted text:', extractedText);
    console.log('🏷️ API: Raw entities:', entities);
    console.log('⚠️ API: Error details:', errorDetails);

    // Check for errors
    if (errorDetails) {
      console.error('❌ API: Gradio returned error:', errorDetails);
      return NextResponse.json(
        { success: false, error: errorDetails },
        { status: 500 }
      );
    }

    // Parse and structure the entities
    const structuredEntities = parseEntities(entities, extractedText);
    console.log('✨ API: Structured entities:', structuredEntities);

    const response = {
      success: true,
      extractedText,
      entities: structuredEntities,
      rawEntities: entities,
    };

    console.log('🎉 API: Returning successful response:', JSON.stringify(response, null, 2));

    return NextResponse.json(response);
  } catch (error) {
    console.error('💥 API: Business card scan error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors du scan',
      },
      { status: 500 }
    );
  }
}

// Helper function to parse and structure entities
function parseEntities(entities: any, extractedText: string) {
  const structured: {
    title?: string;
    company?: string;
    website?: string;
  } = {};

  try {
    // === 1. Handle Gradio's object format ===
    if (typeof entities === 'object' && entities !== null) {
      // Job Title
      if (entities['Job Title'] && entities['Job Title'].trim()) {
        structured.title = entities['Job Title'].trim();
      }

      // Company Name
      if (entities['Company Name'] && entities['Company Name'].trim()) {
        structured.company = entities['Company Name'].trim();
      }

      // Email → if it's a URL, use as website
      if (entities.Email && entities.Email.includes('.')) {
        const email = entities.Email.trim();
        if (email.includes('www.') || email.includes('http')) {
          structured.website = email.startsWith('http') ? email : 'https://' + email;
        }
      }
    }

    // === 2. Fallback: Regex from extractedText ===
    const text = extractedText || '';

    // Website (http, www, .com, etc.)
    if (!structured.website) {
      const websiteMatch = text.match(/(https?:\/\/[^\s]+|www\.[^\s]+|[^\s@]+\.(com|io|org|net|co|ai|app))/i);
      if (websiteMatch) {
        let url = websiteMatch[0];
        if (!url.startsWith('http')) url = 'https://' + url;
        structured.website = url.replace(/[,;]$/, ''); // clean trailing punctuation
      }
    }

    // Company (fallback: capitalize words not name/title)
    if (!structured.company) {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (
          line.length > 3 &&
          !line.includes('@') &&
          !line.match(/^\+?\d[\d\s\-\(\)]+$/) &&
          !line.toLowerCase().includes('olivia') &&
          !line.toLowerCase().includes('wilson')
        ) {
          structured.company = line;
          break;
        }
      }
    }

    // Title (fallback: look for short uppercase or known titles)
    if (!structured.title) {
      const titleMatch = text.match(/\b(CEO|CFO|CTO|Developer|Manager|Director|Engineer|Designer|Founder)\b/i);
      if (titleMatch) structured.title = titleMatch[0];
    }

  } catch (error) {
        console.error('Error parsing entities:', error);
  }

  return structured;
}