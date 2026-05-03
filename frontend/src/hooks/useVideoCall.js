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
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  const updateMediaStream = useCallback(async (nextMic, nextCamera) => {
    try {
      if (nextMic || nextCamera) {
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
        setMediaStream((prev) => {
          if (prev) prev.getTracks().forEach((t) => t.stop());
          return null;
        });
        return null;
      }
    } catch (err) {
      console.warn("Media access failed", err);
      return null;
    }
  }, []);

  const createPeerConnection = useCallback(
    (remoteUserId) => {
      if (peerConnections.current.has(remoteUserId)) {
        return peerConnections.current.get(remoteUserId);
      }

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
        setRemoteStreams((prev) => {
          const updated = new Map(prev);
          updated.set(remoteUserId, event.streams[0]);
          return updated;
        });
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
        const pc = createPeerConnection(remoteUserId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc-offer", { classId, to: remoteUserId, offer });
      } catch (err) {
        console.error("Offer creation failed", err);
      }
    },
    [classId, createPeerConnection]
  );

  useEffect(() => {
    const handleOffer = async ({ from, offer }) => {
      try {
        const pc = createPeerConnection(from);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        // Add any pending candidates
        if (pendingCandidates.current.has(from)) {
          const candidates = pendingCandidates.current.get(from);
          for (const cand of candidates) await pc.addIceCandidate(new RTCIceCandidate(cand));
          pendingCandidates.current.delete(from);
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", { classId, to: from, answer });
      } catch (err) {
        console.error("Handle offer failed", err);
      }
    };

    const handleAnswer = async ({ from, answer }) => {
      try {
        const pc = peerConnections.current.get(from);
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error("Handle answer failed", err);
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
        console.error("Handle ICE candidate failed", err);
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
            sender.replaceTrack(track);
          } else {
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

  // Initiate calls to others (only if my userId is smaller to avoid glare)
  useEffect(() => {
    if (!classId || !userId || classUsers.length === 0) return;
    classUsers.forEach((user) => {
      if (user.userId !== userId && userId < user.userId) {
        createOffer(user.userId);
      }
    });
  }, [classUsers.length, classId, userId, createOffer]);

  const toggleMic = useCallback(async () => {
    const next = !micOn;
    const stream = await updateMediaStream(next, cameraOn);
    setMicOn(next);
    if (classId) socket.emit("media-state", { classId, micOn: next, cameraOn });
  }, [micOn, cameraOn, classId, updateMediaStream]);

  const toggleCamera = useCallback(async () => {
    const next = !cameraOn;
    const stream = await updateMediaStream(micOn, next);
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