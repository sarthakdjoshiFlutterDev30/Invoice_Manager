import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = requireAuth(req.headers);
  if (error) return NextResponse.json(error, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;
    const client = await Client.findOne({ _id: id, createdBy: user!.id });
    if (!client) return NextResponse.json({ success: false, message: 'Client not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: client });
  } catch (err) {
    console.error('Error fetching client:', err);
    return NextResponse.json({ success: false, message: 'Error fetching client' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = requireAuth(req.headers);
  if (error) return NextResponse.json(error, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;
    const data = await req.json();
    const client = await Client.findOneAndUpdate({ _id: id, createdBy: user!.id }, data, { new: true });
    if (!client) return NextResponse.json({ success: false, message: 'Client not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: client });
  } catch (err) {
    console.error('Error updating client:', err);
    return NextResponse.json({ success: false, message: 'Error updating client' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = requireAuth(req.headers);
  if (error) return NextResponse.json(error, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;
    const client = await Client.findOneAndDelete({ _id: id, createdBy: user!.id });
    if (!client) return NextResponse.json({ success: false, message: 'Client not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Client deleted successfully' });
  } catch (err) {
    console.error('Error deleting client:', err);
    return NextResponse.json({ success: false, message: 'Error deleting client' }, { status: 500 });
  }
}
