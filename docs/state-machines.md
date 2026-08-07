stateDiagram-v2
    direction TB
    
    [*] --> Credit_ACTIVE: Kredi Başvurusu Onaylandı
    state "Credit Lifecycle" as Credit {
        Credit_ACTIVE --> Credit_COMPLETED: Tüm Taksitler PAID Oldu
        Credit_ACTIVE --> Credit_CANCELLED: İptal Edildi
    }
    Credit_COMPLETED --> [*]
    Credit_CANCELLED --> [*]

    note right of Credit_COMPLETED
        Limit, sadece Credit COMPLETED
        durumuna geçtiğinde restore edilir.
    endnote

    %% PaymentPlan State Machine
    [*] --> Plan_UNPAID: Kredi Tanımlandı
    state "PaymentPlan Lifecycle" as PaymentPlan {
        Plan_UNPAID --> Plan_PAID: Zamanında Ödendi
        Plan_UNPAID --> Plan_LATE: Vade Tarihi Geçti (Cron Job)
        Plan_LATE --> Plan_PAID: Gecikme Zamlı Ödendi
    }
    Plan_PAID --> [*]