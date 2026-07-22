# Blocks API

<cite>
**Referenced Files in This Document**
- [blocks.js](file://server/routes/blocks.js)
- [Block.js](file://server/models/Block.js)
- [index.js](file://server/index.js)
- [client.js](file://src/api/client.js)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [Block Data Model](#block-data-model)
5. [API Endpoints](#api-endpoints)
6. [Error Handling](#error-handling)
7. [Integration Examples](#integration-examples)
8. [Best Practices](#best-practices)

## Introduction

The Blocks API provides comprehensive CRUD operations for managing resume block components within the Modular Resume Builder application. Blocks represent individual sections or elements of a resume such as contact information, work experience, education, skills, and custom content areas.

This API enables clients to create, retrieve, update, and delete blocks programmatically, allowing for dynamic resume composition and manipulation through both web and mobile applications.

## Authentication

All Blocks API endpoints require authentication using JWT (JSON Web Tokens). Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Authentication Flow
1. User authenticates via the main authentication endpoint
2. Server returns a JWT token upon successful authentication
3. Client includes the token in subsequent API requests
4. Server validates the token and authorizes the request

## Base URL

All API endpoints are relative to the base URL:

```
https://api.modular-resume-builder.com/api/v1
```

## Block Data Model

The Block data model represents individual resume components with the following schema:

### Core Fields

| Field | Type | Required | Description | Validation Rules |
|-------|------|----------|-------------|------------------|
| `id` | string | Auto-generated | Unique identifier for the block | UUID format, auto-generated on creation |
| `type` | enum | Yes | Block type identifier | One of: "contact", "summary", "experience", "education", "skills", "projects", "custom" |
| `title` | string | No | Display title for the block | Max 100 characters, alphanumeric with spaces |
| `content` | object | Yes | Block-specific content data | Schema varies by block type |
| `order` | number | Yes | Display order in resume | Integer >= 0, unique within resume |
| `resumeId` | string | Yes | Parent resume identifier | Valid UUID format |
| `isActive` | boolean | Yes | Block visibility status | Default: true |
| `createdAt` | datetime | Auto-generated | Creation timestamp | ISO 8601 format |
| `updatedAt` | datetime | Auto-generated | Last update timestamp | ISO 8601 format |

### Block Type Specific Content Schemas

#### Contact Block
```json
{
  "name": "string",
  "email": "string (email format)",
  "phone": "string (phone format)",
  "address": "string",
  "linkedin": "string (URL format)",
  "website": "string (URL format)"
}
```

#### Experience Block
```json
{
  "company": "string",
  "position": "string",
  "startDate": "date (YYYY-MM-DD)",
  "endDate": "date (YYYY-MM-DD)",
  "description": "string",
  "current": "boolean"
}
```

#### Education Block
```json
{
  "institution": "string",
  "degree": "string",
  "field": "string",
  "startDate": "date (YYYY-MM-DD)",
  "endDate": "date (YYYY-MM-DD)",
  "gpa": "number (0.0-4.0)"
}
```

#### Skills Block
```json
{
  "categories": [
    {
      "name": "string",
      "items": ["string"]
    }
  ]
}
```

## API Endpoints

### Get All Blocks

Retrieve all blocks for a specific resume.

**Endpoint:** `GET /api/v1/resumes/{resumeId}/blocks`

**Authentication:** Required

**Path Parameters:**
- `resumeId`: string - The ID of the resume

**Query Parameters:**
- `type`: string - Filter by block type
- `isActive`: boolean - Filter by active status
- `sortBy`: string - Sort field (order, createdAt, updatedAt)
- `sortOrder`: string - Sort direction (asc, desc)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "contact",
      "title": "Contact Information",
      "content": {...},
      "order": 0,
      "resumeId": "resume-uuid-here",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 50
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions for the resume
- `404 Not Found` - Resume not found
- `500 Internal Server Error` - Server error

### Create New Block

Create a new block for a specific resume.

**Endpoint:** `POST /api/v1/resumes/{resumeId}/blocks`

**Authentication:** Required

**Path Parameters:**
- `resumeId`: string - The ID of the resume

**Request Body:**
```json
{
  "type": "experience",
  "title": "Work Experience",
  "content": {
    "company": "Tech Corp",
    "position": "Software Engineer",
    "startDate": "2020-01-01",
    "endDate": "2023-12-31",
    "description": "Developed web applications..."
  },
  "order": 1,
  "isActive": true
}
```

**Validation Rules:**
- `type`: Must be one of the supported block types
- `content`: Must match the schema for the specified block type
- `order`: Must be a non-negative integer
- `title`: Maximum 100 characters if provided

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "experience",
    "title": "Work Experience",
    "content": {...},
    "order": 1,
    "resumeId": "resume-uuid-here",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request body or validation errors
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions for the resume
- `404 Not Found` - Resume not found
- `409 Conflict` - Duplicate order value

### Get Single Block

Retrieve a specific block by ID.

**Endpoint:** `GET /api/v1/resumes/{resumeId}/blocks/{blockId}`

**Authentication:** Required

**Path Parameters:**
- `resumeId`: string - The ID of the resume
- `blockId`: string - The ID of the block

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "experience",
    "title": "Work Experience",
    "content": {...},
    "order": 1,
    "resumeId": "resume-uuid-here",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions for the resume
- `404 Not Found` - Block or resume not found

### Update Block

Update an existing block's properties.

**Endpoint:** `PUT /api/v1/resumes/{resumeId}/blocks/{blockId}`

**Authentication:** Required

**Path Parameters:**
- `resumeId`: string - The ID of the resume
- `blockId`: string - The ID of the block

**Request Body:** (Partial updates supported)
```json
{
  "title": "Updated Work Experience",
  "content": {
    "company": "New Tech Corp",
    "position": "Senior Software Engineer",
    "startDate": "2020-01-01",
    "endDate": "2024-01-01",
    "description": "Updated description..."
  },
  "isActive": false
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "experience",
    "title": "Updated Work Experience",
    "content": {...},
    "order": 1,
    "resumeId": "resume-uuid-here",
    "isActive": false,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request body or validation errors
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions for the resume
- `404 Not Found` - Block or resume not found

### Delete Block

Delete a block from a resume.

**Endpoint:** `DELETE /api/v1/resumes/{resumeId}/blocks/{blockId}`

**Authentication:** Required

**Path Parameters:**
- `resumeId`: string - The ID of the resume
- `blockId`: string - The ID of the block

**Response:** `204 No Content`

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions for the resume
- `404 Not Found` - Block or resume not found

### Reorder Blocks

Reorder blocks within a resume by updating their order values.

**Endpoint:** `PATCH /api/v1/resumes/{resumeId}/blocks/reorder`

**Authentication:** Required

**Request Body:**
```json
{
  "reorderedBlocks": [
    {
      "id": "block-id-1",
      "order": 0
    },
    {
      "id": "block-id-2", 
      "order": 1
    },
    {
      "id": "block-id-3",
      "order": 2
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Blocks reordered successfully",
  "updatedCount": 3
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request body or missing required fields
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions for the resume
- `404 Not Found` - Resume not found

## Error Handling

### Standard Error Response Format

All API errors follow a consistent response format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "content.company",
        "message": "Company name is required"
      },
      {
        "field": "order",
        "message": "Order must be a non-negative integer"
      }
    ]
  }
}
```

### HTTP Status Codes

| Status Code | Description | Common Causes |
|-------------|-------------|---------------|
| `200 OK` | Request successful | GET, PUT, PATCH operations |
| `201 Created` | Resource created | POST operation |
| `204 No Content` | Operation successful, no content | DELETE operation |
| `400 Bad Request` | Invalid request | Malformed JSON, validation errors |
| `401 Unauthorized` | Authentication required | Missing or invalid token |
| `403 Forbidden` | Insufficient permissions | Wrong user, insufficient rights |
| `404 Not Found` | Resource not found | Invalid IDs |
| `409 Conflict` | Resource conflict | Duplicate order values |
| `422 Unprocessable Entity` | Semantic errors | Business logic validation failures |
| `429 Too Many Requests` | Rate limit exceeded | Too many requests in time window |
| `500 Internal Server Error` | Server error | Unexpected server-side errors |

### Common Validation Errors

- **Missing Required Fields**: When required fields are omitted from the request body
- **Invalid Data Types**: When field values don't match expected types
- **Schema Validation Failures**: When nested objects don't conform to block type schemas
- **Duplicate Order Values**: When multiple blocks have the same order number
- **Invalid Date Formats**: When date fields don't use YYYY-MM-DD format
- **Email Format Errors**: When email addresses don't follow proper format

## Integration Examples

### Creating a New Block

**JavaScript Example:**
```javascript
const createBlock = async (resumeId, blockData) => {
  const response = await fetch(`/api/v1/resumes/${resumeId}/blocks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(blockData)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};
```

### Updating Block Properties

**Python Example:**
```python
import requests

def update_block(resume_id, block_id, updates):
    url = f"https://api.modular-resume-builder.com/api/v1/resumes/{resume_id}/blocks/{block_id}"
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {access_token}'
    }
    
    response = requests.put(url, json=updates, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Failed to update block: {response.text}")
```

### Retrieving Blocks with Filtering

**cURL Example:**
```bash
curl -X GET "https://api.modular-resume-builder.com/api/v1/resumes/resume-123/blocks?type=experience&isActive=true" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Accept: application/json"
```

### Batch Operations

**React Hook Example:**
```javascript
const useBlocks = (resumeId) => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/resumes/${resumeId}/blocks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch blocks');
      
      const data = await response.json();
      setBlocks(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [resumeId]);

  return { blocks, loading, error, refetch: fetchBlocks };
};
```

## Best Practices

### Request Formatting
- Always include proper Content-Type headers (`application/json`)
- Use HTTPS for all API calls
- Implement proper error handling and retry logic
- Validate client-side data before sending requests
- Use appropriate HTTP methods for each operation

### Response Handling
- Check response status codes before processing data
- Handle both success and error response formats
- Implement timeout handling for network requests
- Cache frequently accessed block data appropriately
- Debounce rapid successive requests when possible

### Security Considerations
- Never store tokens in localStorage for production applications
- Implement proper token refresh mechanisms
- Validate all user inputs on the client side
- Use environment variables for sensitive configuration
- Implement rate limiting on the client side

### Performance Optimization
- Use query parameters for filtering and sorting
- Implement pagination for large block collections
- Use optimistic UI updates for better user experience
- Cache responses appropriately based on data volatility
- Implement proper error boundaries in React applications