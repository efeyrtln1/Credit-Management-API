# Sequence Diagram: Repayment & Late Fee Calculation Engine

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as NestJS API
    participant Engine as Calculation Service

    Client->>API: GET /credits/calculator?amount=10000&termCount=6&scoreGroup=A
    API->>API: Parse query parameters (amount, termCount, scoreGroup)
    API->>Engine: calculateRepayment(amount, termCount, scoreGroup)
    Engine->>Engine: Resolve Interest Rate (A=1.5%) & Late Rate (A=0.05%)
    Engine->>Engine: Calculate Total Interest & Monthly Installment
    
    loop For each installment (1 to termCount)
        Engine->>Engine: Project 7-Day Late Fee (installment * lateRate * 7)
        Engine->>Engine: Project 30-Day Late Fee (installment * lateRate * 30)
        Engine->>Engine: Push schedule item with lateAmounts array
    end

    Engine-->>API: Return Full Calculation Breakdown
    API-->>Client: 200 OK (Schedule, Total Payable, Late Projections)