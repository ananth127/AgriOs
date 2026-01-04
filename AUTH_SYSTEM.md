# 🔐 Authentication System

Agri-OS now includes a complete authentication system with JWT.

## 🚀 Features
- **User Registration**: Create new accounts.
- **Login**: Get JWT access tokens.
- **Profile**: Get current user details.
- **Role-Based**: Support for Farmer, Buyer, Admin, etc.

---

## 🛠️ Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/auth/register` | Register new user | ❌ |
| `POST` | `/api/v1/auth/login` | Login (returns Token) | ❌ |
| `GET` | `/api/v1/auth/me` | Get Profile | ✅ Bearer Token |

---

## 👤 Default User (Created by Seed)

- **Email**: `admin@agrios.com`
- **Password**: `password123`
- **Role**: `admin`

---

## 🧪 How to Test

### 1. Restart Backend
Since we added new tables, restart the backend to create them:
```bash
uvicorn main:app --reload
```

### 2. Run Seed
To create the default admin user:
```bash
python seed.py
```

### 3. Login (Swagger UI)
1. Go to `http://localhost:8000/docs`
2. Click **Authorize** button (top right)
3. Enter `admin@agrios.com` / `password123`
4. Click **Authorize** -> **Close**

Now you can try the `/api/v1/auth/me` endpoint explicitly!

---

## 💻 Frontend Integration

The frontend can now use these endpoints.
Store the `access_token` in `localStorage` or `cookies`.
Send it in the header for protected requests:

```javascript
headers: {
  "Authorization": "Bearer <access_token>"
}
```
