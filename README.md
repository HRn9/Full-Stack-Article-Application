# Full-Stack Article Application

A simple full-stack application for managing articles with a React frontend and Node.js/Express backend.

## Features

- **Frontend**: React + TypeScript with Vite
- **Backend**: Node.js + Express.js
- **WYSIWYG Editor**: Quill editor for rich text editing
- **Article Management**: Create, view, and list articles
- **File Storage**: Articles stored as JSON files in the `/data` directory

## Project Structure

```
fullstack-atricle-app/
├── backend/          # Node.js/Express server
│   ├── data/        # Article storage directory
│   └── server.js    # Express server
├── frontend/        # React application
│   └── src/         # Source code
└── README.md        # This file
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
Returns a list of all articles.

**Response:**
```json
[
  {
    "id": "article-id",
    "title": "Article Title",
    "content": { ... }
  }
]
```

### `GET /api/articles/:id`
Returns a specific article by ID.

**Response:**
```json
{
  "id": "article-id",
  "title": "Article Title",
  "content": { ... }
}
```

### `POST /api/articles`
Creates a new article.

**Request Body:**
```json
{
  "title": "Article Title",
  "content": { ... }
}
```

**Validation:**
- `title`: Required, non-empty string, max 200 characters
- `content`: Required, Quill Delta object

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
- The application uses Quill Delta format for rich text content
- The backend validates article data before saving
- Error handling is implemented on both frontend and backend

