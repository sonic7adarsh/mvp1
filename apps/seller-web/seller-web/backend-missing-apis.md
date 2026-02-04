# Missing Backend APIs for Seller App

The following APIs are currently used by the Seller App frontend but are missing from the provided API contract (or require backend support for "current store" context to avoid UI changes).

## 1. Dashboard Statistics
**Endpoint**: `GET /seller/dashboard-stats`
**Description**: Returns aggregated statistics for the seller dashboard and earnings page.
**Response Contract**:
```json
{
  "today": 12,        // Orders today
  "pending": 5,       // Pending orders
  "products": 45,     // Total active products
  "earnings": 1500.50 // Total earnings
}
```

## 2. Seller Profile & Store Context
**Endpoint**: `GET /seller/profile`
**Description**: Returns the authenticated seller's personal details and their primary store details. This is critical for the app to know which store to display without a "Select Store" screen.
**Response Contract**:
```json
{
  "id": "user_uuid",
  "name": "Seller Name",
  "phone": "9876543210",
  "email": "seller@example.com",
  "store_name": "My Store",
  "address": {
    "full": "Shop 1, Building A, Main St, City - 123456",
    "shopNo": "Shop 1",
    "building": "Building A",
    "street": "Main St",
    "area": "Downtown",
    "city": "City",
    "pincode": "123456",
    "lat": 28.6139,
    "lng": 77.2090
  }
}
```

## 3. Global Product Management (Default Store)
The contract currently requires `storeId` in the path (`/seller/stores/{storeId}/products`). The frontend assumes a single-store context. Please support these endpoints by inferring the `storeId` from the authenticated user's primary store.

### List Products
**Endpoint**: `GET /seller/products`
**Query Params**: Same as contract (`search`, `category`, `active`, `page`, `limit`)
**Response**: Same as contract (`List<Product>`)

### Create Product
**Endpoint**: `POST /seller/products`
**Body**: Same as contract
**Response**: Same as contract

## 4. Store Management (Default Store)
**Description**: Endpoints to create or update the authenticated seller's store.

### Create Store (Onboarding)
**Endpoint**: `POST /seller/store`
**Body**:
```json
{
  "name": "New Store Name",
  "address": { ... } // Same address structure as below
}
```
**Response**: `{ "success": true, "store": { ... } }`

### Update Store (Profile)
**Endpoint**: `PATCH /seller/store`
**Description**: Update the authenticated seller's default store.
**Body**:
```json
{
  "name": "Updated Store Name",
  "address": {
    "full": "...",
    "shopNo": "...",
    "building": "...",
    "street": "...",
    "area": "...",
    "city": "...",
    "pincode": "...",
    "lat": 12.34,
    "lng": 56.78
  }
}
```
**Response**: `{ "success": true, "store": { ... } }`
