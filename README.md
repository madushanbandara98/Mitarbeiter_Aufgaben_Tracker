# Mitarbeiter Aufgaben Tracker

A German-language web application for recording employee tasks, analyzing weekly workloads, and creating weekly PDF reports. Employees can manage their own work data, while administrators get a team-wide overview and can maintain user profiles and roles.

## Features

- Account registration and login with `scrypt` password hashing
- Role-based access for employees and administrators
- Employee dashboard with workload and waiting-time summaries
- Create, edit, filter, and delete detailed task records
- Weekly configuration for working hours, location, and shift
- Downloadable PDF report for the current calendar week
- Editable user profiles with optional profile images
- Admin dashboard with team metrics, employee details, and user management
- Persistent MongoDB storage
- Responsive German-language interface

## Tech stack

- [Next.js 16](https://nextjs.org/) with the App Router
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [MongoDB](https://www.mongodb.com/)

## Prerequisites

Before starting, install:

- Node.js 20.9 or newer
- npm
- A local MongoDB instance or a MongoDB Atlas database

## Getting started

1. Clone the repository and enter the project directory:

   ```bash
   git clone https://github.com/madushanbandara98/Mitarbeiter_Aufgaben_Tracker.git
   cd Mitarbeiter_Aufgaben_Tracker
   ```

2. Install the dependencies:

   ```bash
   npm ci
   ```

3. Create a `.env.local` file in the project root:

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017
   MONGODB_DB_NAME=tracker
   ```

   `MONGODB_DB_NAME` is optional and defaults to `tracker`. Do not commit `.env.local` or database credentials.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000). Register a new account to begin.

MongoDB collections are created automatically when data is first written. No manual schema migration is required.

## Administrator access

Newly registered accounts receive the `normal` user type. To create the first administrator, update that user's document in the MongoDB `users` collection:

```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { userType: "admin" } }
)
```

Log out and sign in again after changing the user type. Administrators can then update other users from the admin dashboard.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create an optimized production build |
| `npm run start` | Run the production build |
| `npm run lint` | Check the code with ESLint |

## Project structure

```text
src/
├── app/             # Pages and API route handlers
├── components/      # Authentication, dashboard, task, and profile UI
└── lib/             # Auth, MongoDB, validation, dates, and PDF utilities
```

The main application routes are:

- `/login` and `/register` — authentication
- `/dashboard` — employee or admin overview
- `/tasks` — task and weekly configuration management
- `/profile` — personal profile management
- `/api/health/db` — MongoDB connectivity check

## Production notes

Before deploying this project publicly:

- Configure `MONGODB_URI` and, if needed, `MONGODB_DB_NAME` in the hosting environment.
- Restrict MongoDB network access and use a database user with only the permissions the app needs.
- Serve the application over HTTPS.
- Review session-cookie settings and set `secure: true` for HTTPS production deployments.
- Add rate limiting and CSRF protection if the application will be exposed to untrusted users.
- Do not use real employee or company data in a public demo database.

## Contributing

Contributions are welcome. Create a branch, make your changes, run `npm run lint` and `npm run build`, then open a pull request with a clear description of the change.

## License

No license has been added yet. Until a license is provided, the source code remains under the copyright of its owner and is not automatically licensed for reuse.
