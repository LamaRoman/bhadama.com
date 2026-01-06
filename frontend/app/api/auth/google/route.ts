import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') || 'USER';
  
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  return NextResponse.redirect(`${backendUrl}/api/auth/google?role=${role}`);
}