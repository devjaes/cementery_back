# Payment Module API Documentation

## Overview
This document provides complete API documentation for the Payment Module of the Cemetery Management System.

## Base URL
```
http://localhost:3000
```

## Authentication
All endpoints require proper authentication (add your authentication headers as needed).

## Endpoints Summary

| Method | Endpoint                        | Description                            |
| ------ | ------------------------------- | -------------------------------------- |
| POST   | `/payments`                     | Create new payment                     |
| GET    | `/payments`                     | Get all payments with optional filters |
| GET    | `/payments/:id`                 | Get payment by ID                      |
| GET    | `/payments/code/:code`          | Get payment by payment code            |
| GET    | `/payments/procedure/:type/:id` | Get payments by procedure              |
| GET    | `/payments/:id/receipt`         | Generate/get receipt data              |
| POST   | `/payments/:id/receipt`         | Upload receipt file                    |
| PATCH  | `/payments/:id`                 | Update payment                         |
| PATCH  | `/payments/:id/confirm`         | Confirm payment manually               |
| DELETE | `/payments/:id`                 | Delete payment (pending only)          |

## Data Types

### Payment Object
```typescript
{
  paymentId: string;           // UUID
  procedureType: string;       // 'burial' | 'exhumation' | 'niche_sale' | 'tomb_improvement' | 'hole_extension'
  procedureId: string;         // UUID of the related procedure
  amount: number;              // Decimal with 2 decimal places
  status: string;              // 'pending' | 'paid'
  paymentCode: string;         // Unique code format: PAY-YYYY-MM-DD-XXXXX
  generatedDate: string;       // ISO timestamp
  paidDate: string | null;     // ISO timestamp or null
  receiptFile: string | null;  // File path or null
  observations: string | null; // Optional notes
  generatedBy: string;         // User who created the payment
  validatedBy: string | null;  // User who validated the payment
  updatedDate: string;         // ISO timestamp
}
```

## Detailed Endpoints

### 1. Create Payment
**POST** `/payments`

Creates a new payment record for a procedure.

**Request Body:**
```json
{
  "procedureType": "burial",
  "procedureId": "123e4567-e89b-12d3-a456-426614174000",
  "amount": 150.50,
  "generatedBy": "admin-user",
  "observations": "Payment for burial procedure"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Payment created successfully",
  "data": {
    "paymentId": "456e7890-e89b-12d3-a456-426614174001",
    "procedureType": "burial",
    "procedureId": "123e4567-e89b-12d3-a456-426614174000",
    "amount": 150.50,
    "status": "pending",
    "paymentCode": "PAY-2025-09-28-00001",
    "generatedDate": "2025-09-28T10:30:00Z",
    "paidDate": null,
    "receiptFile": null,
    "observations": "Payment for burial procedure",
    "generatedBy": "admin-user",
    "validatedBy": null,
    "updatedDate": "2025-09-28T10:30:00Z"
  }
}
```

### 2. Get All Payments
**GET** `/payments`

Retrieves all payments with optional filtering.

**Query Parameters:**
- `status` (optional): Filter by status (`pending` | `paid`)
- `procedureType` (optional): Filter by procedure type
- `generatedBy` (optional): Filter by user (partial match)
- `paymentCode` (optional): Filter by payment code (partial match)

**Example:** `/payments?status=pending&procedureType=burial`

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Payments retrieved successfully",
  "data": [
    {
      // Payment object
    }
  ],
  "count": 1
}
```

### 3. Get Payment by ID
**GET** `/payments/:id`

Retrieves a specific payment by its UUID.

**Parameters:**
- `id`: Payment UUID

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Payment retrieved successfully",
  "data": {
    // Payment object
  }
}
```

### 4. Get Payment by Code
**GET** `/payments/code/:code`

Retrieves a payment by its unique payment code.

**Parameters:**
- `code`: Payment code (e.g., "PAY-2025-09-28-00001")

### 5. Get Payments by Procedure
**GET** `/payments/procedure/:type/:id`

Retrieves all payments for a specific procedure.

**Parameters:**
- `type`: Procedure type (`burial` | `exhumation` | `niche_sale` | `tomb_improvement` | `hole_extension`)
- `id`: Procedure UUID

### 6. Upload Receipt
**POST** `/payments/:id/receipt`

Uploads a receipt file and automatically confirms the payment.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: Receipt file (JPEG, JPG, PNG, or PDF - max 5MB)
- `validatedBy`: User who validates the payment

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Receipt uploaded and payment confirmed successfully",
  "data": {
    // Updated payment object with receiptFile path and status: "paid"
  }
}
```

### 7. Generate Receipt
**GET** `/payments/:id/receipt`

Gets payment data for receipt generation (PDF generation to be implemented).

### 8. Update Payment
**PATCH** `/payments/:id`

Updates payment information.

**Request Body (all fields optional):**
```json
{
  "status": "paid",
  "observations": "Payment confirmed by bank transfer",
  "validatedBy": "admin-user"
}
```

### 9. Confirm Payment
**PATCH** `/payments/:id/confirm`

Manually confirms a payment without receipt upload.

**Request Body:**
```json
{
  "validatedBy": "admin-user"
}
```

### 10. Delete Payment
**DELETE** `/payments/:id`

Deletes a payment (only allowed for pending payments).

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Payment deleted successfully"
}
```

**Error Response (400) - Cannot delete paid payment:**
```json
{
  "statusCode": 400,
  "message": "Cannot delete a confirmed payment",
  "error": "Bad Request"
}
```

## Error Responses

### Common Error Formats

**404 - Not Found:**
```json
{
  "statusCode": 404,
  "message": "Payment with ID {id} not found",
  "error": "Not Found"
}
```

**400 - Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

**500 - Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## File Upload Specifications

### Supported File Types
- JPEG (.jpg, .jpeg)
- PNG (.png)
- PDF (.pdf)

### File Size Limit
- Maximum: 5MB per file

### Storage Location
Files are stored in the path configured by the `UPLOAD_PATH` environment variable:
- Default: `./uploads/receipts/`
- Custom: Set `UPLOAD_PATH` in your `.env` file

### File Naming Convention
Uploaded files are automatically renamed to: `{timestamp}-{random}.{extension}`

Example: `1727435400000-123456789.jpg`

## Environment Variables

```bash
# File Upload Configuration
UPLOAD_PATH=./uploads  # Path where uploaded files will be stored
```

## Postman Collection

Import the `postman-payment-collection.json` file into Postman to get:

- All endpoints pre-configured
- Example requests and responses
- Automatic variable extraction (paymentId, paymentCode)
- Basic response validation tests
- Environment variables for easy testing

### Collection Variables
- `baseUrl`: API base URL (default: http://localhost:3000)
- `paymentId`: Automatically set from create payment response
- `paymentCode`: Automatically set from create payment response

## Testing Flow

1. **Create Payment** - Creates a new payment and sets variables
2. **Get Payment by ID** - Uses the created payment ID
3. **Upload Receipt** - Uploads a file and confirms payment
4. **Get All Payments** - View all payments with filters
5. **Update Payment** - Modify payment details
6. **Delete Payment** - Remove pending payments only

## Integration Examples

### Frontend Integration
```typescript
// Create payment
const createPayment = async (paymentData) => {
  const response = await fetch('/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData)
  });
  return response.json();
};

// Upload receipt
const uploadReceipt = async (paymentId, file, validatedBy) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('validatedBy', validatedBy);
  
  const response = await fetch(`/payments/${paymentId}/receipt`, {
    method: 'POST',
    body: formData
  });
  return response.json();
};
```

### cURL Examples
```bash
# Create payment
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{
    "procedureType": "burial",
    "procedureId": "123e4567-e89b-12d3-a456-426614174000",
    "amount": 150.50,
    "generatedBy": "admin-user"
  }'

# Upload receipt
curl -X POST http://localhost:3000/payments/{paymentId}/receipt \
  -F "file=@receipt.jpg" \
  -F "validatedBy=admin-user"

# Get payments with filters
curl "http://localhost:3000/payments?status=pending&procedureType=burial"
``` 