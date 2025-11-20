# Full-Stack Article Application

A simple full-stack application for managing articles with a React frontend and Node.js/Express backend.

## Features

- **Frontend**: React + TypeScript with Vite
- **Backend**: Node.js + Express.js
- **WYSIWYG Editor**: Quill editor for rich text editing
- **Article Management**: Create, view, edit, and delete articles
- **File Attachments**: Upload and attach images (JPG, PNG, GIF, WEBP) and PDFs to articles
- **Real-Time Notifications**: WebSocket support for instant notifications on article changes
- **File Storage**: Articles stored as JSON files in the `/data` directory

## Project Structure

```
fullstack-atricle-app/
├── backend/              # Node.js/Express server
│   ├── data/            # Article storage directory
│   ├── attachments/     # File attachments storage
│   ├── server.js        # Express server with WebSocket support
│   └── validateArticle.js
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

### 3. Start the Backend Server

From the `backend` directory:

```bash
npm run dev
```

The backend server will start on `http://localhost:5001`

### 4. Start the Frontend Development Server

From the `frontend` directory (in a new terminal):

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (or another port if 5173 is taken)

## API Endpoints

### `GET /api/articles`
Returns a list of all articles with preview and attachment count.

**Response:**
```json
[
  {
    "id": "article-id",
    "title": "Article Title",
    "preview": "Article preview text...",
    "attachmentCount": 2
  }
]
```

### `GET /api/articles/:id`
Returns a specific article by ID with attachments.

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
  ]
}
```

### `POST /api/articles`
Creates a new article with optional attachments.

**Request Body:**
```json
{
  "title": "Article Title",
  "content": { ... },
  "attachments": [...]
}
```

**Validation:**
- `title`: Required, non-empty string, max 200 characters
- `content`: Required, Quill Delta object
- `attachments`: Optional array of attachment objects

### `PUT /api/articles/:id`
Updates an existing article.

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": { ... },
  "attachments": [...]
}
```

### `DELETE /api/articles/:id`
Deletes an article and its attachments.

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

## Dependencies

### Backend
- `express`: Web framework
- `cors`: Cross-origin resource sharing
- `multer`: File upload handling
- `ws`: WebSocket server

### Frontend
- `react`: UI library
- `react-dom`: React DOM rendering
- `quill`: Rich text editor
- `typescript`: Type safety
- `vite`: Build tool and dev server

