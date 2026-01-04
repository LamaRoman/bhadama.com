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
    
    const options: RequestInit = {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        }),
      },
    };
    
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const body = await request.text();
      if (body) {
        options.body = body;
      }
    }

    const response = await fetch(url, options);
    const contentType = response.headers.get('Content-Type');

    let data: any;
    if (contentType && contentType.includes('application/json')) {
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

    // Use custom stringify that handles BigInt
    return new NextResponse(JSONStringifyWithBigInt(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Request failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}