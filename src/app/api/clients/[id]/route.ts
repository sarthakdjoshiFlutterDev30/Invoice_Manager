import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';

// GET single client
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    // Use default user ID for direct access
    const defaultUserId = '68f601d13b9fdf3a0dce46a7';

    const { id } = await params;
    const client = await Client.findOne({
      _id: id,
      createdBy: defaultUserId,
    });

    if (!client) {
      return NextResponse.json(
        { success: false, message: 'Client not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: client },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching client' },
      { status: 500 }
    );
  }
}

// PATCH update client
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    // Use default user ID for direct access
    const defaultUserId = '68f601d13b9fdf3a0dce46a7';
    
    const data = await req.json();
    const { id } = await params;

    const client = await Client.findOneAndUpdate(
      { _id: id, createdBy: defaultUserId },
      data,
      { new: true }
    );
    if (!client) {
      return NextResponse.json(
        { success: false, message: 'Client not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: client },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { success: false, message: 'Error updating client' },
      { status: 500 }
    );
  }
}

// DELETE client
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    // Use default user ID for direct access
    const defaultUserId = '68f601d13b9fdf3a0dce46a7';
    
    const { id } = await params;
    const client = await Client.findOneAndDelete({
      _id: id,
      createdBy: defaultUserId
    });
    
    if (!client) {
      return NextResponse.json(
        { success: false, message: 'Client not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: 'Client deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { success: false, message: 'Error deleting client' },
      { status: 500 }
    );
  }
}