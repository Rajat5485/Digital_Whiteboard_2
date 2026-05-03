import { useRef, useEffect } from "react";

function RemoteVideo({ stream, label }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative shadow-md">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded-lg text-xs text-white font-medium">
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
  const activeCameraUsers = classUsers.filter((u) => u.cameraOn);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Video Call</h3>
        <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 font-semibold">
          {activeCameraUsers.length} active
        </span>
      </div>

      <div className="space-y-3">
        {/* Local Video */}
        {cameraOn && (
          <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative shadow-md">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded-lg text-xs text-white font-medium">
              {userName} (You)
            </div>
          </div>
        )}

        {/* Remote Videos */}
        {Array.from(remoteStreams.entries()).map(([remoteUserId, stream]) => {
          const remoteUser = classUsers.find((u) => u.userId === remoteUserId);
          if (!remoteUser?.cameraOn) return null;
          return (
            <RemoteVideo
              key={remoteUserId}
              stream={stream}
              label={remoteUser?.userName || remoteUserId}
            />
          );
        })}

        {/* Empty States */}
        {!cameraOn && remoteStreams.size === 0 && (
          <div className="py-6 flex flex-col items-center gap-2 text-center">
            <span className="text-2xl">📹</span>
            <p className="text-xs text-gray-500">Turn on your camera to join the video call</p>
          </div>
        )}
        {cameraOn && remoteStreams.size === 0 && (
          <div className="py-4 text-center">
            <p className="text-xs text-gray-500">Waiting for others to turn on camera...</p>
          </div>
        )}
      </div>
    </div>
  );
}