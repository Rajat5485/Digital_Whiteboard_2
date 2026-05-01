# Video Call Testing Guide

## How to Test the Fixed Video Call Feature

### Prerequisites
1. Backend server running on correct port
2. Two or more browser windows/tabs
3. Camera and microphone permissions enabled

### Testing Steps

#### 1. **Start the Application**
```bash
# Terminal 1: Backend
cd Digital_Whiteboard/Backend
npm start

# Terminal 2: Frontend  
cd Digital_Whiteboard/frontend
npm run dev
```

#### 2. **Open Multiple Browser Instances**
- Open the frontend URL in 2-3 browser tabs/windows
- Each should show the joining classroom

#### 3. **Enable Camera**
- In each browser window, click "Video On" button
- Should see local camera feed appear in the "Video Call" section

#### 4. **Verify Video Streaming**
✅ Check for:
- Local video appears in main video area
- Remote user videos appear in separate sections
- User names displayed on each video feed
- Videos update in real-time as people move

#### 5. **Test Camera Toggle**
- Click "Video Off" to disable camera
- Should see "Your camera is off" message
- Click "Video On" again to re-enable
- Video should resume streaming

#### 6. **Test Multiple Users**
- With 3+ users all cameras on:
  - Each user should see their own video
  - Each user should see other users' videos
  - All videos should stream simultaneously

### Expected Behavior

✅ **Working Features:**
- Real-time video streaming between peers
- Automatic connection when camera is enabled
- Local video appears immediately
- Remote videos appear after WebRTC connection established
- Audio and video sync correctly
- Participant names visible on feeds

⚠️ **Common Issues & Solutions:**

| Issue | Cause | Solution |
|-------|-------|----------|
| No local video | Camera not enabled | Click "Video On" button |
| No remote video | Peer has camera off | Ask them to turn on camera |
| Delayed video | Network latency | Normal for remote peers, may take 1-2 seconds |
| Black screen | Permission denied | Check browser camera permissions |
| No audio | Microphone muted | Click "Mic On" button |

### Browser Console Debugging

Open browser DevTools (F12) and check Console for:
- `"Received remote track: video"` - indicates successful remote stream
- `"Connection state with [userId]: connected"` - indicates peer connection established
- Error messages - check for permission or network issues

### Network Requirements
- Low latency (<100ms) for best experience
- Minimum 1 Mbps upstream/downstream per user
- NAT traversal via STUN servers (Google's free servers included)

---

**Video Call is Now FIXED! 🎥✅**
