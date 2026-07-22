cat << 'EOF' > docs/erd.md
# Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o| CreditLimit : "has"
    User ||--o{ Credit : "applies"
    User ||--o{ Notification : "receives"
    Credit ||--o{ PaymentPlan : "generates"
    PaymentPlan ||--o{ Payment : "has"

    User {
        string id PK
        string email UK
        string password
        string name
        string phone
        enum status "ACTIVE | SUSPENDED"
        datetime createdAt
    }

    CreditLimit {
        string id PK
        string userId FK
        enum scoreGroup "A | B | C | D"
        decimal baseLimit
        decimal usedAmount
        decimal availableLimit
        datetime expiresAt
    }

    Credit {
        string id PK
        string userId FK
        decimal amount
        int termCount
        decimal interestRate
        decimal totalPayable
        enum status "ACTIVE | COMPLETED | CANCELLED"
        datetime createdAt
    }

    PaymentPlan {
        string id PK
        string creditId FK
        int installmentNo
        decimal amount
        date dueDate
        enum status "UNPAID | PAID | LATE"
        decimal lateFeeRate
        int snoozeCount
        datetime paidAt
    }

    Payment {
        string id PK
        string paymentPlanId FK
        decimal amount
        enum channel "MANUAL | AUTO"
        enum status "SUCCEEDED | FAILED"
        datetime createdAt
    }

    Notification {
        string id PK
        string userId FK
        enum type "CREDIT_APPROVED | PAYMENT_SUCCESS | REMINDER | OVERDUE"
        json payload
        datetime sentAt
    }