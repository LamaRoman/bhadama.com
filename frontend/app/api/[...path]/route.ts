import { NextRequest, NextResponse } from 'next/server';

// Add BigInt serialization support
function JSONStringifyWithBigInt(obj: any): string {
  return JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
}

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

export async function PUT(request: NextRequest) {
  return handleRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request);
}

export async function PATCH(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    
    const path = request.nextUrl.pathname;
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : '';
    const url = `${backendUrl}${path}${queryString}`;
    
    console.log(`Proxying: ${request.method} ${url}`);
    
    // Check if request is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    const isFormData = contentType.includes('multipart/form-data');
    
    // ✅ Build headers properly - copy ALL important headers
    const headers: HeadersInit = {};
    
    // ✅ Copy Authorization header (this was missing!)
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
      console.log('✅ Authorization header forwarded:', authHeader.substring(0, 20) + '...');
    } else {
      console.log('❌ No Authorization header found');
    }
    
    // Only add Content-Type for non-FormData requests
    if (!isFormData && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      headers['Content-Type'] = 'application/json';
    }
    
    const options: RequestInit = {
      method: request.method,
      headers,
    };
    
    // Handle body based on content type
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      if (isFormData) {
        // For FormData, pass it through as-is
        options.body = await request.formData() as any;
      } else {
        // For JSON, get as text
        const body = await request.text();
        if (body) {
          options.body = body;
        }
      }
    }

    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const responseContentType = response.headers.get('Content-Type');

      let data: any;
      if (responseContentType && responseContentType.includes('application/json')) {
        const text = await response.text();
        try {
          data = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Response text:', text);
          return NextResponse.json(
            { error: 'Invalid JSON response from server' },
            { status: 500 }
          );
        }
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        console.error(`Backend error: ${response.status}`, data);
      }

      return new NextResponse(JSONStringifyWithBigInt(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Request timeout');
        return NextResponse.json(
          { error: 'Request timeout - backend took too long to respond' },
          { status: 504 }
        );
      }
      
      if (fetchError.code === 'ECONNREFUSED') {
        console.error('Backend not running on:', backendUrl);
        return NextResponse.json(
          { error: 'Backend server is not running. Please start the backend server.' },
          { status: 503 }
        );
      }
      
      throw fetchError;
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Request failed', 
        details: error instanceof Error ? error.message : String(error),
        hint: 'Make sure your backend server is running on http://localhost:5001'
      },
      { status: 500 }
    );
  }
}