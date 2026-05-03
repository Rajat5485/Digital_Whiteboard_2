import { useState, useRef, useEffect, useCallback } from "react";
import socket from "../services/socket";

export default function useVideoCall({ classId, userId, userName, classUsers }) {
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());

  const localVideoRef = useRef(null);
  const peerConnections = useRef(new Map());
  const remoteVideoRefs = useRef(new Map());

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
      const pc = createPeerConnection(remoteUserId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtc-offer", { classId, to: remoteUserId, offer });
    },
    [classId, createPeerConnection]
  );

  useEffect(() => {
    const handleOffer = async ({ from, offer }) => {
      const pc = createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc-answer", { classId, to: from, answer });
    };

    const handleAnswer = async ({ from, answer }) => {
      const pc = peerConnections.current.get(from);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIceCandidate = async ({ from, candidate }) => {
      const pc = peerConnections.current.get(from);
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
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

  useEffect(() => {
    if (cameraOn && mediaStream && localVideoRef.current) {
      localVideoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, cameraOn]);

  useEffect(() => {
    if (!classId || !userId || classUsers.length === 0) return;
    classUsers.forEach((user) => {
      if (user.userId !== userId) createOffer(user.userId);
    });
  }, [classUsers, classId, userId, createOffer]);

  const toggleMic = useCallback(async () => {
    const next = !micOn;
    const stream = await updateMediaStream(next, cameraOn);
    if (stream !== undefined) {
      setMicOn(next);
      if (classId) socket.emit("media-state", { classId, micOn: next, cameraOn });
    }
  }, [micOn, cameraOn, classId, updateMediaStream]);

  const toggleCamera = useCallback(async () => {
    const next = !cameraOn;
    const stream = await updateMediaStream(micOn, next);
    if (stream !== undefined) {
      setCameraOn(next);
      if (classId) socket.emit("media-state", { classId, micOn, cameraOn: next });
    }
  }, [micOn, cameraOn, classId, updateMediaStream]);

  return {
    micOn,
    cameraOn,
    mediaStream,
    localVideoRef,
    remoteStreams,
    remoteVideoRefs,
    toggleMic,
    toggleCamera,
  };
}