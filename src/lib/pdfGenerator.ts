import jsPDF from 'jspdf';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  gstPercentage: number;
  amount?: number;
}

interface InvoiceData {
  invoiceNumber: string;
  client: ClientData;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal?: number;
  gstAmount?: number;
  total?: number;
  status: 'paid' | 'unpaid' | string;
  notes?: string;
  termsAndConditions?: string;
  companyDetails?: CompanyDetails;
  paymentDetails?: {
    paymentId?: string;
    method?: string;
    amount?: number;
    paidAt?: string;
  };
}

interface ClientData {
  name: string;
  email: string;
  address: string;
  gstin?: string;
}

interface CompanyDetails {
  name: string;
  gstin?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
}

// Minimal, elegant palette (Stripe inspired)
const COLORS = {
  text: [30, 41, 59] as [number, number, number],       // Slate 800 - main text
  textMuted: [100, 116, 139] as [number, number, number], // Slate 500 - labels
  border: [226, 232, 240] as [number, number, number],   // Slate 200 - thin lines
  accent: [79, 70, 229] as [number, number, number],     // Indigo 600 - subtle highlights
  bgHeader: [248, 250, 252] as [number, number, number], // Slate 50
  greenTheme: [16, 185, 129] as [number, number, number],
  redTheme: [239, 68, 68] as [number, number, number],
};

export class PDFGenerator {

  private toNumber(value: unknown): number {
    const n = Number(value);
    return isNaN(n) ? 0 : n;
  }

  private formatCurrency(amount: unknown): string {
    const value = this.toNumber(amount);
    // Note: To avoid jsPDF unicode issues with the ₹ symbol, we use standard formatting
    // and will prepend 'INR ' manually or just let Intl format it without specific symbol mapping if possible.
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  private formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  // Helper setters
  private setTextColor(doc: jsPDF, rgb: [number, number, number]) {
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  }

  private setDrawColor(doc: jsPDF, rgb: [number, number, number]) {
    doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  }

  private setFillColor(doc: jsPDF, rgb: [number, number, number]) {
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  }

  // ─── Header Section ──────────────────────────────────────────────
  private addHeader(doc: jsPDF, company?: CompanyDetails, invoiceNum?: string) {
    let currentY = 15;
    
    // Logo
    if (company?.logo && company.logo.startsWith('data:image')) {
      try {
        // Render logo small and crisp
        doc.addImage(company.logo, 'PNG', 14, currentY, 20, 20);
        currentY += 25;
      } catch {
        currentY += 5;
      }
    } else {
      currentY += 5;
    }

    // Company Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    this.setTextColor(doc, COLORS.text);
    doc.text(company?.name || 'Bytesflare Infotech', 14, currentY);

    // Right Side - Invoice Title
    const pageWidth = doc.internal.pageSize.width;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(32);
    this.setTextColor(doc, COLORS.border); // Very light grey large text
    doc.text('INVOICE', pageWidth - 14, currentY, { align: 'right' });

    currentY += 8;

    // Company Contact Details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    this.setTextColor(doc, COLORS.textMuted);
    
    const addressLines = doc.splitTextToSize(company?.address || 'Your Company Address', 80);
    doc.text(addressLines, 14, currentY);
    currentY += (addressLines.length * 4.5);

    if (company?.gstin) {
      doc.text(`GSTIN: ${company.gstin}`, 14, currentY);
      currentY += 4.5;
    }
    
    // Combine email and phone on one line
    const contacts = [company?.phone, company?.email].filter(Boolean).join('  •  ');
    if (contacts) {
      doc.text(contacts, 14, currentY);
      currentY += 4.5;
    }

    // Invoice # on right side aligned with bottom of address
    doc.setFontSize(10);
    this.setTextColor(doc, COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice Number`, pageWidth - 14, currentY - 5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    this.setTextColor(doc, COLORS.textMuted);
    doc.text(invoiceNum || '-', pageWidth - 14, currentY, { align: 'right' });

    return currentY + 12; // Next Y starting point
  }

  // ─── Info Strip: Dates, Bill To ──────────────────────────────
  private addInfoBlock(doc: jsPDF, y: number, data: InvoiceData): number {
    const pageWidth = doc.internal.pageSize.width;
    
    // Divider line
    this.setDrawColor(doc, COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(14, y, pageWidth - 14, y);
    
    y += 10;

    // Bill To Section (Left)
    this.setTextColor(doc, COLORS.textMuted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('BILL TO', 14, y);

    y += 6;
    this.setTextColor(doc, COLORS.text);
    doc.setFontSize(10);
    doc.text(data.client.name, 14, y);

    y += 5;
    this.setTextColor(doc, COLORS.textMuted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (data.client.email) {
      doc.text(data.client.email, 14, y);
      y += 5;
    }

    const cAddr = doc.splitTextToSize(data.client.address || '', 80);
    doc.text(cAddr, 14, y);
    y += (cAddr.length * 5);

    if (data.client.gstin) {
      doc.text(`GSTIN: ${data.client.gstin}`, 14, y);
    }

    // Dates Section (Right)
    let rightY = y - (cAddr.length * 5) - 10; // Reset to top of block
    
    this.setTextColor(doc, COLORS.textMuted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('ISSUE DATE', pageWidth - 60, rightY);
    doc.text('DUE DATE', pageWidth - 14, rightY, { align: 'right' });

    rightY += 6;
    this.setTextColor(doc, COLORS.text);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(this.formatDate(data.issueDate), pageWidth - 60, rightY);
    doc.text(this.formatDate(data.dueDate), pageWidth - 14, rightY, { align: 'right' });

    // Payment Status Badge
    rightY += 12;
    const isPaid = data.status === 'paid';
    const badgeColor = isPaid ? COLORS.greenTheme : COLORS.textMuted;
    const badgeText = isPaid ? 'PAID' : 'PENDING';
    
    doc.setLineWidth(0.3);
    this.setDrawColor(doc, badgeColor);
    doc.roundedRect(pageWidth - 36, rightY, 22, 7, 1, 1, 'D');
    
    this.setTextColor(doc, badgeColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(badgeText, pageWidth - 25, rightY + 4.8, { align: 'center' });

    // Return max Y
    return Math.max(y + 10, rightY + 15);
  }

  // ─── Items Table ──────────────────────────────────────────────────
  private addItemsTable(doc: jsPDF, items: InvoiceItem[], startY: number): number {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    const tableWidth = pageWidth - margin * 2;
    
    // Columns config
    const headers = ['Description', 'Qty', 'Rate', 'GST', 'Amount'];
    const positions = [
      margin,               // Desc (Left)
      margin + tableWidth * 0.45,  // Qty (Right)
      margin + tableWidth * 0.65,  // Rate (Right)
      margin + tableWidth * 0.80,  // GST (Right)
      margin + tableWidth,         // Amount (Right)
    ];
    const aligns: ('left' | 'right')[] = ['left', 'right', 'right', 'right', 'right'];

    // Table Header Background
    this.setFillColor(doc, COLORS.bgHeader);
    doc.rect(margin, startY, tableWidth, 10, 'F');
    
    // Table Header Text
    let y = startY + 6.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    this.setTextColor(doc, COLORS.text);
    
    headers.forEach((h, i) => {
      doc.text(h, positions[i], y, { align: aligns[i] });
    });

    y += 4;
    
    // Items
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    items.forEach((item) => {
      const qty = this.toNumber(item.quantity);
      const rate = this.toNumber(item.rate);
      const gstPct = this.toNumber(item.gstPercentage);
      const amt = qty * rate;
      const gstAmt = (amt * gstPct) / 100;
      const lineTotal = amt + gstAmt;

      y += 8; // Row padding top

      const descLines = doc.splitTextToSize(item.description || '-', tableWidth * 0.40);
      
      // Values
      const rowData = [
        '', // Space for desc
        String(qty),
        this.formatCurrency(rate),
        `${gstPct}%`,
        this.formatCurrency(lineTotal)
      ];

      this.setTextColor(doc, COLORS.textMuted); // Light color for numericals
      rowData.forEach((val, i) => {
        if (i !== 0) doc.text(val, positions[i], y, { align: aligns[i] });
      });

      // Description text (darker)
      this.setTextColor(doc, COLORS.text);
      doc.text(descLines, positions[0], y);

      y += (descLines.length - 1) * 5; // Adjust Y based on desc length
      
      y += 4; // Row padding bottom
      
      // Very thin divider line between rows
      this.setDrawColor(doc, [241, 245, 249]);
      doc.setLineWidth(0.1);
      doc.line(margin, y, pageWidth - margin, y);
    });

    return y + 5;
  }

  // ─── Totals Section ───────────────────────────────────────────────
  private addTotals(doc: jsPDF, data: InvoiceData, y: number): number {
    const pageWidth = doc.internal.pageSize.width;
    
    // Compute totals if not provided directly
    const subtotal = data.subtotal ?? (data.items || []).reduce((s, i) => s + (this.toNumber(i.quantity) * this.toNumber(i.rate)), 0);
    const gstAmount = data.gstAmount ?? (data.items || []).reduce((s, i) => s + ((this.toNumber(i.quantity) * this.toNumber(i.rate) * this.toNumber(i.gstPercentage)) / 100), 0);
    const total = data.total ?? (subtotal + gstAmount);

    const rightCol = pageWidth - 14;
    const leftCol = pageWidth - 70;

    let cy = y + 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    this.setTextColor(doc, COLORS.textMuted);
    doc.text('Subtotal', leftCol, cy);
    this.setTextColor(doc, COLORS.text);
    doc.text(this.formatCurrency(subtotal), rightCol, cy, { align: 'right' });

    cy += 7;
    this.setTextColor(doc, COLORS.textMuted);
    doc.text('Tax (GST)', leftCol, cy);
    this.setTextColor(doc, COLORS.text);
    doc.text(this.formatCurrency(gstAmount), rightCol, cy, { align: 'right' });

    cy += 6;
    this.setDrawColor(doc, COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(leftCol, cy, rightCol, cy);

    cy += 8;
    this.setTextColor(doc, COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Total', leftCol, cy);
    // Use INR text explicitly instead of symbol to avoid font rendering issues
    doc.text(`INR ${this.formatCurrency(total)}`, rightCol, cy, { align: 'right' });

    return cy + 10;
  }

  // ─── Notes & Footer ───────────────────────────────────────────────
  private addFooter(doc: jsPDF, data: InvoiceData, y: number) {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    let cy = y + 10;
    
    doc.setFontSize(8);
    
    if (data.notes) {
      doc.setFont('helvetica', 'bold');
      this.setTextColor(doc, COLORS.textMuted);
      doc.text('NOTES', 14, cy);
      cy += 5;
      
      doc.setFont('helvetica', 'normal');
      this.setTextColor(doc, COLORS.text);
      const lines = doc.splitTextToSize(data.notes, pageWidth - 100);
      doc.text(lines, 14, cy);
      cy += (lines.length * 4) + 5;
    }

    if (data.termsAndConditions) {
      doc.setFont('helvetica', 'bold');
      this.setTextColor(doc, COLORS.textMuted);
      doc.text('TERMS & CONDITIONS', 14, cy);
      cy += 5;
      
      doc.setFont('helvetica', 'normal');
      this.setTextColor(doc, COLORS.text);
      const lines = doc.splitTextToSize(data.termsAndConditions, pageWidth - 100);
      doc.text(lines, 14, cy);
    }
    
    // Bottom centered footer
    doc.setFontSize(7);
    this.setTextColor(doc, COLORS.textMuted);
    const footerText = `Computer-generated invoice by ${data.companyDetails?.name || 'Bytesflare Infotech'}.`;
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  // ─── PUBLIC HELPERS ───────────────────────────────────────────────
  public downloadPDF(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  public printPDF(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      URL.revokeObjectURL(url);
      setTimeout(() => document.body.removeChild(iframe), 2000);
    };
  }

  // ─── MAIN GENERATOR ───────────────────────────────────────────────
  async generateInvoicePDF(data: InvoiceData): Promise<Blob> {
    // Generate standard A4 size
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

    try {
      let y = this.addHeader(doc, data.companyDetails, data.invoiceNumber);
      y = this.addInfoBlock(doc, y, data);
      
      if (data.items && data.items.length > 0) {
        y = this.addItemsTable(doc, data.items, y);
      }
      
      y = this.addTotals(doc, data, y);
      this.addFooter(doc, data, y);
    } catch (err) {
      console.error('PDF generation error:', err);
      // Fallback minimalist invoice
      doc.text('Invoice', 14, 20);
      doc.text(`Invoice #: ${data.invoiceNumber || '-'}`, 14, 30);
    }

    return doc.output('blob');
  }
}

export const pdfGenerator = new PDFGenerator();
