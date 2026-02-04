# Backend Requirement: Seller Order Details

To fully support the Seller App's order management features, please ensure the `GET /seller/orders` and `GET /seller/orders/{id}` endpoints return the complete customer profile and address details.

## Required JSON Structure

The `customer` object within each order should match this structure:

```json
{
  "id": "order_uuid",
  // ... other order fields
  "customer": {
    "name": "Adarsh Kumar",
    "phone": "9876543210",
    "address": {
      "street": "Flat 402, Galaxy Apartments",
      "area": "HSR Layout",
      "city": "Bengaluru",
      "pincode": "560102",
      "lat": 12.9716,
      "lng": 77.5946
    }
  }
}
```

## Rationale
- **Delivery**: Sellers need the exact address (Street, Area, City, Pincode) to ship the order.
- **Contact**: Sellers may need to call the customer for clarifications.
- **Distance**: Latitude/Longitude helps in estimating delivery range (optional but recommended).

## Current Issue
- Frontend currently receives limited or inconsistent customer data.
- Please verify that the `customer` relation is eagerly loaded and the address is serialized correctly.
