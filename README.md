# TaskWise

## What the app is

TaskWise is a calm to-do and reminder web app.

- **Google sign-in only.** The Google ID token is verified on the server, and the session lives in an `httpOnly`, `secure` cookie holding a signed JWT. Page scripts can never read it.
- **Roles.** Everyone is a `user`; emails in `ADMIN_EMAILS` are always `admin`. Any admin can promote another person by email from **Settings → Admins**, even before that person has signed in.
- **Private calendars.** One is created automatically at sign-up. You can create, rename, recolor and delete more. Only the owner can see or change them.
- **One public calendar.** Every signed-in user can see it; only admins can add, edit or delete its tasks. **Copy public calendar** duplicates all of its tasks into a new private calendar you own.
- **Tasks** have a title, notes, date, time, priority, category, tags, repeat rule (none / daily / weekly / monthly, with an optional end date), completion status (tracked per occurrence for repeating tasks) and a checklist of steps.
- **Views:** Today dashboard, plus Month, Week, Day and List calendar views with animated transitions. Calendars can be shown or hidden with toggles.
- **Reminders:** chosen on first sign-in (browser notifications, in-app alerts, or both; 5 min to 1 day ahead) and changeable in Settings. Each reminder fires at most once. With Web Push keys configured, reminders also arrive when the tab is closed (see *Reminders and push notifications* below).
- **No page scrolling.** Every screen fits the viewport. Long content pages, swipes, or opens a panel ("+N more"), and every change of tab, period, view or page animates. `prefers-reduced-motion` switches all of it to simple fades.
- Light and dark themes, readable error messages that say how to fix the problem, and friendly empty states.

Tech: React (Vite) · Node.js + Express · MongoDB Atlas (Mongoose) · Google Identity Services · Render.

## Folder structure

```
taskwise/
├── package.json            # root scripts: build, start, dev:server, dev:client, seed, vapid
├── render.yaml             # Render Blueprint (one web service, auto-deploy on push to main)
├── .env.example            # every environment variable, with comments
├── client/                 # React app (Vite)
│   ├── index.html          # includes the pure-CSS boot loader
│   ├── public/
│   │   ├── sw.js           # service worker: shows Web Push reminders, focuses the app on click
│   │   └── theme-boot.js   # applies the saved theme before first paint
│   └── src/
│       ├── App.jsx         # providers, app shell and tab routing
│       ├── main.jsx        # entry point and global CSS imports
│       ├── components/
│       │   ├── motion/     # MorphLoader, NeonBorder, SlideSwitcher (+ their own CSS files)
│       │   ├── ui/         # Button, Modal, Segmented, Toggle, Ring, Pager, Field, Icon, ...
│       │   ├── layout/     # TopBar, BottomNav, Notifications (toasts + reminder alerts)
│       │   ├── calendar/   # CalendarView, Month/Week/Day views, TaskChip, CalendarFilter
│       │   ├── tasks/      # TaskRow, paged TaskList, reminder pickers
│       │   ├── modals/     # TaskEditor, DayPanel, CalendarEditor, Onboarding, ...
│       │   └── auth/       # GoogleButton
│       ├── context/        # AppContext (session, settings, calendars), TaskContext, UIContext
│       ├── hooks/          # paging, swipe, reminders, media queries, hash routing, ...
│       ├── lib/            # api client, dates, recurrence, push helpers, constants
│       ├── screens/        # Today, Calendar, Public, Settings (+ settings/ sections), SignIn
│       └── styles/         # tokens (light/dark themes), base, components, app frame
└── server/                 # Express API
    ├── src/
    │   ├── index.js        # starts the server
    │   ├── app.js          # middleware, routes, serves client/dist
    │   ├── config/         # env loading/validation, MongoDB connection
    │   ├── models/         # User, Calendar, Task, RoleGrant, PushSubscription, ReminderLog
    │   ├── middleware/     # auth (JWT cookie, roles, CSRF header), validation, errors
    │   ├── routes/         # auth, me, calendars, tasks, admin, reminders
    │   ├── services/       # access rules, Google verification, reminders, Web Push
    │   ├── utils/          # recurrence expansion, time zones, error helpers
    │   └── scripts/        # seed.js, generateVapidKeys.js
    └── test/api.test.js    # end-to-end API tests (needs a MongoDB)
```

## Getting the MongoDB Atlas connection string

1. Sign in at <https://cloud.mongodb.com> and create a **free (M0) cluster**.
2. **Database Access → Add New Database User.** Choose *Password* authentication, pick a username and a strong password, role *Read and write to any database*. Save the password somewhere safe.
3. **Network Access → Add IP Address.** Add your own IP for local development. For Render, add `0.0.0.0/0` (Render's outbound addresses can change; access is still protected by the database username and password).
4. **Database → Connect → Drivers.** Copy the connection string. It looks like:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
5. Replace `<username>` and `<password>`, and add the database name `taskwise` right before the `?`:
   `mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/taskwise?retryWrites=true&w=majority`
   If the password contains special characters (`@ : / ? # %`), URL-encode them (for example `@` becomes `%40`).
6. This full string is your `MONGO_URI`.

## Creating the Google OAuth client ID

TaskWise uses the "Sign in with Google" button (Google Identity Services, popup mode), so only **Authorized JavaScript origins** matter.

1. Open <https://console.cloud.google.com>, create (or select) a project.
2. Open **Google Auth Platform** (older consoles call it *APIs & Services → OAuth consent screen*).
   - **Branding:** app name `TaskWise`, your support email, developer contact email.
   - **Audience:** *External*. While the app is in *Testing*, only the test users you add can sign in. Click **Publish app** when you want anyone with a Google account to sign in (TaskWise only asks for basic profile and email, which do not need verification).
3. **Clients → Create client** (or *Credentials → Create credentials → OAuth client ID*), type **Web application**.
4. **Authorized JavaScript origins** (exact scheme, host and port, no trailing slash):
   - `http://localhost`
   - `http://localhost:5173` (Vite dev server)
   - `http://localhost:4000` (Express serving the built app)
   - `https://YOUR-SERVICE.onrender.com` (add after your first Render deploy shows the URL)
   - your custom domain too, if you add one later
5. **Authorized redirect URIs:** leave empty. The popup flow does not redirect.
6. Click **Create** and copy the **Client ID** (ends with `.apps.googleusercontent.com`). This is `GOOGLE_CLIENT_ID`. The client secret is not used.

Changes to origins can take a few minutes to apply. If the button shows an "origin not allowed" error, double-check the origin list.

## Running locally

Requirements: Node.js 20.19+ (22 recommended) and npm.

```bash
# 1. Install dependencies for server and client
npm run install:all

# 2. Create your environment file and fill it in
cp .env.example .env
#    MONGO_URI, JWT_SECRET, GOOGLE_CLIENT_ID, ADMIN_EMAILS (your Google email)

# 3. (Optional) Add sample tasks to the public calendar
npm run seed

# 4. Start the API (port 4000) and the client (port 5173) in two terminals
npm run dev:server
npm run dev:client
```

Open <http://localhost:5173>. The Vite dev server forwards `/api` to Express, so cookies work exactly like in production.

To try the production build locally: `npm run build` then `npm start`, and open <http://localhost:4000>.

Optional, for reminders while the tab is closed: run `npm run vapid`, paste the three printed lines into `.env`, and restart the server.

API tests (they wipe the database you point them at, so use a separate one):

```bash
cd server
TEST_MONGO_URI="mongodb+srv://.../taskwise_test?retryWrites=true&w=majority" npm test
```

## First-time git setup

Create an **empty** repository on GitHub (no README, no .gitignore), then in the project folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/taskwise.git
git push -u origin main
```

`.gitignore` already keeps `node_modules`, `dist`, `.env` and logs out of the repository. Check with `git status` that `.env` is not listed before you commit.

## Deploying to Render step by step

1. Push the project to GitHub (previous section).
2. Sign in at <https://dashboard.render.com> and connect your GitHub account.
3. Click **New → Blueprint** and choose your `taskwise` repository. Render reads `render.yaml` and proposes one web service named `taskwise`.
4. Render asks for the variables marked `sync: false`:
   - `MONGO_URI`: your Atlas connection string
   - `GOOGLE_CLIENT_ID`: your Google client ID
   - `ADMIN_EMAILS`: your Google email (comma-separate several)
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`: optional, from `npm run vapid`; leave empty to skip background push
   
   Render creates `JWT_SECRET` for you, and `NODE_ENV` is set to `production`.
5. Click **Apply** (or **Deploy Blueprint**). The build runs `npm run build` (installs both apps and builds the client), then `npm start`.
6. When the deploy is live, copy the URL (for example `https://taskwise-abcd.onrender.com`).
7. In Google Cloud, add that URL to **Authorized JavaScript origins** (see above). Wait a few minutes.
8. Open the URL and sign in with the email you put in `ADMIN_EMAILS`. You are an admin.
9. Optional: add sample public tasks by running `npm run seed` on your computer with `MONGO_URI` in your `.env` pointing at the same Atlas database.

From now on every push to `main` redeploys automatically (`autoDeployTrigger: commit`). `/api/health` is the health check.

Note: on Render's free plan the service sleeps after about 15 minutes without traffic, and the first request afterwards takes up to a minute while it wakes up. The app shows its loader and, if needed, an error that says to wait and retry.

## How to add a new feature and ship it

```bash
# 1. Start from the latest main
git checkout main
git pull

# 2. Create a branch for the feature
git checkout -b feature/task-search

# 3. Build it and run it locally (npm run dev:server + npm run dev:client)

# 4. Commit in small steps
git add .
git commit -m "Add search to the list view"

# 5. Push the branch and open a pull request on GitHub
git push -u origin feature/task-search

# 6. Merge the pull request into main on GitHub.
#    Render notices the new commit on main and deploys it automatically.
```

Where things usually go:

- New API endpoint: a route file in `server/src/routes/`, mounted in `server/src/app.js`; access checks in `server/src/services/access.js`.
- New task field: `server/src/models/Task.js` (schema + `toClient`), the zod schema in `server/src/routes/tasks.js`, and the form in `client/src/components/modals/TaskEditor.jsx`.
- New screen/tab: a component in `client/src/screens/`, an entry in `TABS` in `client/src/lib/constants.js`, and a case in `App.jsx`.
- Motion: tweak timings and colors in `client/src/components/motion/*.css` (`--sw-duration`, `--morph-*`, `--neon-*`).
- Colors and themes: `client/src/styles/tokens.css`.

---

## Reminders and push notifications

- **In-app alerts** and **browser notifications while TaskWise is open** work with no extra setup.
- **Reminders while the tab is closed** use Web Push and a service worker. They are enabled when `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` are set. The server checks every 30 seconds for due reminders and pushes them to every browser the user enabled notifications in.
- **Never twice:** every delivery is recorded in MongoDB with a unique key (user, task, occurrence, channel) before it is shown, so several tabs, devices or server instances cannot show the same reminder twice.
- Tasks without a time remind relative to 9:00 AM local time on their day. Reminders for hidden calendars are skipped.
- **Free-plan caveat:** a sleeping Render free instance cannot send pushes. On the free plan, closed-tab reminders are only reliable while the service is awake; use a paid instance for dependable background reminders. Reminders always fire while the site is open.
- Browser notification permission is only requested when someone chooses an option that needs it. If it was blocked, Settings explains how to allow it again.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGO_URI` | yes | MongoDB Atlas connection string |
| `JWT_SECRET` | yes | Signs the session cookie (32+ characters in production) |
| `GOOGLE_CLIENT_ID` | yes | Google OAuth Web client ID |
| `ADMIN_EMAILS` | recommended | Comma-separated emails that are always admins |
| `NODE_ENV` | yes on Render | `production` enables secure cookies |
| `PORT` | no | Defaults to 4000; Render sets it |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | no | Enable Web Push (reminders with the tab closed) |
| `VAPID_SUBJECT` | no | `mailto:` contact for push services |

## Security notes

- Every API route except sign-in, config and health requires a valid session; calendar access rules live in one place (`server/src/services/access.js`). Another user's private calendar answers 404, so its existence is not revealed.
- State-changing requests must carry an `X-TaskWise` header, which browsers will not attach to cross-site form posts (CSRF protection on top of `SameSite=Lax` cookies).
- Helmet sets a strict Content Security Policy that allows only this site and Google's sign-in script. Fonts are self-hosted.
- Input is validated with zod; sign-in and API calls are rate limited.
