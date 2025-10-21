import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import Invoice from '@/models/Invoice';

// GET all invoices
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    // Ensure Client model is registered
    if (!mongoose.models.Client) {
      mongoose.model('Client', new mongoose.Schema({
        name: String,
        email: String,
        phone: String,
        address: String,
        gstin: String,
        createdBy: mongoose.Schema.Types.ObjectId,
        createdAt: { type: Date, default: Date.now },
      }));
    }
    
    // Use default user ID for direct access
    const defaultUserId = '68f601d13b9fdf3a0dce46a7';
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build query
    const query: Record<string, string | { $gte: Date; $lte: Date }> = { createdBy: defaultUserId };
    
    if (status) query.status = status;
    if (clientId) query.client = clientId;
    if (startDate && endDate) {
      query.issueDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    const invoices = await Invoice.find(query)
      .populate('client', 'name email')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(
      { success: true, count: invoices.length, data: invoices },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching invoices' },
      { status: 500 }
    );
  }
}

// POST create new invoice
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    // Use default user ID for direct access
    const defaultUserId = '68f601d13b9fdf3a0dce46a7';
    
    const data = await req.json();
    
    // Generate invoice number if not provided
    if (!data.invoiceNumber) {
      const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
      const lastNumber = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-')[1]) : 0;
      data.invoiceNumber = `INV-${String(lastNumber + 1).padStart(4, '0')}`;
    }
    
    // Add default user ID to created by
    data.createdBy = defaultUserId;
    
    const invoice = await Invoice.create(data);
    
    return NextResponse.json(
      { success: true, data: invoice },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { success: false, message: 'Error creating invoice' },
      { status: 500 }
    );
  }
}