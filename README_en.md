# Pyro Project – Discord Bot

A TypeScript-based **Discord Bot** (via [Discord.js v14](https://discord.js.org/)) with database integration using [Prisma](https://www.prisma.io/) and **PostgreSQL**.  
*(A separate dashboard might be developed in another repository.)*

---

## Table of Contents
1. [Features](#features)
2. [Requirements](#requirements)
3. [Getting Started](#getting-started)
4. [Scripts & Commands](#scripts--commands)
5. [Docker & Database](#docker--database)
6. [Using Prisma](#using-prisma)
7. [Environment Variables](#environment-variables)
8. [Typical Workflow](#typical-workflow)
9. [License & Author](#license--author)

---

## Features
- **Slash Commands**: Deploy commands to Discord (either globally or to a specific guild).
- **Voice Channel Management** (planned): Dynamic channel creation/deletion, usage time tracking, etc.
- **Database**: PostgreSQL-based data persistence (user data, voice logs, etc.).
- **Config via `.env`**: Manage Discord token, DB connection, and more.

---

## Requirements
- **Node.js** (version 18+ recommended)
- **npm** (or **pnpm**)
- **Docker** (if using a Docker-based PostgreSQL)
- **Discord Application** (with Bot Token; see [Discord Developer Portal](https://discord.com/developers/docs/intro))

---

## Getting Started

1. **Clone or Download**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/pyro-bot.git
   cd pyro-bot



2. **Install Dependencies:**:
   ```bash
   npm install
   (If you prefer pnpm: pnpm install.)

3. **Create .env (see Environment Variables below).**
4. **(Optional) Start Docker DB – See Docker & Database.**
5. **Initialize Prisma & Database (see Using Prisma).**
6. **Run Bot in Dev Mode**
   ```bash
   npm run dev
   (You should see a message like “Bot online!” once connected.)


## Scripts & Commands
1. [Script]	Description
2. [dev]	Starts the bot in dev mode (via nodemon + ts-node) with auto-restart on file changes.
3. [build]	Compiles TypeScript to dist/.
4. [start]	Runs the compiled bot from dist/index.js in production mode.
5. [bot:deploy]	Deploys slash commands to Discord. If GUILD_ID is set, commands are registered only in that guild (faster updates).
6. [prisma:migrate]	Runs a new migration (prisma migrate dev) to update the DB schema.
7. [prisma:generate]	Generates the Prisma client from your schema.prisma.
8. [prisma:db-push]	Syncs the schema directly with the DB (without migrations). Usually only for local dev use.
9. [prisma:studio]	Opens Prisma Studio in the browser for direct DB table inspection and edits.


## Docker & Database
(If you want to run PostgreSQL via Docker)

1.  **Install Docker.**
2.  **Have a docker-compose.yml referencing the postgres image.**
3.  **Start:**
    ```bash
    docker-compose up -d
4.  **Check everything is running:**
    ```bash
    docker ps
5. **Ensure your .env matches your DB credentials (Environment Variables).**


## Using Prisma

1.  **Apply Migrations**
    ```bash
    npm run prisma:migrate
    (Creates/updates your DB schema according to prisma/schema.prisma.)

2.  **Generate Prisma Client**   
    ```bash
    npm run prisma:generate
    (Updates the Prisma client. You can then import PrismaClient from @prisma/client.)

3.  **db-push (alternative to migrations)**
    ```bash
    npm run prisma:db-push
    (Directly syncs schema with the DB without generating migration files (for quick local use).)

4.  **Prisma Studio**
    ```bash
    npm run prisma:studio
    (Opens a browser UI to inspect and modify DB records.)



## Environment Variables

    Create a .env in project root. Example:

    # Discord
    DISCORD_TOKEN="YourDiscordBotToken"
    CLIENT_ID="abc123"
    GUILD_ID="def456"  # If set -> commands only deployed to this guild

    # PostgreSQL
    POSTGRES_USER="myUser"
    POSTGRES_PASSWORD="myPassword"
    POSTGRES_DB="pyro_db"
    POSTGRES_PORT=5432
    POSTGRES_HOST="localhost"

    DATABASE_URL="postgresql://myUser:myPassword@localhost:5432/pyro_db"


    DISCORD_TOKEN: Your Discord Bot token.
    CLIENT_ID: Your application's client ID.
    GUILD_ID: If specified, commands deploy to that guild.
    DATABASE_URL: Full connection URL to your DB.


## Typical Workflow

1.  **Start DB (if Docker-based)**
    ```bash
    docker-compose up -d

2.  **Migrate DB (when schema changes)**
    ```bash
    npm run prisma:migrate

3.  **Prisma Client**
    ```bash
    npm run prisma:generate

4.  **Run Bot (Dev)**
    ```bash
    npm run dev
    (Auto-restarts on changes.)

5.  **Deploy Slash Commands (when adding/updating commands)**
    ```bash
    npm run bot:deploy

6.  **Production**
    ```bash
    npm run build
    npm run start



## License & Author


**Author:** since120 / Pyro Bot Project
**License:** Proprietary – All Rights Reserved
This project/code is under a proprietary license.
Any use, reproduction, modification, distribution, or publication requires explicit written permission from the author.
If you have questions or issues, please open an issue on GitHub.

Happy coding with the Pyro Discord Bot!


