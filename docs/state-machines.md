stateDiagram-v2
    [*] --> ACTIVE : Kredi Başvurusu Onaylandı
    
    ACTIVE --> COMPLETED : Tüm Taksitler Ödendi
    ACTIVE --> CANCELLED : İptal Edildi
    
    COMPLETED --> [*]
    CANCELLED --> [*]

    note right of COMPLETED
        COMPLETED durumunda harcanan limit
        availableLimit hesabına iade edilir.
    endnote

    stateDiagram-v2
    [*] --> UNPAID : Kredi Oluşturuldu
    
    UNPAID --> PAID : Vadesinde Ödendi
    UNPAID --> LATE : Vade Tarihi Geçti (Daily Cron)
    LATE --> PAID : Gecikme Zamlı Ödendi
    
    PAID --> [*]

    note right of LATE
        LATE statüsü sadece Cron Job 
        tarafından atanır.
    endnote