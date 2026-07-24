# 🚀 Switch Code Platform

A full-stack tech education platform built with Next.js, TypeScript, and MongoDB. This bilingual (Arabic/English) platform showcases training tracks, team members, projects, and provides a modern interface for tech education.

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Node.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT
- **UI Libraries:** Framer Motion, React Icons
- **Deployment:** Vercel (Frontend), Render/Railway (Backend)

## 📁 Project Structure

```
switch-code-platform/
├── app/
│   ├── api/                # API Routes
│   │   ├── contact/        # Contact form endpoint
│   │   ├── team/          # Team members endpoint
│   │   ├── tracks/        # Training tracks endpoint
│   │   ├── projects/      # Projects endpoint
│   │   ├── partners/      # Partners endpoint
│   │   └── auth/          # Authentication endpoints
│   ├── page.tsx           # Home page
│   ├── tracks/page.tsx    # Training tracks page
│   ├── team/page.tsx      # Team page
│   ├── projects/page.tsx  # Projects showcase
│   ├── partners/page.tsx  # Partners page
│   ├── media/page.tsx     # Gallery
│   └── contact/page.tsx   # Contact form
├── components/
│   ├── Navbar.tsx         # Navigation bar
│   ├── Footer.tsx         # Footer component
│   ├── Hero.tsx           # Hero section
│   ├── About.tsx          # About section
│   ├── Features.tsx       # Features section
│   ├── CTA.tsx            # Call-to-action
│   └── ThemeProvider.tsx  # Theme context
├── models/                # MongoDB Models
│   ├── Team.ts           # Team member model
│   ├── Track.ts          # Training track model
│   ├── Project.ts        # Project model
│   ├── Partner.ts        # Partner model
│   └── Contact.ts        # Contact form model
├── lib/
│   ├── mongodb.ts        # MongoDB connection
│   └── auth.ts           # Authentication utilities
└── public/               # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd switch-code-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/switchcode
JWT_SECRET=your_super_secret_jwt_key_here
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Features

- ✨ **Modern UI/UX** - Beautiful, responsive design with glassmorphism effects
- 🌓 **Dark Mode** - Built-in dark/light theme switcher
- 🌍 **Bilingual Support** - Arabic and English language toggle
- 🎨 **Animations** - Smooth transitions with Framer Motion
- 📱 **Responsive** - Mobile-first responsive design
- 🔐 **Authentication** - JWT-based authentication system
- 📊 **Admin Panel** - Ready for backend integration
- 📄 **Certificate Generator** - PDF certificate generation (ready to implement)

## 🔌 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/tracks` | Fetch training tracks |
| POST | `/api/tracks` | Add new track (admin) |
| GET | `/api/team` | Fetch team members |
| POST | `/api/team` | Add team member (admin) |
| GET | `/api/projects` | Fetch projects |
| POST | `/api/projects` | Add project (admin) |
| GET | `/api/partners` | Fetch partners |
| POST | `/api/partners` | Add partner (admin) |
| POST | `/api/contact` | Submit contact form |
| GET | `/api/contact` | Get all contacts (admin) |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |

## 🗄️ Database Schemas

### Team
```typescript
{
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  socials: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    email?: string;
  };
  languages: string[];
  expertise: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Track
```typescript
{
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  curriculum: string[];
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Contact
```typescript
{
  name: string;
  email: string;
  message: string;
  subject?: string;
  phone?: string;
  responded: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Setup MongoDB Atlas

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get connection string
4. Add to `.env.local` as `MONGODB_URI`

## 🎨 Customization

### Colors
Edit `tailwind.config.ts`:
- Primary: `#0066FF`
- Accent: `#00FF88`
- Cyber: `#8B5CF6`

### Fonts
Change in `app/globals.css`:
- English: Poppins
- Arabic: Cairo

## 📝 License

MIT License

## 👥 Contributors

- Switch Code Team

## 📧 Contact

- Email: info@switchcode.tech
- Website: www.switchcode.tech

## 🎓 Educational Use

This project is perfect for:
- Full-stack development training
- Frontend development courses
- Backend API development
- MongoDB schema design
- Deployment and CI/CD training

---

Made with ❤️ by the Switch Code Team
