import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceData {
  invoiceNumber: string;
  client: {
    name: string;
    email: string;
    address: string;
    gstin?: string;
  };
  issueDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    gstPercentage: number;
    amount: number;
  }>;
  subtotal: number;
  gstAmount: number;
  total: number;
  status: string;
  paymentDetails?: {
    paymentId?: string;
    method?: string;
    amount?: number;
    paidAt?: string;
  };
  notes?: string;
  termsAndConditions?: string;
  companyDetails?: {
    name: string;
    gstin?: string;
    address?: string;
    phone?: string;
    email?: string;
    bankDetails?: {
      accountName: string;
      accountNumber: string;
      bankName: string;
      ifsc: string;
    };
    upiId?: string;
  };
}

export class PDFGenerator {
  private logoDataUrl: string | null = null;

  private async loadLogo(): Promise<string> {
    if (this.logoDataUrl) {
      return this.logoDataUrl;
    }

    try {
      // Use absolute URL for server-side requests
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/logo.png`);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/png';
      this.logoDataUrl = `data:${mimeType};base64,${base64}`;
      return this.logoDataUrl;
    } catch (error) {
      console.error('Error loading logo:', error);
      return '';
    }
  }

  private formatCurrency(amount: number): string {
    // Handle very small amounts properly
    if (amount < 1) {
      return `₹${amount.toFixed(2)}`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN');
  }

  private async addHeader(doc: jsPDF, companyDetails: any): Promise<void> {
    // Load and add the actual logo
    const logoDataUrl = await this.loadLogo();
    
    if (logoDataUrl) {
      try {
        // Add the logo image
        doc.addImage(logoDataUrl, 'PNG', 20, 20, 35, 35);
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
        // Fallback to text-based logo
        this.addFallbackLogo(doc);
      }
    } else {
      // Fallback to text-based logo
      this.addFallbackLogo(doc);
    }

    // Company Name
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Bytes Flare', 65, 30);
    
    // INFOTECH subtitle
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('INFOTECH', 65, 38);

    // Company Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let yPos = 50;
    if (companyDetails?.gstin) {
      doc.text(`GSTIN: ${companyDetails.gstin}`, 65, yPos);
      yPos += 5;
    }
    if (companyDetails?.address) {
      doc.text(companyDetails.address, 65, yPos);
      yPos += 5;
    }
    if (companyDetails?.phone) {
      doc.text(`Phone: ${companyDetails.phone}`, 65, yPos);
      yPos += 5;
    }
    if (companyDetails?.email) {
      doc.text(`Email: ${companyDetails.email}`, 65, yPos);
    }
  }

  private addFallbackLogo(doc: jsPDF): void {
    // Bytes Flare Logo (fallback)
    // Dark blue background
    doc.setFillColor(30, 58, 138); // Dark blue
    doc.rect(20, 20, 35, 35, 'F');
    
    // White border
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(2);
    doc.rect(20, 20, 35, 35);
    
    // Inner orange flame (using circles instead of ellipses)
    doc.setFillColor(249, 115, 22); // Orange
    doc.circle(32, 32, 4, 'F');
    
    // Outer cyan flame
    doc.setFillColor(34, 211, 238); // Cyan
    doc.circle(34, 32, 3, 'F');
    
    // Digital pixels
    doc.setFillColor(249, 115, 22); // Orange
    doc.rect(28, 28, 1, 1, 'F');
    doc.rect(29, 29, 0.5, 0.5, 'F');
    doc.rect(27, 30, 0.5, 0.5, 'F');
    
    doc.setFillColor(34, 211, 238); // Cyan
    doc.rect(29, 28, 0.5, 0.5, 'F');
    doc.rect(28, 29, 0.5, 0.5, 'F');
  }

  private addInvoiceTitle(doc: jsPDF, invoiceNumber: string): void {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('INVOICE', 20, 80);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${invoiceNumber}`, 20, 90);
  }

  private addClientDetails(doc: jsPDF, client: any, issueDate: string, dueDate: string): void {
    // Bill To section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, 110);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let yPos = 120;
    doc.text(client.name, 20, yPos);
    yPos += 5;
    doc.text(client.email, 20, yPos);
    yPos += 5;
    
    // Handle long addresses by splitting them
    const addressLines = doc.splitTextToSize(client.address, 80);
    addressLines.forEach((line: string) => {
      doc.text(line, 20, yPos);
      yPos += 5;
    });
    
    if (client.gstin) {
      yPos += 2;
      doc.text(`GSTIN: ${client.gstin}`, 20, yPos);
    }

    // Invoice dates - better positioned and aligned
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Details:', 120, 110);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Issue Date: ${this.formatDate(issueDate)}`, 120, 120);
    doc.text(`Due Date: ${this.formatDate(dueDate)}`, 120, 130);
  }

  private addItemsTable(doc: jsPDF, items: any[]): number {
    const startY = 160;
    const tableWidth = 175; // Increased width to accommodate all columns
    const colWidths = [60, 15, 25, 15, 30, 25];
    const colPositions = [20, 80, 95, 120, 135, 170];

    // Table header with better styling
    doc.setFillColor(240, 240, 240);
    doc.rect(20, startY, tableWidth, 15, 'F');
    
    // Add border to header
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(20, startY, tableWidth, 15);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    const headers = ['Description', 'Qty', 'Rate (₹)', 'GST %', 'Amount (₹)', 'Total (₹)'];
    headers.forEach((header, index) => {
      doc.text(header, colPositions[index], startY + 10);
    });

    // Table rows
    let currentY = startY + 15;
    items.forEach((item, index) => {
      if (currentY > 250) {
        // Add new page if needed
        doc.addPage();
        currentY = 20;
      }

      // Add border to each row
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(20, currentY, tableWidth, 15);

      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(20, currentY, tableWidth, 15, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      // Wrap text for description
      const description = doc.splitTextToSize(item.description, colWidths[0] - 5);
      doc.text(description, colPositions[0], currentY + 10);
      
      doc.text(item.quantity.toString(), colPositions[1], currentY + 10);
      doc.text(this.formatCurrency(item.rate), colPositions[2], currentY + 10);
      doc.text(`${item.gstPercentage}%`, colPositions[3], currentY + 10);
      doc.text(this.formatCurrency(item.amount), colPositions[4], currentY + 10);
      
      // Calculate total with GST
      const itemTotal = item.amount + (item.amount * item.gstPercentage / 100);
      doc.text(this.formatCurrency(itemTotal), colPositions[5], currentY + 10);
      
      currentY += 15;
    });

    return currentY;
  }

  private addTotals(doc: jsPDF, subtotal: number, gstAmount: number, total: number, startY: number): void {
    const rightAlign = 195;
    const leftAlign = 145;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Subtotal
    doc.text('Subtotal:', leftAlign, startY);
    doc.text(this.formatCurrency(subtotal), rightAlign, startY);
    
    // GST
    doc.text('GST:', leftAlign, startY + 10);
    doc.text(this.formatCurrency(gstAmount), rightAlign, startY + 10);
    
    // Draw line above total
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(leftAlign, startY + 18, rightAlign, startY + 18);
    
    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total:', leftAlign, startY + 25);
    doc.text(this.formatCurrency(total), rightAlign, startY + 25);
    
    // Draw box around totals
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(leftAlign - 5, startY - 5, rightAlign - leftAlign + 10, 35);
  }

  private addPaymentStatus(doc: jsPDF, status: string, startY: number, paymentDetails?: any): number {
    let currentY = startY + 10;
    
    if (status === 'paid') {
      // Paid status with green background
      doc.setFillColor(240, 253, 244); // Light green
      doc.rect(20, currentY, 170, 30, 'F');
      
      // Green border
      doc.setDrawColor(34, 197, 94); // Green
      doc.setLineWidth(1);
      doc.rect(20, currentY, 170, 30);
      
      // Payment status text
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 163, 74); // Dark green
      doc.text('✓ PAYMENT RECEIVED', 25, currentY + 8);
      
      // Payment details
      if (paymentDetails) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        let detailY = currentY + 15;
        if (paymentDetails.paymentId) {
          doc.text(`Payment ID: ${paymentDetails.paymentId}`, 25, detailY);
          detailY += 5;
        }
        if (paymentDetails.method) {
          doc.text(`Method: ${paymentDetails.method}`, 25, detailY);
          detailY += 5;
        }
        if (paymentDetails.amount) {
          doc.text(`Amount: ${this.formatCurrency(paymentDetails.amount)}`, 25, detailY);
          detailY += 5;
        }
        if (paymentDetails.paidAt) {
          doc.text(`Paid On: ${this.formatDate(paymentDetails.paidAt)}`, 25, detailY);
        }
      }
      
      currentY += 35;
    } else {
      // Unpaid status with red background
      doc.setFillColor(254, 242, 242); // Light red
      doc.rect(20, currentY, 170, 20, 'F');
      
      // Red border
      doc.setDrawColor(239, 68, 68); // Red
      doc.setLineWidth(1);
      doc.rect(20, currentY, 170, 20);
      
      // Unpaid status text
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38); // Dark red
      doc.text('⚠ PAYMENT PENDING', 25, currentY + 8);
      
      // Due date reminder
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('Please make payment as per terms', 25, currentY + 15);
      
      currentY += 25;
    }
    
    return currentY;
  }

  private addFooter(doc: jsPDF, notes?: string, termsAndConditions?: string): void {
    const pageHeight = doc.internal.pageSize.height;
    let yPos = pageHeight - 60;

    if (notes) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      const noteLines = doc.splitTextToSize(notes, 170);
      doc.text(noteLines, 20, yPos);
      yPos += noteLines.length * 5 + 10;
    }

    if (termsAndConditions) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Terms & Conditions:', 20, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      const termsLines = doc.splitTextToSize(termsAndConditions, 170);
      doc.text(termsLines, 20, yPos);
    }

    // Footer text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text('This is a computer-generated invoice by Bytes Flare Infotech.', 20, pageHeight - 20);
  }

  public async generateInvoicePDF(invoiceData: InvoiceData): Promise<Blob> {
    console.log('PDF Generation - Invoice Data:', invoiceData);
    const doc = new jsPDF();
    
    // Add header
    await this.addHeader(doc, invoiceData.companyDetails);
    
    // Add invoice title
    this.addInvoiceTitle(doc, invoiceData.invoiceNumber);
    
    // Add client details
    this.addClientDetails(doc, invoiceData.client, invoiceData.issueDate, invoiceData.dueDate);
    
    // Add items table
    const tableEndY = this.addItemsTable(doc, invoiceData.items);
    
    // Add totals
    this.addTotals(doc, invoiceData.subtotal, invoiceData.gstAmount, invoiceData.total, tableEndY + 10);
    
    // Add payment status
    const paymentStatusY = this.addPaymentStatus(doc, invoiceData.status, tableEndY + 50, invoiceData.paymentDetails);
    
    // Add footer
    this.addFooter(doc, invoiceData.notes, invoiceData.termsAndConditions);
    
    // Return as blob
    return doc.output('blob');
  }

  public async generateInvoiceFromHTML(elementId: string, filename?: string): Promise<Blob> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id ${elementId} not found`);
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return doc.output('blob');
  }

  public downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  public printPDF(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);
    };
  }
}

export const pdfGenerator = new PDFGenerator();
