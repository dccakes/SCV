# TheNot: Your Next Wedding Planner

[TheNot](https://thenot.vercel.app/) is not TheKnot... but also is as it's a clone of [theknot.com](https://www.theknot.com/).
Using the power of the [T3 Stack](https://create.t3.gg/), I've taken up this full stack hobby project to attempt to recreate portions of this popular wedding planning platform.

It is scaffolded with `create-t3-app` ([repo](https://github.com/t3-oss/create-t3-app)) and hosted on [Vercel](https://vercel.com/) at https://wedding-approuter.vercel.app/. Everything from the design to the layout to the modeling of the data/schemas were done from scratch and by solely looking at and tinkering with the TheKnot website.

## So What Features were Recreated?

I really just focused on the baseline custom wedding website features and rsvp & guest list management functionalities. That being said, I haven't prioritized a landing page or dedicated login/account management yet, so this is where you'll start...<br>

<img width="300" alt="Screenshot 2024-05-01 at 2 21 01 AM" src="https://github.com/Kenford20/wedding-approuter/assets/41027303/f6c8c536-72d3-4cc9-80cd-c55411cbca9d">
<img width="252" alt="Screenshot 2024-05-01 at 2 32 25 AM" src="https://github.com/Kenford20/wedding-approuter/assets/41027303/aeb7ec1a-e1be-443f-8233-325fe39ca53c">

<br>You can create an account with email/password or social providers (when configured). The app uses [Better Auth](https://better-auth.com/) - an open-source, self-hosted authentication solution that stores user data directly in your PostgreSQL database.

<br><br>

### Website Management via Dashboard

Once you've logged in and entered the names of you and your future wed, a custom website associated with your account with a unique url will be generated for you and you'll be taken to the dashboard page.<br><br>

_Dashboard Demo_

https://github.com/Kenford20/wedding-approuter/assets/41027303/ec96b46f-edad-43b3-863e-37fb3c415db2

Here you can:

- Create and manage your upcoming events for guests to eventually RSVP to
- Edit your custom website url
- Add a password to prevent unwanted access to your website
- Upload a cover photo to display on your website (stored on **AWS S3 bucket**)
- Toggle the visibility of your RSVP form for guests visiting your website
- See charted views of the responses and answers you've received for each event along with their associated questions<br><br>

_Speaking of questions, you can also create your own questions to ask your guests to collect additional information from them:_

https://github.com/Kenford20/wedding-approuter/assets/41027303/a287d3e2-3ed0-4c16-8e7a-9d7b0f01d5e9

<br><br>

### Guest List Management

After creating your events that you plan to host, you can navigate to the guest list page where you can begin to add all the guests you plan to invite to your wedding.<br><br>

_Guest List Demo_

https://github.com/Kenford20/wedding-approuter/assets/41027303/4646bd01-4f29-48a9-95eb-b5a8533a345c

Here you can:

- Create, edit, and delete individual guests or household/party of guests
- View specific guests grouped by individual events that they were invited to
- Manage events in this page as well
- Update individual RSVPs for a singular guest for a specific event
- See a highly interactive tabular view of your guest list that supports...
  - sorting by naming
  - sorting by party size
  - filter by RSVP
  - search guest name

<br>

### Your Website

Finally, we move away from the dashboard and all that management into your website! It's still pretty barebones and a WIP, but planning to work features like theme and content customization soon!

_Sample Website_
<img width="1043" alt="Screenshot 2024-05-01 at 5 05 41 AM" src="https://github.com/Kenford20/wedding-approuter/assets/41027303/eab3803a-6a49-451a-85a1-630ff68725e3">

<br><br>

### Guest RSVP

Last but not least, you created all those events, questions, and parties of guests so that you could direct them to your website and collect RSVPs & information from them! Assuming you're all done setting things up and have enabled RSVPing, your guests can navigate to the RSVP page where they'll be presented with a multi-step form to fill out.

<br>

_RSVP Page Demo_

https://github.com/Kenford20/wedding-approuter/assets/41027303/86bc013c-e9cb-4866-88f3-5e4bab4e6f06

<br><br>

And... that's it! I know there's a lot more to what TheKnot offers than what was showcased here, but my goal here really was to learn NextJS & TypeScript and experience developing with a new and modern stack.

### _With that said, here's a more exhaustive list of the technologies that were involved in making this happen:_

- [Next.js](https://nextjs.org) v15
- [React](https://react.dev/) v19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io) v11
- [Better Auth](https://better-auth.com/) (open-source, self-hosted)
- [shadcn/radix-ui](https://ui.shadcn.com/)
- [Prisma ORM](https://prisma.io) v7
- [PostgreSQL](https://www.postgresql.org/) hosted on [Supabase](https://supabase.com/)
- [Zod](https://zod.dev/)
- [AWS S3](https://aws.amazon.com/s3/) via `@aws-sdk/client-s3` (optional)
- `react-dropzone` & `react-cropper` for image handling
- `react-chartjs-2` for analytics visualizations

---

## 🚀 Getting Started - Local Development

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18 or higher
- **npm** or **yarn**
- **PostgreSQL** database (local or hosted)
  - Recommended: [Supabase](https://supabase.com/) (free tier)
  - Alternative: Local PostgreSQL installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/Kenford20/wedding-approuter.git
cd wedding-approuter
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Then edit `.env` and configure the required variables.

Open `.env` and configure the following **required** variables:

```bash
# Database (REQUIRED)
DATABASE_URL="postgresql://user:password@host:port/database"
DIRECT_URL="postgresql://user:password@host:port/database"  # Optional, for connection pooling
```

#### Required: Better Auth Configuration

Better Auth is required for user authentication and session management:

```bash
# Better Auth (REQUIRED)
BETTER_AUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Optional, defaults to localhost:3000
```

**Generate a secure secret:**

```bash
openssl rand -base64 32
```

**Optional: Social OAuth Providers**

To enable Google or GitHub login, uncomment and configure:

```bash
# GitHub OAuth (OPTIONAL)
# GITHUB_CLIENT_ID="your-github-client-id"
# GITHUB_CLIENT_SECRET="your-github-client-secret"

# Google OAuth (OPTIONAL)
# GOOGLE_CLIENT_ID="your-google-client-id"
# GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

Learn more: [Better Auth Documentation](https://better-auth.com/)

#### Optional: AWS S3 Storage

If you want image upload functionality, uncomment and configure:

```bash
# AWS S3 (OPTIONAL - comment out to disable)
AWS_S3_BUCKET_NAME="your-bucket-name"
AWS_S3_REGION="us-east-1"
AWS_S3_ACCESS_KEY_ID="your-access-key"
AWS_S3_SECRET_ACCESS_KEY="your-secret-key"
```

### Step 4: Set Up Database

#### 4a. Push Prisma Schema

```bash
npx prisma db push
```

This will create all the necessary tables in your PostgreSQL database.

#### 4b. (Optional) Seed the Database

If you want sample data:

```bash
npx prisma db seed
```

#### 4c. Generate Prisma Client

```bash
npx prisma generate
```

### Step 5: Run Development Server

```bash
npm run dev
```

Your application will be available at **http://localhost:3000** 🎉

---

## 📚 Additional Commands

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Open Prisma Studio (Database GUI)

```bash
npx prisma studio
```

This opens a visual editor for your database at http://localhost:5555

### Database Migrations

```bash
npx prisma migrate dev --name your_migration_name
```

---

## 🔧 Configuration Guide

### Authentication

The app uses **Better Auth** for authentication, which provides:

- ✅ **Self-hosted** - Your user data stays in your PostgreSQL database
- ✅ **Open source** - No vendor lock-in, full code control
- ✅ **TypeScript-first** - Full type safety
- ✅ **Email/Password** - Built-in authentication
- ✅ **OAuth support** - Add Google, GitHub, etc. when needed

All user data is stored directly in your database via Prisma, making it easy to query and manage.

### Running Without Image Uploads (AWS S3)

The app will work without S3:

1. Leave the AWS environment variables commented out in `.env`
2. Image upload functionality will be disabled
3. Dashboard will show an appropriate message when attempting to upload

---

## 🐛 Troubleshooting

### Prisma Client Not Found

If you see: `Module '"@prisma/client"' has no exported member 'PrismaClient'`

**Solution:**

```bash
npx prisma generate
```

### Database Connection Issues

**Error:** `Can't reach database server`

**Solutions:**

1. Verify your `DATABASE_URL` is correct
2. Check if PostgreSQL is running (if local)
3. Verify firewall/network settings
4. For Supabase: Use the "Connection Pooling" URL

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### TypeScript Errors

If you encounter type errors during build:

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma Client
npx prisma generate

# Try building again
npm run build
```

---

## 📝 Database Schema Overview

The application uses the following main models:

- **User** - User account information
- **Website** - Custom wedding website settings
- **Event** - Wedding events (ceremony, reception, etc.)
- **Household** - Group of guests at the same address
- **Guest** - Individual guests
- **Invitation** - Links guests to events with RSVP status
- **Question** - Custom questions for RSVP forms
- **Answer** - Guest responses to questions
- **Gift** - Gift tracking per household

View the full schema in `prisma/schema.prisma`

---

## 🌐 Deployment

This project is optimized for deployment on [Vercel](https://vercel.com/):

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

Vercel will automatically:

- Run `npm install`
- Generate Prisma Client
- Build the Next.js application
- Deploy to production

---

## 📄 License

MIT © [Kenny Zhou](https://github.com/kenford20)
