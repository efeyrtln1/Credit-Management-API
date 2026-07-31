# Sequence Diagram: Credit Application & Installment Generation

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as NestJS API
    participant DB as PostgreSQL

    Client->>API: POST /credits/apply (amount, termCount) [JWT]
    API->>API: Validate JWT & User Claims
    API->>DB: Fetch User Credit Limit & Active Credits Count
    DB-->>API: CreditLimit & Active Credit Count
    
    alt Guard Check Failed
        API-->>Client: 400 Bad Request (Insufficient Limit / Max Active Credits Reached)
    else Guards Passed
        API->>DB: Begin Database Transaction
        API->>DB: Create Active Credit Record
        API->>DB: Generate Monthly PaymentPlan Rows (UNPAID)
        API->>DB: Deduct Amount from Available Limit
        API->>DB: Commit Transaction
        DB-->>API: Transaction Success
        API-->>Client: 201 Created (Approved Credit & Schedule)
    end