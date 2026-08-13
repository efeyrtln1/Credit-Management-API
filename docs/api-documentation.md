```mermaid
# Credit Management API - API Documentation

Bu doküman, sistemde yer alan tüm REST API endpoint'lerinin istek/yanıt şemalarını ve hata durumlarını içerir[cite: 1].

---

## 1. Hata Kodları Referans Tablosu (Standard Error Codes)

Sistemde fırlatılan standart iş kuralı hataları ve HTTP durum kodları aşağıda listelenmiştir[cite: 1]:

| Error Code | HTTP Status | Açıklama |
| :--- | :---: | :--- |
| `INSUFFICIENT_LIMIT` | `400` | İstenen kredi tutarı kullanıcının `availableLimit` değerini aştığında dönülür[cite: 1]. |
| `MAX_ACTIVE_CREDITS` | `400` | Kullanıcının aktif kredi sayısı `MAX_ACTIVE_CREDITS` sınırına ulaştığında dönülür[cite: 1]. |
| `INVALID_TERM_COUNT` | `400` | Taksit sayısı 1 ile `MAX_TERM_COUNT` arasında olmadığında dönülür[cite: 1]. |
| `CREDIT_LIMIT_EXPIRED` | `400` | Kullanıcının `CreditLimit.expiresAt` süresi dolduğunda dönülür[cite: 1]. |
| `PAYMENT_PLAN_NOT_PAYABLE` | `400` | Taksit zaten `PAID` durumundaysa veya ödenemez haldeyse dönülür[cite: 1]. |
| `PAYMENT_ALREADY_IN_PROGRESS` | `409` | Idempotency lock aktifleştiğinde (aynı taksite 30sn içinde 2. istek atıldığında) dönülür[cite: 1]. |
| `SNOOZE_LIMIT_REACHED` | `400` | Taksit erteleme sayısı `MAX_SNOOZE_COUNT` sınırını aştığında dönülür[cite: 1]. |
| `CANNOT_SNOOZE_LATE_PLAN` | `400` | Gecikmeye düşmüş (`LATE`) bir taksite snooze uygulanmak istendiğinde dönülür[cite: 1]. |

---

## 2. API Endpoint Listesi

### 2.1 Auth & User Endpoints

#### `POST /auth/register`
* **Auth:** Gerekmiyor[cite: 1]
* **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "name": "Efe Yurtalan",
    "phone": "+905551112233"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Efe Yurtalan"
    }
  }
  ```

#### `POST /auth/login`
* **Auth:** Gerekmiyor[cite: 1]
* **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "accessToken": "eyJhbGciOi..."
  }
  ```

#### `GET /users/me`
* **Auth:** Bearer Token[cite: 1]
* **Response (200 OK):**
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Efe Yurtalan",
    "status": "ACTIVE",
    "creditLimit": {
      "scoreGroup": "A",
      "baseLimit": 50000.00,
      "usedAmount": 10000.00,
      "availableLimit": 40000.00,
      "expiresAt": "2027-02-13T00:00:00.000Z"
    }
  }
  ```

---

### 2.2 Calculator & Credit Endpoints

#### `GET /credits/calculator`
* **Auth:** Gerekmiyor (Public & Redis Cached)[cite: 1]
* **Query Params:** `amount=10000&termCount=6&scoreGroup=A`[cite: 1]
* **Response (200 OK):**
  ```json
  {
    "amount": 10000,
    "termCount": 6,
    "interestRate": 0.015,
    "lateFeeRate": 0.0005,
    "installmentAmount": 1816.67,
    "totalPayable": 10900.00,
    "totalInterest": 900.00,
    "schedule": [
      {
        "installmentNo": 1,
        "dueDate": "2026-09-12",
        "amount": 1816.67,
        "lateAmounts": [
          { "daysLate": 7, "lateFee": 6.36, "totalDue": 1823.03 },
          { "daysLate": 30, "lateFee": 27.25, "totalDue": 1843.92 }
        ]
      }
    ]
  }
  ```

#### `POST /credits`
* **Auth:** Bearer Token[cite: 1]
* **Request Body:**
  ```json
  {
    "amount": 10000,
    "termCount": 6
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "id": "credit-uuid",
    "amount": 10000,
    "termCount": 6,
    "interestRate": 0.015,
    "totalPayable": 10900.00,
    "status": "ACTIVE"
  }
  ```

#### `GET /credits/:id/payment-plans`
* **Auth:** Bearer Token[cite: 1]
* **Response (200 OK):**
  ```json
  [
    {
      "id": "plan-uuid",
      "installmentNo": 1,
      "amount": 1816.67,
      "dueDate": "2026-09-12",
      "status": "LATE",
      "currentLate": {
        "daysLate": 5,
        "lateFee": 4.54,
        "totalDue": 1821.21
      }
    }
  ]
  ```

---

### 2.3 Repayment & Notification Endpoints

#### `POST /credits/payment-plans/:id/pay`
* **Auth:** Bearer Token[cite: 1]
* **Headers:** `x-idempotency-key: unique-string`[cite: 1]
* **Response (200 OK):**
  ```json
  {
    "paymentId": "payment-uuid",
    "paymentPlanId": "plan-uuid",
    "amountPaid": 1821.21,
    "status": "SUCCEEDED"
  }
  ```

#### `GET /notifications`
* **Auth:** Bearer Token[cite: 1]
* **Response (200 OK):**
  ```json
  [
    {
      "id": "notif-uuid",
      "type": "REMINDER",
      "payload": {
        "paymentPlanId": "plan-uuid",
        "daysLeft": 3
      },
      "sentAt": "2026-08-13T09:00:00.000Z"
    }
  ]
  ```