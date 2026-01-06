import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') || 'USER';
  
  // Use NEXT_PUBLIC_ for API routes too
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:5001';
  
  console.log('🔍 Backend URL being used:', backendUrl); // Check Vercel logs
  
  return NextResponse.redirect(`${backendUrl}/api/auth/google?role=${role}`);
}
