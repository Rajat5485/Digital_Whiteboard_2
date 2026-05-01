# Attendance Feature - Integration Guide

## Quick Start

### Step 1: Update Whiteboard.jsx
Add the AttendanceTracker component to your Whiteboard page:

```jsx
// In Whiteboard.jsx, add this import:
import AttendanceTracker from "../components/AttendanceTracker";

// Get classId from params or context - example:
import { useParams } from "react-router-dom";

export default function Whiteboard() {
  const { classId } = useParams(); // or get from context
  
  // ... rest of component
  
  return (
    <div className="...">
      {/* Add this section for attendance tracking */}
      {classId && (
        <div className="rounded-2xl border border-white/20 bg-white/95 p-4 shadow-2xl mb-4">
          <AttendanceTracker classId={classId} />
        </div>
      )}
      
      {/* Rest of your whiteboard content */}
    </div>
  );
}
```

### Step 2: Add Navigation Link
Update your navigation to include attendance page:

```jsx
// In your Navigation/Header component:
<Link to="/attendance" className="...">
  📊 My Attendance
</Link>
```

### Step 3: Add Route
Update your Router configuration:

```jsx
// In App.jsx or your routing file:
import Attendance from "./pages/Attendance";

// Add this route:
<Route path="/attendance" element={<Attendance />} />
```

### Step 4: Verify API Base URL
Ensure your `.env` file has:
```
VITE_API_URL=http://localhost:5000/api
```

Or update `AttendanceTracker.jsx` with correct API URL if needed.

## File Structure
```
Frontend/
├── src/
│   ├── components/
│   │   ├── AttendanceTracker.jsx (NEW)
│   │   └── AttendanceSummary.jsx (NEW)
│   ├── pages/
│   │   ├── Whiteboard.jsx (UPDATED)
│   │   └── Attendance.jsx (NEW)
│   └── App.jsx (UPDATED - add route)
├── vite.config.js (Already exists)
└── package.json (Already exists - ensure axios is installed)

Backend/
├── models/
│   └── Attendance.js (UPDATED)
├── controllers/
│   └── attendanceController.js (UPDATED)
├── routes/
│   └── attendanceRoutes.js (UPDATED)
└── server.js (Should already import attendance routes)
```

## Backend Integration Checklist

- [x] Update Attendance model with new fields
- [x] Update attendanceController with new logic
- [x] Update attendanceRoutes with new endpoints
- [ ] Ensure routes are imported in server.js

### Verify server.js imports attendance routes:
```javascript
import attendanceRoutes from "./routes/attendanceRoutes.js";

// In your routes setup:
app.use("/api/attendance", attendanceRoutes);
```

## Testing Checklist

### Local Testing
1. Start backend: `npm start` (from Backend folder)
2. Start frontend: `npm run dev` (from frontend folder)
3. Create a classroom and get the classId
4. Open classroom as student
5. AttendanceTracker should appear
6. Wait 10 minutes or adjust minimumTimeRequired for testing
7. Click "Mark Attendance"
8. Check `/attendance` page to see record

### Tab Focus Testing
1. Open classroom page
2. Check indicator shows "🟢 Tab Active"
3. Switch to another tab
4. Indicator should show "🔴 Tab Inactive"
5. Timer for active time should stop incrementing
6. Switch back to original tab
7. Timer should resume

### Time Update Testing
1. Check network tab in browser dev tools
2. Every 30 seconds, POST to `/attendance/update-time` should occur
3. No errors in console

## Customization

### Change Minimum Time
Edit both files to change 10 minutes to desired duration:

**Backend** - `attendanceController.js`:
```javascript
const minimumTimeRequired = 600; // Change 600 to seconds needed (e.g., 300 for 5 min)
```

**Frontend** - `AttendanceTracker.jsx`:
```javascript
const minimumTimeRequired = 600; // Same value
```

### Styling
- Uses Tailwind CSS (already in your project)
- Customize colors and layout in component files
- Responsive design included

## Common Issues

### "Attendance already marked today"
- Expected behavior: Students can only mark attendance once per day per class
- Solution: Reset the date or wait until next day

### API requests returning 401
- Ensure token is saved in localStorage with key "token"
- Verify authMiddleware is working in other routes
- Check token expiration

### Timer not updating
- Check if tab is focused (should see 🟢 indicator)
- Verify browser dev tools console for errors
- Check API_URL in component matches backend

### AttendanceTracker component not appearing
- Verify classId is being passed correctly
- Check component is imported correctly
- Check for JavaScript errors in console

## Environment Variables

Create `.env` file in frontend root (if not exists):
```
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Digital Whiteboard
```

## Next Steps

1. Test basic functionality
2. Adjust minimum time requirement as needed
3. Customize UI/styling to match your design
4. Add admin dashboard for teacher attendance reports
5. Consider adding geolocation or face detection in future

## Support

For issues or questions:
1. Check browser console for errors
2. Check backend server logs
3. Verify network requests in dev tools
4. Review database records directly
