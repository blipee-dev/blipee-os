import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to search Google using SerpAPI or Serper (if available)
async function searchGoogle(query: string) {
  // Check if we have Serper API key
  const serperApiKey = process.env.SERPER_API_KEY;
  
  if (serperApiKey) {
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: query,
          num: 10,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.organic || [];
      }
    } catch (error) {
      console.error('Serper API error:', error);
    }
  }
  
  // If no API key or error, return null
  return null;
}

// Function to extract company info from search results and web content
async function extractCompanyInfo(companyName: string) {
  const queries = [
    `${companyName} official website headquarters address contact`,
    `${companyName} legal entity name incorporated`,
    `${companyName} number of employees staff size`,
    `${companyName} industry sector business`,
    `${companyName} contact email phone number`,
    `${companyName} "Inc" OR "Corporation" OR "LLC" OR "Ltd" OR "S.A." OR "GmbH"`,
  ];
  
  let searchResults = [];
  
  // Try to get search results
  for (const query of queries.slice(0, 2)) { // Limit to avoid rate limiting
    const results = await searchGoogle(query);
    if (results) {
      searchResults = [...searchResults, ...results];
    }
  }
  
  // Build context from search results
  let searchContext = '';
  if (searchResults.length > 0) {
    searchContext = searchResults.map(r => `${r.title}: ${r.snippet}`).join('\n');
  }
  
  return searchContext;
}

// Main function to get company information
async function getCompanyInfo(companyName: string) {
  try {
    // First, try to get real search results
    const searchContext = await extractCompanyInfo(companyName);
    
    // Create a comprehensive prompt with search context
    const prompt = `Based on the following search results and your knowledge, provide accurate and current information about "${companyName}".

${searchContext ? `Recent search results:\n${searchContext}\n\n` : ''}

Please provide the following information in JSON format:
{
  "legal_name": "Full official legal entity name with suffix (e.g., Inc., Corporation, LLC, Ltd., S.A., GmbH, SP RL)",
  "industry_primary": "Primary industry classification",
  "industry_secondary": "Secondary industry if applicable", 
  "company_size": "Number of employees",
  "website": "Official website URL starting with https://",
  "primary_contact_email": "Main contact email address",
  "primary_contact_phone": "Main phone number with country code",
  "headquarters_address": {
    "street": "Street address",
    "city": "City",
    "postal_code": "Postal/ZIP code",
    "country": "Country"
  },
  "description": "Brief 2-3 sentence description of the company"
}

IMPORTANT INSTRUCTIONS:
1. For legal_name, ALWAYS include the full legal suffix (Inc., LLC, etc.)
2. Use the most recent and accurate information available
3. If you find conflicting information, use the most recent or most credible source
4. Only return the JSON object, no additional text
5. Use null for fields where no reliable information is found

Examples of proper formatting:
- Legal names: "Apple Inc.", "Microsoft Corporation", "Tesla, Inc.", "PLMJ - Sociedade de Advogados, SP, RL"
- Phone numbers: "+1 408-996-1010", "+351 213 197 300"
- Industries: "Technology", "Legal Services", "Automotive", "Financial Services"`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a professional business researcher. ${searchContext ? 'Use the provided search results to give the most accurate, current information.' : 'Provide the most accurate information based on your knowledge.'} Always format company names with their full legal suffixes.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    return completion.choices[0]?.message?.content || '{}';
    
  } catch (error) {
    console.error('Error getting company info:', error);
    
    // Fallback to basic GPT-3.5 without search
    const fallbackCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a company information specialist. Provide accurate company information in JSON format.'
        },
        {
          role: 'user',
          content: `Provide current information about "${companyName}" in JSON format with fields: legal_name (with suffix), industry_primary, industry_secondary, company_size, website, primary_contact_email, primary_contact_phone, headquarters_address (object with street, city, postal_code, country), description.`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });
    
    return fallbackCompletion.choices[0]?.message?.content || '{}';
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationName } = await request.json();

    if (!organizationName) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    console.log(`Looking up organization: ${organizationName}`);

    // Get company information
    const responseText = await getCompanyInfo(organizationName);
    
    // Parse the JSON response
    let organizationData;
    try {
      organizationData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response:', responseText);
      organizationData = {};
    }

    // Ensure headquarters_address is properly structured
    if (organizationData.headquarters_address) {
      if (typeof organizationData.headquarters_address === 'string') {
        // Parse string address into components
        const addressParts = organizationData.headquarters_address.split(',').map(s => s.trim());
        organizationData.headquarters_address = {
          street: addressParts[0] || '',
          city: addressParts[1] || '',
          postal_code: addressParts[2] || '',
          country: addressParts[3] || addressParts[2] || ''
        };
      } else if (typeof organizationData.headquarters_address === 'object') {
        // Ensure all fields exist
        organizationData.headquarters_address = {
          street: organizationData.headquarters_address.street || '',
          city: organizationData.headquarters_address.city || '',
          postal_code: organizationData.headquarters_address.postal_code || '',
          country: organizationData.headquarters_address.country || ''
        };
      }
    } else {
      // Provide empty address structure
      organizationData.headquarters_address = {
        street: '',
        city: '',
        postal_code: '',
        country: ''
      };
    }

    // Clean up and standardize the data
    const finalData = {
      legal_name: organizationData.legal_name || organizationData.name || organizationName,
      industry_primary: organizationData.industry_primary || organizationData.industry || '',
      industry_secondary: organizationData.industry_secondary || '',
      company_size: organizationData.company_size || organizationData.employees || '',
      website: organizationData.website || '',
      primary_contact_email: organizationData.primary_contact_email || organizationData.email || '',
      primary_contact_phone: organizationData.primary_contact_phone || organizationData.phone || '',
      headquarters_address: organizationData.headquarters_address,
      description: organizationData.description || '',
      // Add name and slug (with unique suffix to avoid conflicts)
      name: organizationName,
      slug: organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 8)
    };

    console.log('Returning organization data:', finalData);

    return NextResponse.json(finalData);
    
  } catch (error) {
    console.error('Error looking up organization:', error);
    return NextResponse.json(
      { error: 'Failed to lookup organization information' },
      { status: 500 }
    );
  }
}

// Optional: Add a route to check if search API is configured
export async function GET() {
  const hasSerperKey = !!process.env.SERPER_API_KEY;
  const hasGoogleKey = !!process.env.GOOGLE_API_KEY;
  
  return NextResponse.json({
    searchEnabled: hasSerperKey || hasGoogleKey,
    provider: hasSerperKey ? 'serper' : hasGoogleKey ? 'google' : 'none',
    message: hasSerperKey || hasGoogleKey 
      ? 'Search API configured - will fetch live data' 
      : 'No search API configured - using AI knowledge only. Add SERPER_API_KEY to .env.local for live search.'
  });
}
