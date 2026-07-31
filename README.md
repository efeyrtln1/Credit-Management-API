# 💳 Credit Management API

An enterprise-grade Backend API built with **NestJS**, **TypeScript**, **PostgreSQL**, and **Redis** for credit limit management, credit applications, automated installment planning, and payment processing.

---

## 📐 System Architecture & Flowchart

Below is the core business logic flow for Credit Application & Score-based Evaluation:

```mermaid
flowchart TD
    A[User Request: Credit Application] --> B[Check Authentication]
    B -->|Not Authenticated| C[Return 401 Unauthorized]
    B -->|Authenticated| D[Fetch User Limit & Active Credits]

    D --> E[Check Active Credits Count]
    E -->|Limit Reached| F[Reject: Active Credit Limit Reached]
    E -->|Valid| G[Check Available Limit]

    G -->|Insufficient| H[Reject: Insufficient Available Limit]
    G -->|Sufficient| I[Calculate Interest & Schedule]

    I --> J[Deduct Amount from Available Limit]
    J --> K[Create Credit & Payment Plan Records]
    K --> L[Publish Event / Queue Notification]
    L --> M[Return Success Response]
```

---

## 🛠️ Tech Stack & Features

* **Framework:** NestJS (Node.js / TypeScript)
* **Database:** PostgreSQL (via TypeORM)
* **Caching & Queue:** Redis
* **Containerization:** Docker & Docker Compose
* **Security:** JWT Authentication & Bcrypt Password Hashing

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Make sure you have **Docker Desktop** and **Node.js (v18+)** installed.

### 2. Infrastructure Setup
Run PostgreSQL and Redis via Docker Compose:
```bash
docker compose up -d
```

### 3. Application Setup
Install dependencies and run the development server:
```bash
npm install
npm run start:dev
```

The API will be available at: `http://localhost:3000`

---

## 🔐 Auth & Credits Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Registers a new user & assigns a random score group (A-D) with base limit. |
| `POST` | `/auth/login` | Authenticates user & returns JWT Access Token. |
| `GET` | `/users/me` | Returns current user profile & credit limit summary. |
| `GET` | `/credits/calculator` | Public repayment & 7/30-day late fee calculator. |
| `POST` | `/credits/apply` | Applies for a credit, generates payment schedule. |
| `GET` | `/credits/me` | Lists all active & historical credits for the user. |
| `GET` | `/credits/:id` | Returns detailed credit information. |
| `GET` | `/credits/:id/payment-plans` | Lists installments with live computed `currentLate` fees. |

---

## 📚 Architecture & Design Diagrams

Detailed technical diagrams for the system workflows can be found in the `/docs` directory:

* 📊 **[Entity Relationship Diagram (ERD)](docs/erd.md)**
* 🔄 **[Registration & Limit Flow Diagram](docs/register-flow.md)**
* 💳 **[Credit Application Flow Diagram](docs/credit-application-flow.md)**
* 🧮 **[Calculator Engine Flow Diagram](docs/calculator-flow.md)**