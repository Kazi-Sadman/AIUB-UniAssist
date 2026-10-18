# AIUB UniAssist

**A Hybrid RAG-Powered University Information and Course Management System**

AIUB UniAssist is a full-stack university information and course management platform designed for American International University-Bangladesh (AIUB). It combines a traditional University Course Enrollment System with an AI-powered Hybrid Retrieval-Augmented Generation (RAG) assistant.

---

## Overview

The system provides:

- Department management
- Student management
- Course management
- Course enrollment
- REST APIs
- Hybrid RAG-based AI question answering
- AIUB TXT knowledge-base search

The planned next version will introduce user registration, JWT authentication, Student/Teacher/Admin roles, role-based authorization, a student dashboard, and AI integration with live university data.

---

## System Architecture

```
                         AIUB UniAssist
                               |
              +----------------+----------------+
              |                                 |
              v                                 v
     University Course System             UniAssist AI
              |                                 |
              v                                 v
            SQLite                    Hybrid RAG Pipeline
                                            |
                              +-------------+-------------+
                              |                           |
                              v                           v
                       BGE-M3 + Qdrant                  BM25
                              |                           |
                              +-------------+-------------+
                                            |
                                            v
                                           RRF
                                            |
                                            v
                                  Relevant Context
                                            |
                                            v
                                         LangChain
                                            |
                                            v
                                      OpenRouter LLM
                                            |
                                            v
                                        AI Answer
```

**Design principle:** RAG handles university knowledge and policies, while the database handles live student, course, and enrollment information.

---

## UniAssist AI

UniAssist retrieves relevant information from the local AIUB knowledge base before generating an answer.

**Example questions:**

- What are the admission requirements?
- What is the tuition fee?
- What is the attendance policy?
- What scholarships are available?
- How do I register for a semester?
- What are the graduation requirements?
- What are the academic grading rules?

---

## Hybrid RAG

The project combines two retrieval methods:

**Dense Retrieval**
BGE-M3 + Qdrant identifies information based on semantic meaning.

**Sparse Retrieval**
BM25 is useful for exact terms such as course codes, percentages, fees, and policy names.

**Reciprocal Rank Fusion**
RRF combines the rankings from dense and sparse retrieval to produce a unified result set.

```
User Question
     |
     v
POST /api/chat
     |
     v
Hybrid Retriever
     |
     +-------------------+
     |                   |
     v                   v
BGE-M3 / Qdrant       BM25
Dense Search       Keyword Search
     |                   |
     +---------+---------+
               |
               v
              RRF
               |
               v
       Relevant Chunks
               |
               v
        Optional Reranker
               |
               v
       LangChain Prompt
               |
               v
        OpenRouter LLM
               |
               v
        Answer + Sources
```

---

## Technology Stack

| Technology  | Purpose                        |
| ----------- | ------------------------------ |
| React       | Frontend                       |
| Vite        | Frontend development/build     |
| FastAPI     | Backend REST API               |
| Python      | Backend and RAG implementation |
| SQLAlchemy  | Database ORM                   |
| SQLite      | Relational database            |
| Pydantic    | API validation                 |
| LangChain   | RAG/LLM orchestration          |
| BAAI/bge-m3 | Multilingual embeddings        |
| Qdrant      | Vector database                |
| BM25        | Keyword retrieval              |
| RRF         | Retrieval fusion               |
| OpenRouter  | LLM API gateway                |

---

## Project Structure

```
AIUB-UniAssist/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routes/
│   │   ├── services/
│   │   └── rag/
│   │       ├── config.py
│   │       ├── loader.py
│   │       ├── chunker.py
│   │       ├── embeddings.py
│   │       ├── vector_store.py
│   │       ├── sparse.py
│   │       ├── retriever.py
│   │       ├── reranker.py
│   │       ├── prompt.py
│   │       ├── llm.py
│   │       └── ingest.py
│   │
│   ├── data/
│   │   ├── documents/
│   │   └── bm25/
│   ├── scripts/
│   │   └── rebuild_index.py
│   ├── .env
│   ├── .env.example
│   ├── requirements.txt
│   └── university.db
│
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── App.jsx
│       └── main.jsx
│
├── .gitignore
└── README.md
```

---

## Knowledge Base

The AI assistant uses local TXT documents stored in:

```
backend/data/documents/
```

The knowledge base covers areas such as:

- Admission requirements
- Academic standing and grading
- Attendance
- Examination policy
- Programs and courses
- Tuition fees
- Scholarships
- Financial aid
- Graduation requirements
- Faculty
- Office contacts
- Semester registration
- Frequently asked questions

The loader automatically discovers `*.txt` files, so new documents can be added without changing the loader code.

---

## REST API

### Departments

| Method | Endpoint            | Description         |
| ------ | ------------------- | ------------------- |
| POST   | `/departments`      | Create department   |
| GET    | `/departments`      | Get all departments |
| GET    | `/departments/{id}` | Get department      |
| DELETE | `/departments/{id}` | Delete department   |

### Students

| Method | Endpoint         | Description      |
| ------ | ---------------- | ---------------- |
| POST   | `/students`      | Create student   |
| GET    | `/students`      | Get all students |
| GET    | `/students/{id}` | Get student      |
| PUT    | `/students/{id}` | Update student   |
| DELETE | `/students/{id}` | Delete student   |

### Courses

| Method | Endpoint        | Description     |
| ------ | --------------- | --------------- |
| POST   | `/courses`      | Create course   |
| GET    | `/courses`      | Get all courses |
| GET    | `/courses/{id}` | Get course      |
| PUT    | `/courses/{id}` | Update course   |
| DELETE | `/courses/{id}` | Delete course   |

### Enrollments

| Method | Endpoint                 | Description           |
| ------ | ------------------------ | --------------------- |
| POST   | `/enrollments`           | Create enrollment     |
| GET    | `/enrollments`           | Get enrollments       |
| GET    | `/students/{id}/courses` | Get student's courses |
| GET    | `/courses/{id}/students` | Get course students   |
| DELETE | `/enrollments/{id}`      | Delete enrollment     |

### UniAssist

**`POST /api/chat`**

Example request:

```json
{
  "message": "What are the admission requirements?"
}
```

The response contains the generated answer and relevant source information.

---

## Database Design

Students and courses have a many-to-many relationship through the enrollments table.

```
Student  1 ─────── * Enrollment * ─────── 1 Course
```

Departments are related to students and courses.

```
Department
   ├── Students
   └── Courses
```

---

## RAG Configuration

Example `.env`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=your_model
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=university_documents

EMBEDDING_MODEL=BAAI/bge-m3
MODEL_CACHE_DIR=D:/AI_Models

CHUNK_SIZE=500
CHUNK_OVERLAP=50

DENSE_TOP_K=10
BM25_TOP_K=10
RRF_K=60
FINAL_TOP_K=5

ENABLE_RERANKER=false
```

> Never commit `.env` or expose the OpenRouter API key in the frontend.

---

## Installation

### Requirements

- Python 3.10+
- Node.js and npm
- Git
- Qdrant

### Backend

```bash
cd backend
python -m venv venv
.env\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Configure `.env` with the required values.

### Qdrant

Qdrant should be running at:

```
http://localhost:6333
```

### Build the RAG Index

After adding or updating TXT documents:

```bash
cd backend
python scripts/rebuild_index.py
```

The index should be rebuilt when the knowledge base changes, not for every question.

### Start Backend

```bash
cd backend
python -m uvicorn app.main:app --reload
or
uvicorn app.main:app --reload
```

Backend: `http://127.0.0.1:8000`
Swagger: `http://127.0.0.1:8000/docs`

### Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL provided by Vite.

---

## AI Grounding

UniAssist should use the supplied university context and avoid inventing university policies, fees, requirements, or academic rules.

If the knowledge base does not contain enough information, the assistant should clearly state that the information is not available in the current knowledge base.

For live student, course, and enrollment information, the database should be treated as the source of truth rather than the LLM.

---

## Context and Memory

RAG provides retrieved context to the LLM for the current question.

Conversation memory is a separate feature and is planned for a future version. Memory should complement, not replace, the RAG knowledge base.

---

## Development Roadmap

### Version 1 — Current Foundation

- FastAPI backend
- React frontend
- SQLite and SQLAlchemy
- Department, student, course, and enrollment APIs
- TXT knowledge base
- BGE-M3
- Qdrant
- BM25
- Hybrid retrieval
- RRF
- LangChain
- OpenRouter

### Version 2 — User & Enrollment System

- Registration and login
- JWT authentication
- Student, Teacher, and Admin roles
- Role-based authorization
- Student dashboard
- Course enrollment UI
- Duplicate enrollment prevention
- Teacher and Admin interfaces

### Version 3 — AI + Database Integration

- AI question routing
- Database tools for UniAssist
- Personalized student questions
- My Courses / My Enrollments
- Course student queries
- Combined RAG + database questions

### Version 4 — Advanced AI

- Conversation context
- Optional memory
- Query rewriting
- Optional reranker
- RAG evaluation
- Retrieval and answer quality measurement

---

## Security

- Never commit API keys or `.env`
- Keep LLM credentials on the backend
- Validate API requests
- Use JWT for authenticated users
- Apply role-based authorization
- Prevent duplicate enrollments
- Derive student identity from authentication
- Restrict administrative operations
- Do not allow the LLM to fabricate database information

---

## Adding New Knowledge

Add a new TXT file to:

```
backend/data/documents/
```

For example:

```
AIUB_LIBRARY_POLICY.txt
AIUB_TRANSPORT_POLICY.txt
AIUB_CLUB_POLICY.txt
```

Then rebuild the index:

```bash
python scripts/rebuild_index.py
```

---

## Project Objectives

The project demonstrates:

- Full-stack web development
- REST API development
- Relational database design
- Course enrollment management
- Natural Language Processing
- Multilingual embeddings
- Semantic and keyword search
- Vector databases
- Hybrid retrieval
- Reciprocal Rank Fusion
- Retrieval-Augmented Generation
- LangChain
- Large Language Models
- AI grounding
- AI and database integration

---

## Project Status

**Status:** In Development

**Current focus:**

```
University Course Management
          +
     Hybrid RAG UniAssist
```

**Future development:**

```
Authentication
      +
Role-Based Access
      +
Enrollment Workflow
      +
AI + Database Integration
```

---

## Project Title

**AIUB UniAssist: A Hybrid RAG-Powered University Information and Course Management System**

---

## License

This project is developed for educational and academic purposes.
