
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
function parseEntities(entities: any, extractedText: string) {
  const structured: {
    name?: string;
    title?: string;
    company?: string;
    email?: string;
    phone?: string;
    website?: string;
  } = {};

  try {
    // === 1. Handle Gradio's object format ===
    if (typeof entities === 'object' && entities !== null) {
      
      // Person Name
      if (entities['Person Name'] && entities['Person Name'].trim()) {
        structured.name = entities['Person Name'].trim();
      }

      // Job Title
      if (entities['Job Title'] && entities['Job Title'].trim()) {
        structured.title = entities['Job Title'].trim();
      }

      // Company Name (handle empty string)
      if (entities['Company Name'] && entities['Company Name'].trim()) {
        structured.company = entities['Company Name'].trim();
      }

      // Phone
      if (entities['Phone'] && entities['Phone'].trim()) {
        // Clean phone number
        const phone = entities['Phone'].trim().replace(/[^\d+\s\-()]/g, '');
        if (phone) {
          structured.phone = phone;
        }
      }

      // Email - Extract from the Email field
      if (entities.Email && entities.Email.trim()) {
        const emailField = entities.Email.trim();
        
        // Extract actual email address
        const emailMatch = emailField.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          structured.email = emailMatch[0];
        } else {
          // Try to extract from text with spaces instead of @
          const emailParts = emailField.split(';')[0].trim();
          if (emailParts.includes('company com') || emailParts.includes('personai')) {
            // Fix common OCR errors: "personaicompany com" -> "person@company.com"
            const fixedEmail = emailParts
              .replace(/\s+/g, '')
              .replace('personaicompany', 'person@company')
              .replace('com', '.com');
            if (fixedEmail.includes('@')) {
              structured.email = fixedEmail;
            }
          }
        }
        
        // Extract website from email field (sometimes contains multiple values)
        const urlMatch = emailField.match(/(https?:\/\/[^\s;,]+|www\.[^\s;,]+|[a-zA-Z0-9-]+\.(com|io|org|net|co|ai|app|tech|dev)[^\s;,]*)/i);
        if (urlMatch) {
          let url = urlMatch[0];
          if (!url.startsWith('http')) {
            url = 'https://' + url;
          }
          structured.website = url.replace(/[,;]+$/, '');
        }
      }

      // Address (optional, not currently used in your form)
      // if (entities.Address) { ... }
    }

    // === 2. Fallback: Parse from extractedText ===
    const text = extractedText || '';
    const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);

    // Extract person name if not found
    if (!structured.name && entities?.['Person Name']) {
      structured.name = entities['Person Name'].trim();
    }

    // Extract phone if not found
    if (!structured.phone) {
      const phoneMatch = text.match(/(\+?\d{1,4}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|\d{3}[\s]\d{3}[\s]\d{4}/);
      if (phoneMatch) {
        structured.phone = phoneMatch[0].trim();
      }
    }

    // Extract email from text if not found
    if (!structured.email) {
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        structured.email = emailMatch[0];
      } else {
        // Try to fix OCR errors
        const emailLike = text.match(/[a-zA-Z0-9._%+-]+\s*@?\s*[a-zA-Z0-9.-]+\s*\.\s*[a-zA-Z]{2,}/);
        if (emailLike) {
          const fixedEmail = emailLike[0].replace(/\s+/g, '');
          if (fixedEmail.includes('@') || fixedEmail.match(/[a-zA-Z0-9]+company/i)) {
            structured.email = fixedEmail.replace(/([a-zA-Z0-9]+)company/i, '$1@company');
          }
        }
      }
    }

    // Website extraction
    if (!structured.website) {
      const websiteMatch = text.match(/(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|io|org|net|co|ai|app|tech|dev))/i);
      if (websiteMatch) {
        let url = websiteMatch[0];
        if (!url.startsWith('http')) {
          url = 'https://' + url;
        }
        structured.website = url.replace(/[,;.\s]+$/, '');
      }
    }

    // Company extraction with improved heuristics
    if (!structured.company) {
      const personNameLower = (structured.name || '').toLowerCase();
      const personNameParts = personNameLower.split(' ').filter((p: string) => p.length > 2);

      for (const line of lines) {
        // Skip if line is too short or contains garbage characters
        if (line.length < 3 || /[٠-٩؛،؟]/.test(line)) continue;
        
        // Skip if line is the person's name
        const lineLower = line.toLowerCase();
        if (personNameParts.some((part: string) => lineLower.includes(part))) continue;
        
        // Skip if line looks like contact info
        if (
          line.includes('@') ||
          /^\+?\d[\d\s\-\(\)]+$/.test(line) ||
          /^\d+[\s,]\d+/.test(line) || // addresses like "123 Street"
          line.match(/^[A-Z]{2,3}$/) // abbreviations
        ) continue;

        // Skip if it's the job title (already captured)
        if (structured.title && lineLower.includes(structured.title.toLowerCase())) continue;

        // Check if line looks like a company name
        if (
          /^[A-Z]/.test(line) && // Starts with capital
          (
            line.includes(' ') || // Multi-word
            /\b(Inc|LLC|Ltd|Corp|Corporation|Company|Group|Solutions|Technologies|Tech|Consulting)\b/i.test(line)
          )
        ) {
          structured.company = line.replace(/[,;.]+$/, '');
          break;
        }
      }
    }

    // Title extraction fallback
    if (!structured.title) {
      const titleMatch = text.match(/\b(CEO|Chief Executive Officer|CFO|CTO|COO|VP|Vice President|President|Developer|Software Engineer|Manager|Director|Senior|Junior|Lead|Engineer|Designer|Founder|Co-Founder|Consultant|Analyst|Specialist|Managing Director)\b/i);
      if (titleMatch) {
        structured.title = titleMatch[0];
      }
    }

    // Final fallback: Extract company from website domain or email
    if (!structured.company) {
      let domain = '';
      
      // Try from website first
      if (structured.website) {
        const domainMatch = structured.website.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+)\./i);
        if (domainMatch) {
          domain = domainMatch[1];
        }
      }
      
      // Try from email if website didn't work
      if (!domain && structured.email) {
        const emailDomain = structured.email.split('@')[1]?.split('.')[0];
        if (emailDomain) {
          domain = emailDomain;
        }
      }
      
      // Format domain as company name
      if (domain) {
        structured.company = domain
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }

  } catch (error) {
    console.error('Error parsing entities:', error);
  }

  return structured;
}