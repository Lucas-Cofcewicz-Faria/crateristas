import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ success: false, error: 'A URL do Google Maps é obrigatória' });
    }

    // 1. Resolve redirect if shortened/sharing link (maps.app.goo.gl, goo.gl/maps, share.google)
    let resolvedUrl = url;
    let redirectCount = 0;
    
    while (
      redirectCount < 5 && 
      (resolvedUrl.includes('maps.app.goo.gl') || 
       resolvedUrl.includes('goo.gl/maps') || 
       resolvedUrl.includes('share.google'))
    ) {
      const redirectRes = await fetch(resolvedUrl, { 
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const location = redirectRes.headers.get('location');
      if (location) {
        resolvedUrl = location;
        redirectCount++;
      } else {
        break;
      }
    }

    // Try to extract name from URL parameters or path
    let extractedName = '';
    try {
      const urlObj = new URL(resolvedUrl);
      const qParam = urlObj.searchParams.get('q');
      if (qParam) {
        extractedName = qParam;
      }
    } catch (e) {
      // Ignored
    }

    if (!extractedName) {
      const placeMatch = resolvedUrl.match(/\/maps\/place\/([^/@]+)/);
      if (placeMatch) {
        extractedName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      }
    }

    // 2. Fetch page HTML to extract Open Graph meta tags
    let ogTitle = '';
    let ogDesc = '';
    let ogImage = '';
    
    try {
      const pageRes = await fetch(resolvedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
        }
      });
      const html = await pageRes.text();
      
      const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                         html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
      const descMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i);
      const imageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                         html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);

      if (titleMatch) ogTitle = decodeHtmlEntities(titleMatch[1]);
      if (descMatch) ogDesc = decodeHtmlEntities(descMatch[1]);
      if (imageMatch) ogImage = decodeHtmlEntities(imageMatch[1]);
    } catch (err) {
      console.error("Direct fetch failed:", err);
    }

    let name = '';
    let locationStr = 'São Paulo - SP';
    let cuisine = 'Fusão Contemporânea';

    // 3. Populate fields from parsed metadata or fallback
    if (ogTitle && ogTitle.includes(' · ')) {
      const titleParts = ogTitle.split(' · ');
      name = titleParts[0];
      
      if (titleParts[1]) {
        const address = titleParts[1];
        const addressParts = address.split(' - ');
        if (addressParts.length >= 2) {
          const neighborhoodCity = addressParts[1].split(',');
          const neighborhood = neighborhoodCity[0].trim();
          locationStr = `${neighborhood}, São Paulo - SP`;
        }
      }
      
      if (ogDesc) {
        const descParts = ogDesc.split(' · ');
        const categoryCandidate = descParts[1] || descParts[0];
        if (categoryCandidate) {
          cuisine = detectCuisine(categoryCandidate + ' ' + ogTitle);
        }
      } else {
        cuisine = detectCuisine(ogTitle);
      }
    } else {
      // Fallback: If ogTitle is empty (blocked) or doesn't have the details, search on DuckDuckGo
      const searchName = extractedName || 'Restaurante';
      
      try {
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchName + ' São Paulo')}`;
        const ddgRes = await fetch(ddgUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
          }
        });
        const ddgHtml = await ddgRes.text();
        
        name = searchName;
        cuisine = detectCuisine(ddgHtml + ' ' + searchName);
        
        // Match address from DuckDuckGo search results
        const addressRegex = /(?:Av\.|Avenida|R\.|Rua|Al\.|Alameda|Travessa|Tr\.|Praça|Pç\.)\s+([^,]+),\s*(\d+|s\/n)\s*-\s*([^,]+),\s*([^,-]+)/gi;
        let match;
        let bestNeighborhood = '';
        let bestCity = '';
        
        while ((match = addressRegex.exec(ddgHtml)) !== null) {
          const neighborhood = match[3].replace(/<[^>]+>/g, '').trim();
          const city = match[4].replace(/<[^>]+>/g, '').trim();
          
          if (neighborhood && neighborhood.length < 50 && city && city.length < 50) {
            bestNeighborhood = neighborhood;
            bestCity = city;
            // If the city is explicitly São Paulo, it's a perfect match
            if (city.toLowerCase().includes('são paulo') || city.toLowerCase().includes('sao paulo')) {
              break;
            }
          }
        }
        
        if (bestNeighborhood) {
          // If the city name is not São Paulo (e.g. Osasco, Barueri), format appropriately
          if (bestCity && !bestCity.toLowerCase().includes('são paulo') && !bestCity.toLowerCase().includes('sao paulo') && !bestCity.toLowerCase().includes('telefone')) {
            locationStr = `${bestNeighborhood}, ${bestCity} - SP`;
          } else {
            locationStr = `${bestNeighborhood}, São Paulo - SP`;
          }
        }
      } catch (err) {
        console.error("DuckDuckGo fallback search failed:", err);
        name = searchName;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        name: name || 'Restaurante na Cratera',
        location: locationStr,
        cuisine,
        image: ogImage || ''
      }
    });

  } catch (error: any) {
    console.error("Error parsing maps link:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}

function decodeHtmlEntities(str: string) {
  return str.replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
}

function detectCuisine(text: string): string {
  const lowercase = text.toLowerCase();
  
  if (lowercase.includes('italiana') || lowercase.includes('italiano') || lowercase.includes('pasta') || lowercase.includes('massa') || lowercase.includes('pizzaria') || lowercase.includes('pizza')) {
    return 'Italiana';
  }
  if (lowercase.includes('francesa') || lowercase.includes('francês') || lowercase.includes('bistrô') || lowercase.includes('bistro')) {
    return 'Francesa';
  }
  if (lowercase.includes('japonesa') || lowercase.includes('japonês') || lowercase.includes('sushi') || lowercase.includes('temaki') || lowercase.includes('izakaya')) {
    return 'Japonesa';
  }
  if (lowercase.includes('espanhola') || lowercase.includes('espanhol') || lowercase.includes('tapas') || lowercase.includes('paella')) {
    return 'Espanhola';
  }
  if (lowercase.includes('mexicana') || lowercase.includes('mexicano') || lowercase.includes('taco') || lowercase.includes('nacho') || lowercase.includes('méxico') || lowercase.includes('mexico')) {
    return 'Mexicana';
  }
  if (lowercase.includes('churrascaria') || lowercase.includes('grelhados') || lowercase.includes('carne') || lowercase.includes('carnes') || lowercase.includes('steak') || lowercase.includes('picanha') || lowercase.includes('hamburguer') || lowercase.includes('burger')) {
    return 'Grelhados / Carnes';
  }
  if (lowercase.includes('nórdica') || lowercase.includes('nordica') || lowercase.includes('escandinava')) {
    return 'Nórdica';
  }
  
  return 'Fusão Contemporânea'; // Default fallback
}
