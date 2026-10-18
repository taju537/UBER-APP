# Backend API

## Register a user

Creates a user account, hashes the supplied password, and returns an authentication token.

### Endpoint

```http
POST /users/register
Content-Type: application/json
```

The backend listens on port `3000` by default; set the `PORT` environment variable to use another port.

### Request body

Send a JSON object with these fields:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `fullname` | object | Yes | Must contain `firstname`. |
| `fullname.firstname` | string | Yes | At least 3 characters. |
| `fullname.lastname` | string | No | Optional; if provided, the model requires at least 3 characters. |
| `email` | string | Yes | Must be a valid email address. Email addresses must also be unique in the database. |
| `password` | string | Yes | At least 6 characters. The password is hashed before it is stored. |

Example:

```json
{
  "fullname": {
    "firstname": "Alex",
    "lastname": "Morgan"
  },
  "email": "alex@example.com",
  "password": "secret123"
}
```

Although `lastname` is optional in the model, provide the `fullname` object and `firstname`; the registration handler reads `fullname.firstname`.

### Responses

#### `201 Created`

The account was created. The response contains a JWT and the created user:

```json
{
  "token": "<jwt>",
  "user": {
    "_id": "<user-id>",
    "fullname": {
      "firstname": "Alex",
      "lastname": "Morgan"
    },
    "email": "alex@example.com",
    "password": "<bcrypt-hash>"
  }
}
```

The returned `user` currently includes the stored password hash (not the plaintext password), because the newly created Mongoose document is serialized directly. The `select: false` schema option does not remove it from this create response.

#### `400 Bad Request`

One or more request fields failed validation. The response includes the validation errors:

```json
{
  "errors": [
    {
      "type": "field",
      "msg": "Invalid Email",
      "path": "email",
      "location": "body"
    }
  ]
}
```

#### Other errors

The route does not define responses for database failures, duplicate email addresses, or missing server configuration such as `JWT_SECRET`. These errors are not converted into a documented status by the registration handler and may be handled by Express's default error handling.

## Log in a user

Authenticates an existing user by email and password, then returns an authentication token and the user document.

### Endpoint

```http
POST /users/login
Content-Type: application/json
```

### Request body

Send a JSON object with these fields:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `email` | string | Yes | Must be a valid email address. |
| `password` | string | Yes | At least 6 characters. Must match the password used to register the account. |

Example:

```json
{
  "email": "alex@example.com",
  "password": "secret123"
}
```

### Responses

#### `201 Created`

The credentials matched an existing user. The response includes a JWT and the user document:

```json
{
  "token": "<jwt>",
  "user": {
    "_id": "<user-id>",
    "fullname": {
      "firstname": "Alex",
      "lastname": "Morgan"
    },
    "email": "alex@example.com",
    "password": "<bcrypt-hash>"
  }
}
```

The login handler explicitly loads the password field to compare it and returns the user document directly, so the response includes the stored password hash, not the plaintext password. The handler currently responds with `201 Created` on successful login.

#### `400 Bad Request`

The email is not valid or the password is shorter than 6 characters. The response includes an `errors` array:

```json
{
  "errors": [
    {
      "type": "field",
      "msg": "Invalid Email",
      "path": "email",
      "location": "body"
    }
  ]
}
```

#### `401 Unauthorized`

The email does not match an account, or the password is incorrect. Both cases return the same response:

```json
{
  "message": "invalid email or password"
}
```

#### Other errors

Database failures or missing server configuration such as `JWT_SECRET` are not assigned a specific status by the login handler and may be handled by Express's default error handling.

## Get the current user's profile

Returns the profile for the user identified by a valid authentication token.

### Endpoint

```http
GET /users/profile
```

### Authentication

Send the JWT returned by registration or login as a Bearer token:

```http
Authorization: Bearer <jwt>
```

The login endpoint also sets a `token` cookie, which can be sent instead of the Authorization header.

### Request body

No request body is required.

### Responses

#### `200 OK`

The token is valid and the user's profile is returned:

```json
{
  "_id": "<user-id>",
  "fullname": {
    "firstname": "Alex",
    "lastname": "Morgan"
  },
  "email": "alex@example.com",
  "socketId": "<socket-id>"
}
```

Fields not set on the user, such as `lastname` or `socketId`, may be absent from the response. The password is excluded from this profile response.

#### `401 Unauthorized`

The token is missing, invalid, expired, or blacklisted:

```json
{
  "message": "unauthorized"
}
```

## Log out a user

Invalidates the current authentication token by adding it to the token blacklist and clears the `token` cookie.

### Endpoint

```http
GET /users/logout
```

### Authentication

Authentication is required. Send a Bearer token:

```http
Authorization: Bearer <jwt>
```

Alternatively, send the `token` cookie set by login. The token used to authenticate the request is blacklisted.

### Request body

No request body is required.

### Responses

#### `200 OK`

The token was blacklisted and the cookie cleared:

```json
{
  "message": " logged out"
}
```

The response message currently contains a leading space. After logout, the same token cannot be used to access authenticated endpoints; log in again to obtain a new token.

#### `401 Unauthorized`

The token is missing, invalid, expired, or already blacklisted:

```json
{
  "message": "unauthorized"
}
```

## Register a captain

Creates a captain account with vehicle details, hashes the password, and returns an authentication token.

### Endpoint

```http
POST /captains/register
Content-Type: application/json
```

### Request body

Send a JSON object with these fields:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `fullname` | object | Yes | Must contain `firstname`. |
| `fullname.firstname` | string | Yes | At least 3 characters. |
| `fullname.lastname` | string | No | Optional; if provided, the model requires at least 3 characters. |
| `email` | string | Yes | Must be a valid email address and not already registered. |
| `password` | string | Yes | At least 6 characters. The password is hashed before storage. |
| `vehicle` | object | Yes | Must contain `color`, `plate`, `capacity`, and `vehicleType`. |
| `vehicle.color` | string | Yes | At least 3 characters. |
| `vehicle.plate` | string | Yes | At least 3 characters. |
| `vehicle.capacity` | number | Yes | At least 1 seat. |
| `vehicle.vehicleType` | string | Yes | Model values are `car`, `motorcycle`, or `auto`. See the validation note below. |

Example request:

```json
{
  "fullname": {
    "firstname": "Alex",
    "lastname": "Morgan"
  },
  "email": "alex@example.com",
  "password": "secret123",
  "vehicle": {
    "color": "black",
    "plate": "ABC123",
    "capacity": 4,
    "vehicleType": "car"
  }
}
```

**Vehicle type validation note:** The route currently allows `car`, `auto`, and `motorcycle ` (with a trailing space), but the database model only allows `car`, `motorcycle`, and `auto`. As a result, `motorcycle` fails route validation, while `motorcycle ` passes route validation but does not match the model enum and may result in a server error. Use `car` or `auto` until the route's allowed value is corrected.

### Responses

#### `201 Created`

The captain account was created. The response contains a JWT and the created captain:

```json
{
  "token": "<jwt>",
  "captain": {
    "_id": "<captain-id>",
    "fullname": {
      "firstname": "Alex",
      "lastname": "Morgan"
    },
    "email": "alex@example.com",
    "password": "<bcrypt-hash>",
    "vehicle": {
      "color": "black",
      "plate": "ABC123",
      "capacity": 4,
      "vehicleType": "car"
    },
    "status": "inactive"
  }
}
```

The response currently includes the stored password hash, not the plaintext password, because the newly created document is returned directly.

#### `400 Bad Request`

Request validation failed or the email is already registered. Validation failures return an `errors` array; an existing account returns:

```json
{
  "message": "captain already exist"
}
```

#### Other errors

The route does not define specific responses for database failures, model validation failures, or missing server configuration such as `JWT_SECRET`. These errors may be handled by Express's default error handling.

## Log in a captain

Authenticates a captain using email and password, then returns an authentication token and captain document.

### Endpoint

```http
POST /captains/login
Content-Type: application/json
```

### Request body

Send a JSON object with these fields:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `email` | string | Yes | Must be a valid email address. |
| `password` | string | Yes | At least 6 characters and must match the password used to register the captain. |

Example:

```json
{
  "email": "alex@example.com",
  "password": "secret123"
}
```

### Responses

#### `201 Created`

Credentials matched an existing captain. The response includes a JWT and captain:

```json
{
  "token": "<jwt>",
  "captain": {
    "_id": "<captain-id>",
    "fullname": {
      "firstname": "Alex",
      "lastname": "Morgan"
    },
    "email": "alex@example.com",
    "password": "<bcrypt-hash>",
    "vehicle": {
      "color": "black",
      "plate": "ABC123",
      "capacity": 4,
      "vehicleType": "car"
    },
    "status": "inactive"
  }
}
```

The login handler loads the password field to compare it and returns the captain document directly, so the response includes the stored hash, not the plaintext password. A `token` cookie is also set.

#### `400 Bad Request`

The email is invalid or the password is shorter than 6 characters. The response contains an `errors` array, as in the registration endpoint.

#### `401 Unauthorized`

The email does not match a captain, or the password is incorrect:

```json
{
  "message": "invalid email or password"
}
```

## Get the current captain's profile

Returns the captain identified by a valid authentication token.

### Endpoint

```http
GET /captains/profile
```

### Authentication and request body

Send a JWT as a Bearer token:

```http
Authorization: Bearer <jwt>
```

Alternatively, send the `token` cookie set by login. No request body is required.

### Responses

#### `200 OK`

The response wraps the captain profile in a `captain` property:

```json
{
  "captain": {
    "_id": "<captain-id>",
    "fullname": {
      "firstname": "Alex",
      "lastname": "Morgan"
    },
    "email": "alex@example.com",
    "status": "inactive",
    "vehicle": {
      "color": "black",
      "plate": "ABC123",
      "capacity": 4,
      "vehicleType": "car"
    }
  }
}
```

Fields that have not been set, such as `lastname`, `socketId`, or `location`, may be absent. The password is excluded from this profile response.

#### `401 Unauthorized`

The token is missing, invalid, expired, or blacklisted:

```json
{
  "message": "unauthorized"
}
```

## Log out a captain

Blacklists the current authentication token and clears the `token` cookie.

### Endpoint

```http
GET /captains/logout
```

### Authentication and request body

Authentication is required. Send a JWT as a Bearer token or send the `token` cookie set by login. No request body is required.

### Responses

#### `200 OK`

When logout completes successfully, the response is:

```json
{
  "message": " logged out"
}
```

The response message currently includes a leading space. The token is added to the blacklist and cannot be used again.

#### `401 Unauthorized`

The token is missing, invalid, expired, or already blacklisted:

```json
{
  "message": "unauthorized"
}
```

### Current implementation issue

The captain controller currently imports the blacklist model using a path with trailing spaces (`../models/blacklisttoken.model  `). Node.js cannot resolve that module path, so loading the captain controller fails and the captain routes cannot currently serve requests. Correct the import path to `../models/blacklisttoken.model` before using these endpoints. After fixing that import, the documented logout success response describes the controller's intended behavior.
