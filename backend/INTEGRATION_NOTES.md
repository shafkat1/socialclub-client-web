# 📱 Mobile-to-Backend Integration Notes

## Current Status

✅ **Fully Ready for Integration**

### What's Already Connected
- Mobile API client points to `http://localhost:3000/api`
- Auth interceptor automatically adds JWT tokens
- All endpoints defined in backend
- Swagger documentation available at `/api/docs`
- CORS configured for localhost

---

## API Client Configuration

### File: `mobile/src/lib/api.ts`

The mobile app uses Axios with automatic interceptors:

```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api'

// Automatically adds Authorization header with JWT token
apiClient.interceptors.request.use(async (config) => {
  const token = await getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### Environment Variables

For development (already set):
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

For production, update `.env`:
```
EXPO_PUBLIC_API_URL=https://api.clubapp.com/api
```

---

## Authentication Flow

### Mobile Side: `mobile/src/lib/userContext.tsx`

1. **Send OTP**
   ```typescript
   await authAPI.sendOtp('+1234567890')
   ```

2. **Verify OTP & Login**
   ```typescript
   const response = await authAPI.verifyOtp(phone, '123456')
   // Returns: { user, authToken, refreshToken }
   ```

3. **Store Tokens**
   - Stored in AsyncStorage
   - Auto-included in all requests
   - Automatically refreshed when expired

### Backend Side: `backend/src/modules/auth`

Endpoints available:
- `POST /auth/phone/send-otp`
- `POST /auth/phone/verify-otp`
- `POST /auth/refresh-token`
- `GET /auth/me`

---

## Testing Integration

### 1. Verify Backend is Running
```powershell
# Check backend logs show startup message
# Should see: 🚀 Server running on http://localhost:3000
```

### 2. Test API Directly
```bash
# Open browser
http://localhost:3000/api/docs

# Or use curl
curl http://localhost:3000/api/health
# Response: { "status": "ok" }
```

### 3. Test from Mobile App
- Open app at http://localhost:8081
- Login with demo credentials
- Check Network tab in DevTools
- Requests should go to `http://localhost:3000/api/*`

### 4. Check Stored Data
```powershell
# Connect to database
psql -h localhost -U clubapp -d clubapp

# View users
SELECT * FROM "User";

# View groups
SELECT * FROM "Group";
```

---

## Common Integration Issues

### Issue: "Cannot connect to backend"

**Symptoms:**
- Network tab shows requests failing
- Error: `ERR_CONNECTION_REFUSED`

**Solutions:**
1. Is backend running? Check: `http://localhost:3000/api/docs`
2. Is Docker postgres running? `docker ps | findstr clubapp-postgres`
3. Is frontend on same network? Try: `curl http://localhost:3000/api/health`

### Issue: "Auth token not working"

**Symptoms:**
- Login succeeds but app is blank
- 401 Unauthorized errors in network tab

**Solutions:**
1. Check backend JWT secret in `.env`
2. Check token is being stored: Open DevTools → Application → AsyncStorage
3. Check token format: `Bearer <token>`

### Issue: "Data not persisting"

**Symptoms:**
- Create group, refresh page, it's gone
- Orders not visible after page refresh

**Solutions:**
1. Is database running? `docker ps`
2. Are migrations applied? Check: `npm run migration:deploy` output
3. Check database is accessible: `psql -h localhost -U clubapp -d clubapp`

---

## API Endpoints Being Used

### From Mobile Map Screen
```typescript
// Get all venues
GET /venues

// Search venues
POST /venues/search?query=bar

// Get venue details
GET /venues/:id
```

### From Mobile Groups Screen
```typescript
// Get user's groups
GET /groups

// Create new group
POST /groups
Body: { name: "Weekend Warriors", ... }

// Update group
PUT /groups/:id
Body: { name: "New Name" }

// Delete group
DELETE /groups/:id
```

### From Mobile Orders Screen
```typescript
// Get orders
GET /orders?status=pending

// Create order
POST /orders
Body: { 
  recipientId: "...", 
  venueId: "...", 
  items: [...],
  totalAmount: 25.50
}

// Update order status
PUT /orders/:id
Body: { status: "accepted" }

// Get QR code
GET /orders/:id/qr
```

---

## Data Models

### User Model
```typescript
{
  id: string
  phone?: string
  email?: string
  displayName?: string
  phoneVerified: boolean
  emailVerified: boolean
  createdAt: Date
}
```

### Venue Model
```typescript
{
  id: string
  name: string
  type: 'bar' | 'club' | 'pub' | 'lounge'
  latitude: number
  longitude: number
  address: string
  hours: { open: string, close: string }
  rating: number
  description: string
}
```

### Group Model
```typescript
{
  id: string
  name: string
  ownerId: string
  members: GroupMember[]
  currentVenue?: string
  createdAt: Date
}
```

### Order Model
```typescript
{
  id: string
  buyerId: string
  recipientId: string
  venueId: string
  items: string[]
  totalAmount: number
  status: 'pending' | 'accepted' | 'declined' | 'redeemed'
  createdAt: Date
  expiresAt: Date
}
```

---

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Database migrations run successfully
- [ ] Mobile app loads without errors
- [ ] Login works (demo or real OTP)
- [ ] Venues list loads from backend
- [ ] Can create new group
- [ ] Group persists after page refresh
- [ ] Can place order
- [ ] Order appears in backend database
- [ ] API docs work at `/api/docs`

---

## Performance Considerations

### Caching with Redis
- OTP codes stored in Redis (expires in 10 min)
- Session cache for fast lookups
- Rate limiting for API endpoints

### Database Queries
- Indexed columns for fast searches
- Pagination for venue/order lists
- N+1 query prevention with joins

### Frontend Performance
- Lazy loading of images
- List virtualization for long lists
- Memoization of expensive computations

---

## Security Checklist for Production

- [ ] Change JWT secrets in `.env`
- [ ] Set strong database password
- [ ] Enable HTTPS/SSL
- [ ] Set proper CORS origins (not `*`)
- [ ] Add rate limiting
- [ ] Enable request validation
- [ ] Set up error logging (Sentry)
- [ ] Configure firewall rules
- [ ] Use environment variables for secrets
- [ ] Implement CSRF protection

---

## Debugging Tips

### View All API Requests
Mobile app DevTools → Network tab → Filter by XHR

### View Database State
```powershell
psql -h localhost -U clubapp -d clubapp
\dt              # List all tables
SELECT * FROM "User";
SELECT * FROM "Group";
```

### View Backend Logs
```powershell
# Terminal where you ran npm run start:dev
# Will show all requests, errors, and database queries
```

### View Redis Logs
```powershell
docker logs -f clubapp-redis
```

---

## Next Steps

1. **Verify Setup**
   - Run: `docker ps`
   - Check both postgres and redis running

2. **Start Backend**
   - Run: `npm run start:dev`
   - Check: `http://localhost:3000/api/docs`

3. **Start Mobile**
   - Run: `npm run web`
   - Check: App loads without errors

4. **Test Auth**
   - Click Demo Login
   - Check Network tab for requests
   - Check AsyncStorage for tokens

5. **Test API Calls**
   - Create group
   - Refresh page
   - Group should still exist (persisted to DB)

6. **Monitor**
   - Keep backend logs open
   - Watch for errors
   - Check API responses in DevTools

---

## Support

For issues:
1. Check PRODUCTION_SETUP.md troubleshooting section
2. View backend logs: `npm run start:dev` terminal
3. Check Docker logs: `docker logs -f clubapp-postgres`
4. View mobile network requests: DevTools → Network tab
5. Query database: `psql` command

Happy integrating! 🚀
