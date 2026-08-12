graph TD
    Client[Client / Postman / Web App] -->|HTTPS / REST API| API[NestJS API Gateway]
    
    subgraph Core System
        API --> AuthGuard[JWT & Throttler Guards]
        AuthGuard --> Controllers[Controllers & Business Logic]
        Controllers --> Services[Services & Domain Modules]
    end

    subgraph Autonomous Background Services
        Cron[Cron Scheduler] --> TasksService[Tasks Service]
    end

    subgraph Data & Storage Layer
        Services -->|TypeORM ORM| PrimaryStore[(Primary Store: PostgreSQL)]
        TasksService -->|Queries & Status Updates| PrimaryStore
        
        Services -->|Distributed Lock & Calculator Cache| RedisCache[(Cache Layer: Redis)]
        
        Services -->|Append-Only Events| NotificationStore[(Notification Store)]
        TasksService -->|Cron Event Notifications| NotificationStore
    end