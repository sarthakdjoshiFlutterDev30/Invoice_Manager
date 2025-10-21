# Bytesflare Infotech Invoice Manager

A comprehensive, production-ready Invoice and Billing Management System built with Next.js 14, MongoDB, and Tailwind CSS. This system follows Indian invoicing standards and includes GST compliance, payment integration, and analytics.

## 🚀 Features

### Core Features
- **Dashboard** - Real-time analytics with revenue charts and key metrics
- **Invoice Management** - Create, edit, view, and manage invoices with GST compliance
- **Client Management** - Comprehensive client database with contact information
- **Reports & Analytics** - Detailed financial reports and business insights
- **Settings** - Company profile and branding management

### Technical Features
- **Authentication** - JWT-based secure authentication
- **Database** - MongoDB with Mongoose ODM
- **UI/UX** - Modern, responsive design with Tailwind CSS
- **Charts** - Interactive charts using Recharts
- **Forms** - React Hook Form for form management
- **Notifications** - Toast notifications for user feedback
- **Indian Standards** - INR currency, DD/MM/YYYY date format, GST compliance

### Business Features
- **GST Compliance** - Automatic GST calculation (0%, 5%, 12%, 18%, 28%)
- **Invoice Generation** - Auto-generated invoice numbers (INV-0001, INV-0002, etc.)
- **Payment Tracking** - Track paid, unpaid, partial, and cancelled invoices
- **Client Analytics** - Revenue per client and invoice history
- **Export Options** - PDF generation and print functionality (coming soon)
- **Email Integration** - Send invoices via email (coming soon)
- **Payment Integration** - Razorpay integration (coming soon)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, Lucide React Icons
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Charts**: Recharts
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **PDF Generation**: jsPDF, html2canvas
- **Email**: Nodemailer
- **Payment**: Razorpay

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bytesflare-invoice-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=mongodb+srv://joshisarthak556:Sart9426@cluster0.abjmdff.mongodb.net/InvoiceManagement
   JWT_SECRET=your-jwt-secret-key
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Schema

### User Model
- User authentication and profile information
- Company details and settings
- Role-based access (admin, accountant)

### Invoice Model
- Invoice details with GST compliance
- Client reference and payment tracking
- Itemized billing with tax calculations
- Payment status and transaction details

### Client Model
- Client contact information
- Business details (GSTIN, address)
- Invoice history and analytics

## 🎯 Usage

### Getting Started
1. **Register** - Create your admin account
2. **Login** - Access the dashboard
3. **Add Clients** - Set up your client database
4. **Create Invoices** - Generate professional invoices
5. **Track Payments** - Monitor invoice status
6. **View Reports** - Analyze business performance

### Creating an Invoice
1. Navigate to "Invoices" → "Create Invoice"
2. Select a client from the dropdown
3. Add invoice items with descriptions, quantities, and rates
4. GST will be automatically calculated
5. Review and save the invoice
6. Print or download as PDF

### Managing Clients
1. Go to "Clients" → "Add Client"
2. Fill in client information
3. Add GSTIN for business clients
4. Save and manage client details

## 🔧 Configuration

### Company Settings
- Update company information in Settings
- Add GSTIN, PAN, and bank details
- Upload company logo and signature
- Configure UPI ID for payments

### Invoice Settings
- Customize invoice templates
- Set default payment terms
- Configure GST rates
- Add company branding

## 📊 Features in Detail

### Dashboard
- **Revenue Analytics** - Monthly revenue charts and trends
- **Invoice Statistics** - Total, paid, and unpaid invoice counts
- **Quick Actions** - Fast access to common tasks
- **Recent Activity** - Latest invoices and updates

### Invoice Management
- **GST Compliance** - Automatic tax calculations
- **Multiple Payment Status** - Paid, unpaid, partial, cancelled
- **Invoice Preview** - Real-time preview before saving
- **Bulk Operations** - Manage multiple invoices

### Client Management
- **Comprehensive Profiles** - Complete client information
- **Invoice History** - All invoices per client
- **Revenue Tracking** - Client-wise revenue analytics
- **Quick Invoice Creation** - Create invoices directly from client profiles

### Reports & Analytics
- **Financial Reports** - Revenue, expenses, and profit analysis
- **Client Analytics** - Top clients and performance metrics
- **Payment Reports** - Payment status and trends
- **Export Options** - CSV and PDF export capabilities

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
- **Netlify** - Static site generation
- **Railway** - Full-stack deployment
- **DigitalOcean** - VPS deployment

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcryptjs for password security
- **Input Validation** - Form validation and sanitization
- **CORS Protection** - Cross-origin request security
- **Environment Variables** - Sensitive data protection

## 📱 Responsive Design

- **Mobile-First** - Optimized for mobile devices
- **Tablet Support** - Responsive design for tablets
- **Desktop Optimized** - Full-featured desktop experience
- **Touch-Friendly** - Mobile gesture support

## 🎨 UI/UX Features

- **Modern Design** - Clean, professional interface
- **Indian Aesthetics** - Business-appropriate styling
- **Dark Mode** - Theme switching capability
- **Accessibility** - WCAG compliance
- **Loading States** - Smooth user experience

## 🔮 Future Enhancements

- **Razorpay Integration** - Payment processing
- **Email Automation** - Automated invoice sending
- **Advanced Analytics** - Machine learning insights
- **Mobile App** - React Native application
- **API Integration** - Third-party service connections
- **Multi-language** - Internationalization support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact: info@bytesflare.com
- Documentation: [Coming Soon]

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- MongoDB for the database solution
- Tailwind CSS for the styling system
- Recharts for the charting library
- All open-source contributors

---

**Built with ❤️ by Bytesflare Infotech**