# TheNot: Your Next Wedding Planner

[TheNot](https://thenot.vercel.app/) is not TheKnot... but also is as it's a clone of [theknot.com](https://www.theknot.com/).
Using the power of the [T3 Stack](https://create.t3.gg/), I've taken up this full stack hobby project to attempt to recreate portions of this popular wedding planning platform.

It is scaffolded with `create-t3-app` ([repo](https://github.com/t3-oss/create-t3-app)) and hosted on [Vercel](https://vercel.com/) at https://wedding-approuter.vercel.app/. Everything from the design to the layout to the modeling of the data/schemas were done from scratch and by solely looking at and tinkering with the TheKnot website.

## So What Features were Recreated?
I really just focused on the baseline custom wedding website features and rsvp & guest list management functionalities. That being said, I haven't prioritized a landing page or dedicated login/account management yet, so this is where you'll start...<br>

<img width="300" alt="Screenshot 2024-05-01 at 2 21 01 AM" src="https://github.com/Kenford20/wedding-approuter/assets/41027303/f6c8c536-72d3-4cc9-80cd-c55411cbca9d">
<img width="252" alt="Screenshot 2024-05-01 at 2 32 25 AM" src="https://github.com/Kenford20/wedding-approuter/assets/41027303/aeb7ec1a-e1be-443f-8233-325fe39ca53c">

<br>You can create an account with either Google or Github - I opted to use [Clerk](https://clerk.com/) to handle user management & authentication rather than [NextAuth.js](https://next-auth.js.org)


<br><br>
### Website Management via Dashboard
Once you've logged in and entered the names of you and your future wed, a custom website associated with your account with a unique url will be generated for you and you'll be taken to the dashboard page.<br><br>

*Dashboard Demo*

https://github.com/Kenford20/wedding-approuter/assets/41027303/ec96b46f-edad-43b3-863e-37fb3c415db2

Here you can:
- Create and manage your upcoming events for guests to eventually RSVP to
- Edit your custom website url
- Add a password to prevent unwanted access to your website
- Upload a cover photo to display on your website (stored on **AWS S3 bucket**)
- Toggle the visibility of your RSVP form for guests visiting your website
- See charted views of the responses and answers you've received for each event along with their associated questions<br><br>


*Speaking of questions, you can also create your own questions to ask your guests to collect additional information from them:*

https://github.com/Kenford20/wedding-approuter/assets/41027303/a287d3e2-3ed0-4c16-8e7a-9d7b0f01d5e9


<br><br>
### Guest List Management
After creating your events that you plan to host, you can navigate to the guest list page where you can begin to add all the guests you plan to invite to your wedding.<br><br>

*Guest List Demo*

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

*Sample Website*
<img width="1043" alt="Screenshot 2024-05-01 at 5 05 41 AM" src="https://github.com/Kenford20/wedding-approuter/assets/41027303/eab3803a-6a49-451a-85a1-630ff68725e3">

<br><br>

### Guest RSVP
Last but not least, you created all those events, questions, and parties of guests so that you could direct them to your website and collect RSVPs & information from them! Assuming you're all done setting things up and have enabled RSVPing, your guests can navigate to the RSVP page where they'll be presented with a multi-step form to fill out.

<br>

*RSVP Page Demo*

https://github.com/Kenford20/wedding-approuter/assets/41027303/86bc013c-e9cb-4866-88f3-5e4bab4e6f06

<br><br>

And... that's it! I know there's a lot more to what TheKnot offers than what was showcased here, but my goal here really was to learn NextJS & TypeScript and experience developing with a new and modern stack.

### *With that said, here's a more exhaustive list of the technologies that were involved in making this happen:*

- [Next.js](https://nextjs.org) v16
- [React](https://react.dev/) v19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io) v11
- [Clerk](https://clerk.com/) v6
- [shadcn/radix-ui](https://ui.shadcn.com/)
- [Prisma ORM](https://prisma.io) v7
- [PostgreSQL](https://www.postgresql.org/) hosted on [Supabase](https://supabase.com/)
- [Zod](https://zod.dev/)
- [AWS S3](https://aws.amazon.com/s3/) via `@aws-sdk/client-s3`
- `react-dropzone` & `react-cropper` for image handling
- `react-chartjs-2` for analytics visualizations


### *License:*
MIT © [Kenny Zhou](https://github.com/kenford20)
