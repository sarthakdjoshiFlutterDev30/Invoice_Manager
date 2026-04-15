import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import { pdfGenerator } from '@/lib/pdfGenerator';
import fs from 'fs';
import path from 'path';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = requireAuth(req.headers);
  if (error) return NextResponse.json(error, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;

    const invoice = await Invoice.findOne({ _id: id, createdBy: user!.id })
      .populate('client', 'name email address gstin');

    if (!invoice) return NextResponse.json({ success: false, message: 'Invoice not found' }, { status: 404 });

    const dbUser = await User.findById(user!.id);

    let logoDataURL = '';
    try {
      // Prefer logo from user settings
      if (dbUser?.companyDetails?.logo?.startsWith('data:image')) {
        logoDataURL = dbUser.companyDetails.logo;
      } else {
        const logoPath = path.join(process.cwd(), 'public', 'logo.png');
        if (fs.existsSync(logoPath)) {
          const file = fs.readFileSync(logoPath);
          logoDataURL = `data:image/png;base64,${file.toString('base64')}`;
        }
      }
    } catch { }

    const companyDetails = dbUser?.companyDetails ? dbUser.companyDetails.toObject() : {
      name: 'Bytesflare Infotech', address: '', phone: '', email: '', gstin: '',
    };
    companyDetails.logo = logoDataURL;
    companyDetails.signature = '';

    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      client: { name: invoice.client.name, email: invoice.client.email, address: invoice.client.address, gstin: invoice.client.gstin },
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      items: invoice.items,
      subtotal: invoice.subtotal,
      gstAmount: invoice.gstAmount,
      total: invoice.total,
      status: invoice.status,
      paymentDetails: invoice.paymentDetails,
      paymentHistory: invoice.paymentHistory,
      notes: invoice.notes,
      termsAndConditions: invoice.termsAndConditions,
      companyDetails,
    };

    const pdfBlob = await pdfGenerator.generateInvoicePDF(invoiceData);
    const pdfBuffer = await pdfBlob.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (err) {
    console.error('Error generating PDF:', err);
    return NextResponse.json({ success: false, message: 'Error generating PDF' }, { status: 500 });
  }
}
