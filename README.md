# Full-Stack Article Application

A simple full-stack application for managing articles with a React frontend and Node.js/Express backend.

## Features

- **Frontend**: React + TypeScript with Vite
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **WYSIWYG Editor**: Quill editor for rich text editing
- **Article Management**: Create, view, edit, and delete articles (with version history)
- **Workspaces**: Group articles by workspace; switch or view across all
- **Comments**: Add/update/delete comments on articles
- **File Attachments**: Upload and attach images (JPG, PNG, GIF, WEBP) and PDFs to articles (files stored on disk, metadata in DB)
- **Real-Time Notifications**: WebSocket support for instant notifications on article changes
- **Data Persistence**: Database storage with file system support for attachments

## Project Structure

```
fullstack-atricle-app/
├── backend/              # Node.js/Express server
│   ├── src/
│   │   ├── config/           # App configuration
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/           # API route modules
│   │   ├── utils/            # FS helpers, preview, validation
│   │   ├── websocket/        # WebSocket manager
│   │   ├── app.js            # Express app setup
│   │   └── server.js         # Server entry point
│   └── attachments/          # Uploaded files (stored on disk)
├── frontend/            # React application
│   └── src/
│       ├── components/  # React components
│       ├── hooks/       # Custom hooks (WebSocket)
│       └── ...
└── README.md            # This file
```

## Prerequisites

- Node.js (v16 or higher)
- npm (comes with Node.js)
- PostgreSQL (v12 or higher)

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 3. Set Up PostgreSQL Database

#### Install PostgreSQL

If you don't have PostgreSQL installed:

- **macOS**: `brew install postgresql@15`
- **Ubuntu/Debian**: `sudo apt-get install postgresql postgresql-contrib`
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)

#### Configure Database

1. Create a `.env` file in the `backend` directory

2. Update the `.env` file with your PostgreSQL credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=article_app_db
DB_USER=postgres
DB_PASSWORD=postgres
```

#### Create Database and Run Migrations

```bash
# Create the database
npm run db:create

# Run migrations to create tables
npm run db:migrate
```

### 4. Start the Backend Server

From the `backend` directory:

```bash
npm run dev
```

The backend server will start on `http://localhost:5001`

### 5. Start the Frontend Development Server

From the `frontend` directory (in a new terminal):

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (or another port if 5173 is taken)

## API Endpoints

### `GET /api/articles?workspaceId=:workspaceId`
Returns a list of articles with preview, attachment/comment counts. If `workspaceId` is omitted or empty, returns articles from all workspaces.

**Response:**
```json
[
  {
    "id": "article-id",
    "title": "Article Title",
    "preview": "Article preview text...",
    "attachmentCount": 2,
    "commentCount": 3,
    "workspaceId": "workspace-id"
  }
]
```

### `GET /api/articles/:id`
Returns the latest version of an article with attachments, comments, versions list, and workspace info.

**Response:**
```json
{
  "id": "article-id",
  "title": "Article Title",
  "content": { ... },
  "attachments": [
    {
      "filename": "unique-filename.jpg",
      "originalName": "photo.jpg",
      "mimetype": "image/jpeg",
      "size": 12345,
      "url": "/attachments/unique-filename.jpg"
    }
  ],
  "comments": [
    {
      "id": "comment-id",
      "author": "Anonymous",
      "body": "Great post!",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "workspace": {
    "id": "workspace-id",
    "name": "Workspace name"
  }
}
```

### `POST /api/articles`
Creates a new article in a workspace with optional attachments.

**Request Body:**
```json
{
  "title": "Article Title",
  "content": { ... },
  "workspaceId": "workspace-id",
  "attachments": [...]
}
```

**Validation:**
- `title`: Required, non-empty string, max 200 characters
- `content`: Required, Quill Delta object
- `attachments`: Optional array of attachment objects
- `workspaceId`: Required; must reference an existing workspace

### `PUT /api/articles/:id`
Updates an existing article. Creates a new version; previous versions stay read-only.

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": { ... },
  "workspaceId": "workspace-id", // optional change workspace
  "attachments": [...]
}
```

### `DELETE /api/articles/:id`
Deletes an article and its attachments.

### `GET /api/articles/:id/versions/:version`
Returns a specific version (read-only) of an article with its attachments.

### `GET /api/articles/:id/comments`
List comments for an article (newest first).

### `POST /api/articles/:id/comments`
Add a comment to an article.

**Request Body:**
```json
{ "body": "Nice article!", "author": "Alice" }
```

### `PUT /api/articles/:id/comments/:commentId`
Update a comment’s text/author.

### `DELETE /api/articles/:id/comments/:commentId`
Delete a comment.

### `GET /api/workspaces`
List all workspaces with article counts.

### `POST /api/workspaces`
Create workspace.

**Request Body:**
```json
{ "name": "Workspace name", "description": "Optional" }
```
- Returns `409 Conflict` if the name already exists.

### `PUT /api/workspaces/:id`
Rename/update description (409 on duplicate name).

### `DELETE /api/workspaces/:id`
Delete workspace and all its articles/attachments/comments.

### `POST /api/upload`
Uploads a file attachment.

**Request:**
- Multipart form data with `file` field
- Accepted types: JPG, PNG, GIF, WEBP, PDF
- Max size: 10MB

**Response:**
```json
{
  "filename": "unique-filename.jpg",
  "originalName": "photo.jpg",
  "mimetype": "image/jpeg",
  "size": 12345,
  "url": "/attachments/unique-filename.jpg"
}
```

### `DELETE /api/attachments/:filename`
Deletes a specific attachment file.

### WebSocket Connection
Connect to `ws://localhost:5001` to receive real-time notifications.

**Notification Format:**
```json
{
  "type": "article_created|article_updated|article_deleted|file_uploaded",
  "articleId": "article-id",
  "title": "Article Title",
  "workspaceId": "workspace-id",
  "workspaceName": "Workspace name",
  "message": "Human-readable message",
  "timestamp": "ISO-8601 timestamp"
}
```

## Development

### Backend Scripts
- `npm run dev` - Start the server

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Notes

- Articles are stored as individual JSON files in the `backend/data/` directory
- File attachments are stored in the `backend/attachments/` directory
- The application uses Quill Delta format for rich text content
- The backend validates article data and file types before saving
- WebSocket connection automatically reconnects on disconnect with exponential backoff
- Unused attachments are automatically deleted when articles are updated or deleted
- File upload validation enforces type restrictions and size limits
- Error handling is implemented on both frontend and backend
- Real-time notifications work across multiple browser tabs/windows

## Database Management

### Available Commands

```bash
# Create the database
npm run db:create

# Run all migrations
npm run db:migrate

# Undo last migration
npm run db:migrate:undo

# Reset database (drop, create, migrate)
npm run db:reset
```

### Database Schema

The application uses two main tables:

- **articles**: Stores article data (id, title, content, timestamps)
- **attachments**: Stores file attachment metadata with foreign key to articles

## Dependencies

### Backend
- `express`: Web framework
- `cors`: Cross-origin resource sharing
- `multer`: File upload handling
- `ws`: WebSocket server
- `sequelize`: ORM for PostgreSQL
- `pg`: PostgreSQL driver
- `dotenv`: Environment variable management

### Frontend
- `react`: UI library
- `react-dom`: React DOM rendering
- `quill`: Rich text editor
- `typescript`: Type safety
- `vite`: Build tool and dev server

