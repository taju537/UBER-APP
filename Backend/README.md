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
