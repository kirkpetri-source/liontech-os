import { NextResponse } from 'next/server';

function present(name: string): boolean {
  const v = process.env[name];
  return typeof v === 'string' && v.length > 0;
}

export async function GET() {
  const clientVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    // Optional:
    'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
  ];

  const serverVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_STORAGE_BUCKET',
  ];

  const checks = {
    client: Object.fromEntries(
      clientVars.map((k) => [k, present(k)])
    ),
    server: Object.fromEntries(
      serverVars.map((k) => [k, present(k)])
    ),
    meta: {
      node: process.version,
      env: process.env.NODE_ENV,
      vercel: Boolean(process.env.VERCEL),
      commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    },
  } as const;

  // Do not include actual values to avoid leaking secrets
  return NextResponse.json(checks, { status: 200 });
}