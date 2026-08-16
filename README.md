# Mitarbeiter Aufgaben Tracker

A full-stack employee task and workload management application built with Next.js, TypeScript, and MongoDB.

The application helps employees document recurring work, track the time spent on tasks, identify waiting periods, and generate weekly reports. Administrators receive a team-wide overview of workloads and can manage employee information from one central dashboard.

> The user interface is in German because the application was designed for a German-speaking workplace.

## Project overview

Many recurring workplace activities are difficult to evaluate when they are recorded in spreadsheets or described only informally. This project turns that information into structured, searchable data.

Employees can record what they do, how often they do it, how long it takes, which tools and dependencies are involved, and whether the work creates value. The application automatically calculates weekly effort and presents the results in dashboards and downloadable reports.

## Key features

### For employees

- Register and sign in securely
- Create, edit, filter, and delete task records
- Document frequency, duration, waiting time, output, tools, and dependencies
- Classify work as value-adding or non-value-adding
- Add improvement ideas and comments
- Configure weekly working hours, location, and shift
- View workload and waiting-time summaries by day
- Download a PDF report for the current calendar week
- Maintain a personal employee profile

### For administrators

- View team-wide workload metrics from one dashboard
- Compare employees, departments, task volume, and recorded hours
- Inspect individual employee profiles and task details
- Update user information and access roles
- Assign and manage tasks while preserving employee ownership

## What this project demonstrates

- Building a full-stack application with the Next.js App Router
- Designing authenticated and role-protected application flows
- Creating REST-style route handlers with server-side validation
- Persisting related user, task, session, and weekly configuration data in MongoDB
- Hashing passwords with Node.js `scrypt`
- Keeping employee data consistent when profile information changes
- Calculating workload statistics from detailed operational data
- Generating PDF reports without relying on an external reporting service
- Creating a responsive interface for both desktop and mobile use

## Technology stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 with App Router |
| Frontend | React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Database | MongoDB |
| Authentication | Cookie-based sessions and `scrypt` password hashing |
| Reporting | Server-generated PDF documents |
| Validation | Custom server-side validation |

## Application structure

```text
src/
├── app/             # Pages and API route handlers
├── components/      # Authentication, dashboard, task, and profile UI
└── lib/             # Auth, MongoDB, validation, date, and PDF utilities
```

Important application areas include:

- `/dashboard` — personal workload overview or administrator dashboard
- `/tasks` — task entry, editing, filtering, and weekly configuration
- `/profile` — employee profile management
- `/login` and `/register` — authentication flows
- `/api/*` — server-side authentication, task, profile, report, and admin endpoints

## Run the project locally

### Requirements

- Node.js 20.9 or newer
- npm
- A local MongoDB instance or MongoDB Atlas database

### Installation

```bash
git clone https://github.com/madushanbandara98/Mitarbeiter_Aufgaben_Tracker.git
cd Mitarbeiter_Aufgaben_Tracker
npm ci
```

Create a `.env.local` file in the project root:

```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=tracker
```

`MONGODB_DB_NAME` is optional and defaults to `tracker`. Environment files and database credentials must not be committed.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and register an account. MongoDB collections are created automatically when data is first stored.

## Create an administrator

New accounts are created as normal users. To create the first administrator, update the account in the MongoDB `users` collection:

```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { userType: "admin" } }
)
```

Log out and sign in again after changing the user type.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint checks |

## Current status

The core employee and administrator workflows are implemented. Potential future improvements include automated tests, audit logging, password recovery, session expiration, richer PDF formatting, and deployment of a public demonstration environment.

## Author

Developed by **Madushan Bandara** as a portfolio project demonstrating full-stack web development, database integration, authentication, reporting, and responsive interface design.

## License

No open-source license has been added. The source code remains under the copyright of its owner and is not automatically licensed for reuse.
