import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import Invoice from '@/models/Invoice';
import Client from '@/models/Client';
import { getCurrentUserFromHeaders } from '@/lib/auth';

// GET single invoice
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Use default user ID for direct access
    const defaultUserId = '68f601d13b9fdf3a0dce46a7';
    const { id } = await params;

    const invoice = await Invoice.findOne({
      _id: id,
      createdBy: defaultUserId
    }).populate('client', 'name email address gstin');
    
    if (!invoice) {
      return NextResponse.json(
        { success: false, message: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: invoice },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching invoice' },
      { status: 500 }
    );
  }
}

// PATCH update invoice
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Use default user ID for direct access
    const defaultUserId = '68f601d13b9fdf3a0dce46a7';
    const { id } = await params;

    const data = await req.json();

      // If marking as paid, automatically generate payment details
    if (data.status === 'paid') {
      const invoice = await Invoice.findOne({ _id: id, createdBy: defaultUserId });
      
      if (invoice && invoice.status !== 'paid') {
        // Generate payment ID
        const paymentId = `PAY-${invoice.invoiceNumber}-${Date.now().toString().slice(-6)}`;
        
        // Set payment details
        data.paymentDetails = {
          paymentId: paymentId,
          method: 'bank_transfer',
          amount: invoice.total,
          currency: 'INR',
          status: 'captured',
          paidAt: new Date(),
        };
      }
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: id, createdBy: defaultUserId },
      { ...data, updatedAt: new Date() },
      { new: true }
    ).populate('client', 'name email address gstin');
    
    if (!invoice) {
      return NextResponse.json(
        { success: false, message: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: invoice },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { success: false, message: 'Error updating invoice' },
      { status: 500 }
    );
  }
}

// DELETE invoice
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Use default user ID for direct access
    const defaultUserId = '68f601d13b9fdf3a0dce46a7';
    const { id } = await params;

    const invoice = await Invoice.findOneAndDelete({
      _id: id,
      createdBy: defaultUserId
    });
    
    if (!invoice) {
      return NextResponse.json(
        { success: false, message: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: 'Invoice deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { success: false, message: 'Error deleting invoice' },
      { status: 500 }
    );
  }
}
