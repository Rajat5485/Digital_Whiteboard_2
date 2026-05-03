import { useRef, useEffect } from "react";

function VideoPlaceholder({ name }) {
  return (
    <div className="aspect-video bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex flex-col items-center justify-center shadow-md border border-white/20">
      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold mb-2 backdrop-blur-sm">
        {name.charAt(0).toUpperCase()}
      </div>
      <p className="text-[10px] text-white/80 font-medium uppercase tracking-wider">{name}</p>
    </div>
  );
}

function RemoteVideo({ stream, label }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative shadow-md border border-gray-200">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-lg text-[10px] text-white font-medium backdrop-blur-sm">
        {label}
      </div>
    </div>
  );
}

export default function VideoCallPanel({
  cameraOn,
  localVideoRef,
  remoteStreams,
  classUsers,
  userId,
  userName,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Class Video Feed</h3>
        <span className="text-[10px] px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 font-bold uppercase">
          {classUsers.length} Online
        </span>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
        {/* All Class Participants */}
        {classUsers.map((user) => {
          const isMe = user.userId === userId;
          
          if (isMe) {
            return (
              <div key={user.userId} className="relative">
                {cameraOn ? (
                  <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative shadow-md border border-indigo-400">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-indigo-600 px-2 py-1 rounded-lg text-[10px] text-white font-bold backdrop-blur-sm">
                      {userName} (You)
                    </div>
                  </div>
                ) : (
                  <VideoPlaceholder name={`${userName} (You)`} />
                )}
              </div>
            );
          }

          // Remote User
          const stream = remoteStreams.get(user.userId);
          const hasVideo = user.cameraOn && stream;

          return (
            <div key={user.userId} className="relative">
              {hasVideo ? (
                <RemoteVideo stream={stream} label={user.userName} />
              ) : (
                <VideoPlaceholder name={user.userName} />
              )}
            </div>
          );
        })}

        {classUsers.length === 0 && (
          <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-xs text-gray-400 italic">No one else in class yet</p>
          </div>
        )}
      </div>
    </div>
  );
}