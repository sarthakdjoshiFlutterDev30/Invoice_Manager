import jsPDF from 'jspdf';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  gstPercentage: number;
}

interface InvoiceData {
  invoiceNumber: string;
  client: ClientData;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  status: 'paid' | 'unpaid';
  notes?: string;
  termsAndConditions?: string;
  companyDetails?: CompanyDetails;
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

export class PDFGenerator {

  // 🔒 SAFETY: Always convert to number
  private toNumber(value: unknown): number {
    const n = Number(value);
    return isNaN(n) ? 0 : n;
  }

  private formatCurrency(amount: unknown): string {
    const value = this.toNumber(amount);
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  private formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN');
  }

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
      document.body.removeChild(iframe);
    };
  }

  /* ---------------- HEADER ---------------- */
  private addHeader(doc: jsPDF, company?: CompanyDetails) {
    if (company?.logo) {
      try {
        doc.addImage(company.logo, 'PNG', 20, 15, 35, 35);
      } catch {
        // ignore image errors and continue with text header
      }
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(company?.name || 'Bytes Flare', 65, 30);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('INFOTECH', 65, 38);

    let y = 50;
    if (company?.gstin) doc.text(`GSTIN: ${company.gstin}`, 65, y += 5);
    if (company?.address) doc.text(company.address, 65, y += 5);
    if (company?.phone) doc.text(`Phone: ${company.phone}`, 65, y += 5);
    if (company?.email) doc.text(`Email: ${company.email}`, 65, y += 5);
  }

  /* ---------------- INVOICE TITLE ---------------- */
  private addInvoiceTitle(doc: jsPDF, invoiceNo: string) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('INVOICE', 20, 80);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Invoice #: ${invoiceNo}`, 20, 90);
  }

  /* ---------------- CLIENT DETAILS ---------------- */
  private addClientDetails(
    doc: jsPDF,
    client: ClientData,
    issue: string,
    due: string
  ) {
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, 110);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    let y = 120;
    doc.text(client.name, 20, y);
    doc.text(client.email, 20, y += 5);

    const addressLines = doc.splitTextToSize(client.address || '', 80);
    addressLines.forEach((line: string) => {
      doc.text(line, 20, y += 5);
    });

    if (client.gstin) doc.text(`GSTIN: ${client.gstin}`, 20, y += 5);

    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Details:', 120, 110);

    doc.setFont('helvetica', 'normal');
    doc.text(`Issue Date: ${this.formatDate(issue)}`, 120, 120);
    doc.text(`Due Date: ${this.formatDate(due)}`, 120, 130);
  }

  /* ---------------- ITEMS TABLE ---------------- */
  private addItemsTable(doc: jsPDF, items: InvoiceItem[]): number {
    const startY = 160;
    const cols = [20, 80, 95, 120, 145, 190];

    doc.setFillColor(240, 240, 240);
    doc.rect(20, startY, 175, 15, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);

    ['Description', 'Qty', 'Rate (INR)', 'GST %', 'Amount (INR)', 'Total (INR)']
      .forEach((h, i) => doc.text(h, cols[i], startY + 10));

    let y = startY + 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    items.forEach(item => {
      const qty = this.toNumber(item.quantity);
      const rate = this.toNumber(item.rate);
      const gstPct = this.toNumber(item.gstPercentage);

      const amount = qty * rate;
      const gst = (amount * gstPct) / 100;
      const total = amount + gst;

      doc.rect(20, y, 175, 15);
      doc.text(item.description || '-', cols[0], y + 10);
      doc.text(String(qty), cols[1], y + 10);
      doc.text(this.formatCurrency(rate), cols[2], y + 10, { align: 'right' });
      doc.text(`${gstPct}%`, cols[3], y + 10);
      doc.text(this.formatCurrency(amount), cols[4], y + 10, { align: 'right' });
      doc.text(this.formatCurrency(total), cols[5], y + 10, { align: 'right' });

      y += 15;
    });

    return y;
  }

  /* ---------------- TOTALS ---------------- */
  private addTotals(doc: jsPDF, items: InvoiceItem[], y: number) {
    const subtotal = items.reduce(
      (s, i) => s + this.toNumber(i.quantity) * this.toNumber(i.rate),
      0
    );

    const gst = items.reduce(
      (s, i) =>
        s +
        (this.toNumber(i.quantity) *
          this.toNumber(i.rate) *
          this.toNumber(i.gstPercentage)) /
          100,
      0
    );

    const total = subtotal + gst;

    const l = 145;
    const r = 195;

    doc.text('Subtotal:', l, y);
    doc.text(this.formatCurrency(subtotal), r, y, { align: 'right' });

    doc.text('GST:', l, y + 10);
    doc.text(this.formatCurrency(gst), r, y + 10, { align: 'right' });

    doc.line(l, y + 18, r, y + 18);

    doc.setFont('helvetica', 'bold');
    doc.text('Total:', l, y + 25);
    doc.text(this.formatCurrency(total), r, y + 25, { align: 'right' });

    doc.rect(l - 5, y - 5, 55, 35);
  }

  /* ---------------- PAYMENT STATUS ---------------- */
  private addPaymentStatus(doc: jsPDF, status: string, y: number) {
    if (status === 'paid') {
      doc.setFillColor(240, 253, 244);
      doc.rect(20, y, 170, 20, 'F');
      doc.setTextColor(22, 163, 74);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT RECEIVED', 25, y + 12);
    } else {
      doc.setFillColor(254, 242, 242);
      doc.rect(20, y, 170, 20, 'F');
      doc.setTextColor(220, 38, 38);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT PENDING', 25, y + 8);
      doc.setFont('helvetica', 'normal');
      doc.text('Please make payment as per terms', 25, y + 15);
    }
    doc.setTextColor(0, 0, 0);
  }

  /* ---------------- FOOTER ---------------- */
  private addFooter(doc: jsPDF) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(
      'This is a computer-generated invoice by Bytes Flare Infotech.',
      20,
      doc.internal.pageSize.height - 20
    );
  }

  /* ---------------- MAIN ---------------- */
  async generateInvoicePDF(data: InvoiceData): Promise<Blob> {
    const doc = new jsPDF();
    try {
      this.addHeader(doc, data.companyDetails);
      this.addInvoiceTitle(doc, data.invoiceNumber);
      this.addClientDetails(doc, data.client, data.issueDate, data.dueDate);
      const tableEnd = this.addItemsTable(doc, data.items || []);
      this.addTotals(doc, data.items || [], tableEnd + 10);
      this.addPaymentStatus(doc, data.status, tableEnd + 50);
      this.addFooter(doc);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Invoice', 20, 30);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Invoice #: ${data.invoiceNumber || '-'}`, 20, 40);
    }
    return doc.output('blob');
  }
}

export const pdfGenerator = new PDFGenerator();
