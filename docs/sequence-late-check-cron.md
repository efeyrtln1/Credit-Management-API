sequenceDiagram
    autonumber
    participant Scheduler as Cron Scheduler (00:01)
    participant Tasks as TasksService
    participant DB as Primary Store (PostgreSQL)
    participant NotifService as NotificationsService
    participant NotifStore as Notification Store

    Scheduler->>Tasks: handleLateCheck()
    Tasks->>DB: SELECT * FROM payment_plans WHERE dueDate < today AND status = 'UNPAID'
    DB-->>Tasks: overduePlans List
    loop For each overdue plan
        Tasks->>DB: UPDATE payment_plans SET status = 'LATE' WHERE id = plan.id
        Tasks->>NotifService: createNotification(userId, OVERDUE, payload)
        NotifService->>NotifStore: INSERT INTO notifications (userId, type, payload)
        NotifStore-->>NotifService: Saved
    end
    Tasks-->>Scheduler: Job Complete