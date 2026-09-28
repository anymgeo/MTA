# MTA CMS

Next.js + PrimeReact admin, ASP.NET Core 10 RESTful API and PostgreSQL 17. Linux deployment is prepared with Docker Compose and Nginx.

## შესვლა / Login

- **Admin:** http://localhost:3101
- **Email:** `d.gabelaia@mta.ski`
- **Role:** `WebPortalAdmin` — Super Admin
- **Initial password:** `.local/ADMIN-ACCESS.txt`. This private file is excluded from Git. A password changed in the UI supersedes this initial password.
- **Public site:** http://localhost:3100/ka/news

## რა მუშაობს

- **ნიუსები:** სია, ძებნა, დამატება, რედაქტირება, მონახაზი, გამოქვეყნება, გამოქვეყნებიდან მოხსნა და დადასტურებით წაშლა.
- **კონტენტი:** ქართული/ინგლისური სათაური, აღწერა, ტექსტი, მთავარი ფოტო, გალერეა და თარიღი. გამოქვეყნებისას ორივე ენა აუცილებელია. უბრალო ტექსტში აბზაცები გამოყავით ცარიელი ხაზით.
- **მომხმარებლები:** სია, ძებნა, დამატება, რედაქტირება, როლების მინიჭება, პაროლის შეცვლა და დადასტურებით წაშლა — უფლებების შესაბამისად.
- **კურორტები:** დამატება, რედაქტირება და წაშლა; ორივე ენის ძირითადი ინფორმაცია, სეზონური ფოტოები, სტატუსი, მახასიათებლები და ტრანსპორტი. არსებული გალერეები, აქტივობები, ტრასებისა და საბაგიროების დეტალური სიები შენარჩუნებულია; მათი ცალკე რედაქტორები ამ ვერსიაში არ შედის.
- **საიტი:** ახალი ჩანაწერის, რედაქტირების ან წაშლის შედეგი ჩანს შემდეგ მოთხოვნაზე, ახალი build-ის გარეშე. მონახაზები საჯარო API-ში და sitemap-ში არ ხვდება.

ბმულის დაბოლოება შეავსეთ ლათინურად, მაგალითად `new-winter-season`. შენახვის შემდეგ ის უცვლელია, რათა არსებული ბმულები არ გაფუჭდეს. ნიუსის თარიღი სტატიის თარიღია და არა დაგეგმილი ავტომატური გამოქვეყნების დრო.

ფოტოები: JPG/PNG/WebP, მაქსიმუმ 5 MB თითო ფაილზე. ნიუსის გალერეა: მაქსიმუმ 12 ფოტო. წაშლილი ნიუსის ფოტოები ავტომატურად არ იშლება, რათა სხვა ჩანაწერში გამოყენებული ფოტო არ დაიკარგოს.

## Roles and permissions

| Action | WebPortalAdmin | WebPortalModerator |
| --- | --- | --- |
| News: create, edit, publish, unpublish, delete | Yes | Yes |
| Resort: create, edit, delete | Yes | Yes |
| List users and edit names/email | Yes | Yes |
| Add users | Yes | No |
| Delete users | Yes | No |
| Assign roles | Yes | No |
| Reset another user's password | Yes | No |
| Change own password | Yes | Yes, with current password |

Role assignment and credential resets are restricted to prevent a Moderator from promoting themselves or taking over a Super Admin. Permissions are enforced on the API, independently of hidden UI buttons. Account edits revoke old sessions immediately; an editor changing their own account receives a refreshed session. The last Super Admin cannot be deleted or demoted, to prevent locking everyone out.

The original local setup account `admin@mta.local` is retained so existing access is not silently removed. It is also a Super Admin and can be removed using user management after verifying the requested account.

## Local startup on this Windows computer

Portable .NET SDK and PostgreSQL are in `.tools/`; private data, credentials and logs are in `.local/`. These are not part of the source repository. Node.js 24 is required. Run from the repository root in PowerShell 7:

```powershell
# First initialization, or applying new database migrations.
./scripts/initialize-local.ps1
# Start the database, API, public site and admin as hidden local processes.
./scripts/start-local.ps1
```

The launcher uses already built API binaries. When changing backend code, stop its process before rebuilding:

```powershell
. ./scripts/local-env.ps1
dotnet build mta.api/Mta.Api.csproj
```

Ports: PostgreSQL `55432`, API `5100`, site `3100`, admin `3101`. Local servers bind to loopback only. Logs are `.local/api.log`, `.local/admin.log`, `.local/site.log` and matching `.error.log` files. Only one `next dev` process per frontend project can run at a time.

On another development computer, install .NET 10 SDK, PostgreSQL 17 and Node.js 24; set `ConnectionStrings__Database`, `Bootstrap__Email`, `Bootstrap__Password`, `StoragePath` and the frontend `.env.local` values. Run `dotnet run --project mta.api -- --initialize`, then run the API and frontend scripts. The supplied PowerShell launcher specifically expects the portable `.tools/` layout prepared on this computer.

Database initialization is explicit. EF migrations are versioned in `mta.api/Migrations`. Initial news and resorts are imported once using markers in `Bootstrap`; rerunning initialization does not recreate deleted content or reset existing passwords. `.local/postgres-data` contains the real database: do not remove it to fix an application error. `.local` contains credentials and must not be shared or committed. For long-term hosting, use the Linux Docker volumes rather than a OneDrive-synchronized development directory.

## Tests

With local services running, from the repository root:

```powershell
node scripts/check-news.mjs
node scripts/check-roles.mjs
node scripts/check-resorts.mjs
```

These use dedicated temporary records and accounts and clean them up. They do not delete the user's own articles or resorts. Uploaded test images remain in the media directory.

Checks cover authentication, CSRF, private drafts, validation, duplicate slugs, uploads, concurrent edits, both locales, escaped text, public rendering, metadata, sitemap, updates, unpublishing, deletion, logout, both roles, privilege escalation prevention and immediate session revocation. Resort checks include its detail, map and activity pages. `TEST_SITE_ORIGIN` can point tests at a production preview.

```powershell
# In mta.admin:
npm run lint
npm run typecheck
npm run build
# In mtaprime:
npm run build
node --test tests/content.test.mjs
```

## API contract

- Public: `GET /api/news?locale=ka|en`, `GET /api/news/{slug}?locale=ka|en`, `GET /api/resorts?locale=ka|en`.
- Session: `GET /api/admin/session`, `POST /api/admin/login`, `POST /api/admin/logout`.
- News: `GET/POST /api/admin/news`, `PUT /api/admin/news/{id}`, `DELETE /api/admin/news/{id}?version={version}`.
- Users: `GET/POST /api/admin/users`, `PUT /api/admin/users/{id}`, `DELETE /api/admin/users/{id}?version={version}`.
- Resorts: `GET/POST /api/admin/resorts`, `PUT /api/admin/resorts/{id}`, `DELETE /api/admin/resorts/{id}?version={version}`.
- Photos: `POST /api/admin/media`, multipart field `file`.

Mutations require an authenticated role (except login) and `X-CSRF-TOKEN` from the session endpoint. PUT/DELETE require the current version to prevent lost updates. Expected error status codes include 400, 401, 403, 404, 409 and 429. Password hashes and security stamps are never included in user responses. News/resort changes are recorded in `Audit`; its historical `NewsId` column holds the target content UUID, with `Action` distinguishing the module.

`NEWS_DATA_SOURCE=api` and `RESORTS_DATA_SOURCE=api` independently switch the public site's implemented CMS modules to the API. Other public modules continue to use the existing fixtures. Operational map feeds, other portal records and statistics are not managed by this CMS release. Deleting a resort removes its own public routes; unrelated news and portal records are not cascade-deleted.

## Linux + Docker + Nginx deployment

Prepared files: `compose.yaml`, the three project Dockerfiles, `deploy/init-db.sh` and `deploy/nginx.conf.template`. **Docker is not installed on this computer; container deployment has not been executed or verified. Nothing has been published to a public server.**

1. Install Docker Engine and Compose on the Linux server. Point the site and admin subdomain DNS records to the server.
2. Copy `.env.example` to `.env`, supply real domains/email and three distinct strong passwords, and run `chmod 600 .env`. Use hex database passwords to avoid connection-string metacharacters; the admin password requires 12+ characters, uppercase/lowercase, a digit and a symbol.
3. Place a valid certificate covering both domains in `deploy/tls/fullchain.pem` and `deploy/tls/privkey.pem`. Certificate issuance and automated renewal must be configured on the server.
4. Run `docker compose config --quiet`, then `docker compose up --build -d`.
5. Check `docker compose logs api-init api nginx`, then verify login and content CRUD at the real HTTPS addresses.

Only Nginx publishes ports 80/443. PostgreSQL and application ports remain within the Docker network. API trusts the configured Nginx IP for forwarded headers; change subnet/IP and `TrustedProxy` together if needed. Application containers run as non-root users with dropped capabilities. The database application's account is not a PostgreSQL superuser. Initialization runs before the API service starts.

Persistent volumes hold the database and media/data-protection keys. `docker compose down -v` deletes these volumes and must not be used for a normal deployment update. Changing environment passwords does not rotate existing database/user passwords: update the corresponding account as well.

Security implemented: Identity password hashing, HttpOnly/SameSite cookies (Secure in production), CSRF, API role checks, immediate session revocation, login rate limits, five-failure account lockout, input checks and upload size/signature/type restrictions. MFA and an email password-recovery flow are not included yet. Before public launch, configure firewall/SSH access, certificate renewal, off-server database/media backups and a tested restore procedure. Nginx/Docker do not substitute for ongoing dependency and host updates.
