import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import Client from '@/models/Client';
import User from '@/models/User';
import { getCurrentUserFromHeaders } from '@/lib/auth';
import { pdfGenerator } from '@/lib/pdfGenerator';

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

    // Get user's company details
    const userDetails = await User.findById(defaultUserId).select('companyDetails');
    
    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      client: {
        name: invoice.client.name,
        email: invoice.client.email,
        address: invoice.client.address,
        gstin: invoice.client.gstin,
      },
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      items: invoice.items,
      subtotal: invoice.subtotal,
      gstAmount: invoice.gstAmount,
      total: invoice.total,
      status: invoice.status,
      paymentDetails: invoice.paymentDetails,
      notes: invoice.notes,
      termsAndConditions: invoice.termsAndConditions,
      companyDetails: userDetails?.companyDetails || {
        name: 'Bytesflare Infotech',
        gstin: '29ABCDE1234F1Z5',
        address: '123 Tech Park, Bangalore, Karnataka 560001',
        phone: '+91 9876543210',
        email: 'info@bytesflare.com',
      },
    };

    const pdfBlob = await pdfGenerator.generateInvoicePDF(invoiceData);
    const pdfBuffer = await pdfBlob.arrayBuffer();
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { success: false, message: 'Error generating PDF' },
      { status: 500 }
    );
  }
}
