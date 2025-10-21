import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';

// GET all clients
export async function GET() {
  try {
    await connectDB();
    
    // Use default user ID for direct access
    const defaultUserId = '68f601d13b9fdf3a0dce46a7';
    
    const clients = await Client.find({ createdBy: defaultUserId }).sort({ name: 1 });
    
    return NextResponse.json(
      { success: true, count: clients.length, data: clients },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching clients' },
      { status: 500 }
    );
  }
}

// POST create new client
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    // Use default user ID for direct access
    const defaultUserId = '68f601d13b9fdf3a0dce46a7';
    
    const data = await req.json();
    console.log('Client data:', data);
    
    // Add default user ID to created by
    data.createdBy = defaultUserId;
    
    const client = await Client.create(data);
    console.log('Client created:', client);
    
    return NextResponse.json(
      { success: true, data: client },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { success: false, message: 'Error creating client' },
      { status: 500 }
    );
  }
}