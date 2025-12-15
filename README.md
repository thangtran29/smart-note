This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Prerequisites

1. Create a `.env` file in the root directory with your environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

### Running the Development Server

You can run the development server in several ways:

**Option 1: Using npm script (recommended)**
```bash
npm run dev
```

**Option 2: Using npm script with explicit .env loading**
```bash
npm run dev:env
```

**Option 3: Using shell scripts (loads .env automatically)**

For Linux/Mac/Git Bash:
```bash
chmod +x scripts/dev.sh
./scripts/dev.sh
```

For Windows PowerShell:
```powershell
.\scripts\dev.ps1
```

For Windows CMD:
```cmd
scripts\dev.bat
```

### Verify Environment Variables

To check if your .env variables are loaded correctly:

**Using npm script:**
```bash
npm run check-env
```

**Using PowerShell:**
```powershell
.\scripts\check-env.ps1
```

**Using Bash:**
```bash
chmod +x scripts/check-env.sh
./scripts/check-env.sh
```

The verification script will:
- Show all variables in your .env file
- Display which variables are loaded in the environment
- Hide sensitive values (keys, secrets, passwords) for security

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
