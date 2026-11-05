import {NextResponse} from 'next/server';
export async function GET(){const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return NextResponse.json({configured:!!(url&&key),url:url||null,key:key||null},{headers:{'Cache-Control':'no-store'}});}
