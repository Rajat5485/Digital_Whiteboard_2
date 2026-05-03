import { useState, useRef, useEffect, useCallback } from "react";
import socket from "../services/socket";

export default function useVideoCall({ classId, userId, userName, classUsers }) {
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());

  const localVideoRef = useRef(null);
  const peerConnections = useRef(new Map());
  const pendingCandidates = useRef(new Map());

  const ICE_SERVERS = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  const updateMediaStream = useCallback(async (nextMic, nextCamera) => {
    try {
      if (nextMic || nextCamera) {
        console.log(`[VideoCall] Requesting media: mic=${nextMic}, cam=${nextCamera}`);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: nextMic,
          video: nextCamera,
        });
        setMediaStream((prev) => {
          if (prev) prev.getTracks().forEach((t) => t.stop());
          return stream;
        });
        return stream;
      } else {
        console.log("[VideoCall] Stopping all media tracks");
        setMediaStream((prev) => {
          if (prev) prev.getTracks().forEach((t) => t.stop());
          return null;
        });
        return null;
      }
    } catch (err) {
      console.warn("[VideoCall] Media access failed", err);
      return null;
    }
  }, []);

  const createPeerConnection = useCallback(
    (remoteUserId) => {
      if (peerConnections.current.has(remoteUserId)) {
        return peerConnections.current.get(remoteUserId);
      }

      console.log(`[VideoCall] Creating RTCPeerConnection for user: ${remoteUserId}`);
      const pc = new RTCPeerConnection(ICE_SERVERS);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            classId,
            to: remoteUserId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        console.log(`[VideoCall] Received remote track from ${remoteUserId}:`, event.track.kind);
        setRemoteStreams((prev) => {
          const updated = new Map(prev);
          updated.set(remoteUserId, event.streams[0]);
          return updated;
        });
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`[VideoCall] Connection state with ${remoteUserId}: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
          // Optional: handle cleanup or retry
        }
      };

      // Renegotiation handling
      pc.onnegotiationneeded = async () => {
        try {
          console.log(`[VideoCall] Negotiation needed for ${remoteUserId}`);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc-offer", { classId, to: remoteUserId, offer });
        } catch (err) {
          console.error("[VideoCall] Renegotiation failed", err);
        }
      };

      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => pc.addTrack(track, mediaStream));
      }

      peerConnections.current.set(remoteUserId, pc);
      return pc;
    },
    [classId, mediaStream]
  );

  const createOffer = useCallback(
    async (remoteUserId) => {
      try {
        console.log(`[VideoCall] Initiating offer to ${remoteUserId}`);
        const pc = createPeerConnection(remoteUserId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc-offer", { classId, to: remoteUserId, offer });
      } catch (err) {
        console.error("[VideoCall] Offer creation failed", err);
      }
    },
    [classId, createPeerConnection]
  );

  useEffect(() => {
    const handleOffer = async ({ from, offer }) => {
      try {
        console.log(`[VideoCall] Received offer from ${from}`);
        const pc = createPeerConnection(from);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        // Add any pending candidates
        if (pendingCandidates.current.has(from)) {
          const candidates = pendingCandidates.current.get(from);
          console.log(`[VideoCall] Draining ${candidates.length} pending candidates for ${from}`);
          for (const cand of candidates) await pc.addIceCandidate(new RTCIceCandidate(cand));
          pendingCandidates.current.delete(from);
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", { classId, to: from, answer });
      } catch (err) {
        console.error("[VideoCall] Handle offer failed", err);
      }
    };

    const handleAnswer = async ({ from, answer }) => {
      try {
        console.log(`[VideoCall] Received answer from ${from}`);
        const pc = peerConnections.current.get(from);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          
          // Drain pending candidates after setting remote description
          if (pendingCandidates.current.has(from)) {
            const candidates = pendingCandidates.current.get(from);
            console.log(`[VideoCall] Draining ${candidates.length} pending candidates for ${from}`);
            for (const cand of candidates) await pc.addIceCandidate(new RTCIceCandidate(cand));
            pendingCandidates.current.delete(from);
          }
        }
      } catch (err) {
        console.error("[VideoCall] Handle answer failed", err);
      }
    };

    const handleIceCandidate = async ({ from, candidate }) => {
      try {
        const pc = peerConnections.current.get(from);
        if (pc && pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          if (!pendingCandidates.current.has(from)) pendingCandidates.current.set(from, []);
          pendingCandidates.current.get(from).push(candidate);
        }
      } catch (err) {
        console.error("[VideoCall] Handle ICE candidate failed", err);
      }
    };

    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [classId, createPeerConnection]);

  // Sync tracks with existing peer connections when stream changes
  useEffect(() => {
    if (mediaStream) {
      peerConnections.current.forEach((pc) => {
        const senders = pc.getSenders();
        mediaStream.getTracks().forEach((track) => {
          const sender = senders.find((s) => s.track && s.track.kind === track.kind);
          if (sender) {
            console.log(`[VideoCall] Replacing ${track.kind} track`);
            sender.replaceTrack(track);
          } else {
            console.log(`[VideoCall] Adding ${track.kind} track`);
            pc.addTrack(track, mediaStream);
          }
        });
      });
    }
  }, [mediaStream]);

  useEffect(() => {
    if (cameraOn && mediaStream && localVideoRef.current) {
      localVideoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, cameraOn]);

  // Cleanup disconnected peers
  useEffect(() => {
    const currentRemoteUserIds = new Set(classUsers.map((u) => u.userId));
    
    // Cleanup PeerConnections
    peerConnections.current.forEach((pc, rId) => {
      if (!currentRemoteUserIds.has(rId)) {
        console.log(`[VideoCall] Cleaning up connection for user: ${rId}`);
        pc.close();
        peerConnections.current.delete(rId);
        pendingCandidates.current.delete(rId);
      }
    });

    // Cleanup Remote Streams
    setRemoteStreams((prev) => {
      const updated = new Map(prev);
      let changed = false;
      updated.forEach((_, rId) => {
        if (!currentRemoteUserIds.has(rId)) {
          updated.delete(rId);
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [classUsers, userId]);

  // Initiate calls to others
  useEffect(() => {
    if (!classId || !userId || classUsers.length === 0) return;
    
    classUsers.forEach((user) => {
      // Avoid calling ourselves and ensure only one peer initiates (smaller ID calls larger ID)
      if (user.userId !== userId && userId < user.userId) {
        // Only initiate if connection doesn't exist
        if (!peerConnections.current.has(user.userId)) {
          createOffer(user.userId);
        }
      }
    });
  }, [classUsers, classId, userId, createOffer]);

  const toggleMic = useCallback(async () => {
    const next = !micOn;
    await updateMediaStream(next, cameraOn);
    setMicOn(next);
    if (classId) socket.emit("media-state", { classId, micOn: next, cameraOn });
  }, [micOn, cameraOn, classId, updateMediaStream]);

  const toggleCamera = useCallback(async () => {
    const next = !cameraOn;
    await updateMediaStream(micOn, next);
    setCameraOn(next);
    if (classId) socket.emit("media-state", { classId, micOn, cameraOn: next });
  }, [micOn, cameraOn, classId, updateMediaStream]);

  return {
    micOn,
    cameraOn,
    mediaStream,
    localVideoRef,
    remoteStreams,
    toggleMic,
    toggleCamera,
  };
}