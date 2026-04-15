import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req.headers);
  if (error) return NextResponse.json(error, { status: 401 });

  try {
    await connectDB();
    const clients = await Client.find({ createdBy: user!.id }).sort({ name: 1 });
    return NextResponse.json({ success: true, count: clients.length, data: clients });
  } catch (err) {
    console.error('Error fetching clients:', err);
    return NextResponse.json({ success: false, message: 'Error fetching clients' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = requireAuth(req.headers);
  if (error) return NextResponse.json(error, { status: 401 });

  try {
    await connectDB();
    const data = await req.json();
    data.createdBy = user!.id;
    const client = await Client.create(data);
    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (err) {
    console.error('Error creating client:', err);
    return NextResponse.json({ success: false, message: 'Error creating client' }, { status: 500 });
  }
}
