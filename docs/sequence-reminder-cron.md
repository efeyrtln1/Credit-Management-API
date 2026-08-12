sequenceDiagram
    autonumber
    participant Scheduler as Cron Scheduler (09:00)
    participant Tasks as TasksService
    participant Config as ConfigService
    participant DB as Primary Store (PostgreSQL)
    participant NotifService as NotificationsService
    participant NotifStore as Notification Store

    Scheduler->>Tasks: handleReminders()
    Tasks->>Config: get('REMINDER_DAYS_BEFORE_DUE')
    Config-->>Tasks: daysCount (e.g. 3)
    Tasks->>DB: SELECT * FROM payment_plans WHERE dueDate = (today + daysCount) AND status = 'UNPAID'
    DB-->>Tasks: upcomingPlans List
    loop For each upcoming plan
        Tasks->>NotifService: createNotification(userId, REMINDER, payload)
        NotifService->>NotifStore: INSERT INTO notifications (userId, type, payload)
        NotifStore-->>NotifService: Saved
    end
    Tasks-->>Scheduler: Job Complete