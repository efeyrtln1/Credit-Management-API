# Sequence Diagram: Registration & Credit Limit Assignment

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as NestJS API
    participant DB as PostgreSQL
    participant Cache as Redis

    Client->>API: POST /auth/register (email, password, name, phone)
    API->>DB: Check if email already exists
    alt Email Exists
        DB-->>API: User found
        API-->>Client: 400 Bad Request (Email in use)
    else Email Unique
        API->>API: Hash password with bcrypt
        API->>API: Assign random ScoreGroup (A, B, C, or D)
        API->>DB: Save User & Create CreditLimit Record
        DB-->>API: User & CreditLimit Saved
        API->>API: Generate JWT Access Token
        API-->>Client: 201 Created (User details + JWT Token)
    end