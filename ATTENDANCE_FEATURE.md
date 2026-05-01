# Advanced Attendance Feature Documentation

## Overview
The advanced attendance system tracks user presence in the classroom with the following features:
- **Minimum Time Requirement**: 10 minutes (600 seconds) of active tab time required
- **Tab Focus Detection**: Only counts time when the browser tab is in focus
- **Real-time Tracking**: Updates every 30 seconds
- **Detailed Analytics**: Track total time, active time, and attendance status

## Features

### 1. Tab Focus Detection
- Automatically detects when the user switches away from the tab
- Only counts active time when the tab is focused
- Shows real-time status indicator

### 2. Time Tracking
- **Total Time**: Time from joining the session (regardless of tab focus)
- **Active Time**: Time spent with tab in focus
- **Minimum Requirement**: 10 minutes (configurable)

### 3. Attendance Status
- Attendance is only marked when minimum time is met
- Prevents false attendance marking
- Shows clear progress indication

### 4. Real-time Updates
- Sends updates to server every 30 seconds
- Ensures data is saved even if connection drops
- Automatic recovery on reconnection

## Backend API Endpoints

### Mark Attendance
**POST** `/api/attendance/mark`
```json
{
  "classId": "64f7a1b2c3d4e5f6g7h8i9j0",
  "tabActiveDuration": 600,
  "activeTime": 720
}
```

**Response:**
```json
{
  "message": "Attendance marked successfully",
  "attendance": {
    "_id": "...",
    "user": "...",
    "classId": "...",
    "date": "2024-04-30",
    "joinTime": "2024-04-30T10:00:00Z",
    "activeTime": 720,
    "tabActiveDuration": 600,
    "marked": true,
    "minimumTimeMet": true
  },
  "minimumTimeMet": true
}
```

### Update Attendance Time
**POST** `/api/attendance/update-time`
- Called every 30 seconds to sync time
- Same request format as mark attendance

### Get User Attendance
**GET** `/api/attendance/my-attendance`

**Response:**
```json
{
  "records": [...],
  "summary": {
    "totalPresent": 15,
    "totalAbsent": 2,
    "totalSessions": 17
  }
}
```

### Get All Attendance (Teacher)
**GET** `/api/attendance?classId=64f7a1b2c3d4e5f6g7h8i9j0`

## Frontend Components

### AttendanceTracker
```jsx
<AttendanceTracker classId={classId} />
```
- Shows real-time timer
- Displays tab status
- Marks attendance when criteria met
- Handles all API communication

### AttendanceSummary
```jsx
<AttendanceSummary />
```
- Shows user's attendance records
- Displays summary statistics
- Calculates attendance percentage
- Shows detailed table with all sessions

## Database Schema

```javascript
{
  user: ObjectId,              // Reference to User
  classId: ObjectId,           // Reference to Classroom
  date: String,                // YYYY-MM-DD format
  joinTime: Date,              // When user joined
  activeTime: Number,          // Total seconds (with/without focus)
  tabActiveDuration: Number,   // Seconds with tab focused
  marked: Boolean,             // Whether attendance is marked
  minimumTimeMet: Boolean,     // Whether minimum time requirement met
  minimumTimeRequired: Number  // Configurable (default: 600 seconds)
}
```

## Configuration

### Minimum Time Required
Default: 600 seconds (10 minutes)

To change, modify in:
1. **Backend** - `attendanceController.js`: `const minimumTimeRequired = 600;`
2. **Frontend** - `AttendanceTracker.jsx`: `const minimumTimeRequired = 600;`

### Update Interval
Default: 30 seconds (every 30 seconds data is synced to server)

To change, modify in `AttendanceTracker.jsx`:
```javascript
const updateInterval = setInterval(async () => {
  // ...
}, 30000); // Change 30000 to desired milliseconds
```

## Usage Instructions

### For Students
1. Open the Whiteboard/Classroom page
2. The Attendance Tracker appears automatically
3. Stay in the tab for at least 10 minutes
4. Once the minimum time is met, click "Mark Attendance"
5. View your attendance history in the Attendance page

### For Teachers
1. Visit the Attendance page
2. Filter by class to see all student records
3. View attendance statistics and percentages
4. Identify students who haven't met minimum time

## Integration Steps

1. **Add to Whiteboard Page** (Whiteboard.jsx):
```jsx
import AttendanceTracker from "../components/AttendanceTracker";

// In component:
<AttendanceTracker classId={classId} />
```

2. **Add Attendance Route** (in your router):
```jsx
import Attendance from "../pages/Attendance";

<Route path="/attendance" element={<Attendance />} />
```

3. **Install Dependencies** (if needed):
```bash
npm install axios
```

## Security Considerations

1. **Tab Focus Detection**: Uses browser visibility API (cannot be bypassed)
2. **Server-side Validation**: Minimum time is validated on server
3. **Token Authentication**: All requests require valid JWT token
4. **Data Integrity**: Multiple syncs prevent data loss
5. **Real-time Updates**: Server validates time during updates

## Troubleshooting

### Attendance not counting
- Ensure tab is in focus (check status indicator)
- Check if minimum time is met
- Verify network connection

### Time not updating
- Check browser console for errors
- Verify API endpoint is accessible
- Check authentication token

### Cannot mark attendance
- Minimum time requirement not met
- Attendance already marked for today
- Network connection issue

## Future Enhancements

1. **Configurable Minimum Time**: Admin panel to set per-class minimum time
2. **Geolocation Verification**: GPS check to ensure physical presence
3. **Face Detection**: Optional face recognition for verification
4. **Session Analytics**: Detailed analytics dashboard for teachers
5. **Attendance Reports**: Downloadable reports in PDF/CSV format
6. **Mobile App**: Native mobile app with background detection

