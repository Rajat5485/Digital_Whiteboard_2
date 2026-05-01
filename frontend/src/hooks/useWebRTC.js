import { useRef, useState, useEffect, useCallback } from "react";
import socket from "../services/socket";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export const useWebRTC = (classId, userId, userName, mediaStream) => {
  const peerConnectionsRef = useRef(new Map());
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [localStream, setLocalStream] = useState(null);

  // Set local stream when media stream changes
  useEffect(() => {
    setLocalStream(mediaStream);
  }, [mediaStream]);

  // Create or get peer connection
  const createPeerConnection = useCallback((remoteUserId) => {
    if (peerConnectionsRef.current.has(remoteUserId)) {
      return peerConnectionsRef.current.get(remoteUserId);
    }

    const peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Add local stream tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          classId,
          to: remoteUserId,
          candidate: event.candidate,
        });
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      setRemoteStreams((prev) => {
        const updated = new Map(prev);
        const streams = updated.get(remoteUserId) || [];
        if (!streams.some((s) => s.id === event.streams[0].id)) {
          updated.set(remoteUserId, [...streams, event.streams[0]]);
        }
        return updated;
      });
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(
        `Connection state with ${remoteUserId}:`,
        peerConnection.connectionState
      );
      if (
        peerConnection.connectionState === "failed" ||
        peerConnection.connectionState === "disconnected"
      ) {
        closePeerConnection(remoteUserId);
      }
    };

    peerConnectionsRef.current.set(remoteUserId, peerConnection);
    return peerConnection;
  }, [localStream, classId]);

  // Create and send offer
  const createOffer = useCallback(async (remoteUserId) => {
    try {
      const peerConnection = createPeerConnection(remoteUserId);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socket.emit("offer", {
        classId,
        from: userId,
        fromName: userName,
        to: remoteUserId,
        offer: offer,
      });
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  }, [createPeerConnection, classId, userId, userName]);

  // Handle incoming offer
  const handleOffer = useCallback(
    async ({ from, fromName, offer }) => {
      try {
        const peerConnection = createPeerConnection(from);
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit("answer", {
          classId,
          from: userId,
          to: from,
          answer: answer,
        });
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    },
    [createPeerConnection, classId, userId]
  );

  // Handle incoming answer
  const handleAnswer = useCallback(
    async ({ from, answer }) => {
      try {
        const peerConnection = peerConnectionsRef.current.get(from);
        if (peerConnection) {
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
        }
      } catch (error) {
        console.error("Error handling answer:", error);
      }
    },
    []
  );

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async ({ from, candidate }) => {
    try {
      const peerConnection = peerConnectionsRef.current.get(from);
      if (peerConnection && candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  }, []);

  // Close peer connection
  const closePeerConnection = useCallback((remoteUserId) => {
    const peerConnection = peerConnectionsRef.current.get(remoteUserId);
    if (peerConnection) {
      peerConnection.close();
      peerConnectionsRef.current.delete(remoteUserId);
    }

    setRemoteStreams((prev) => {
      const updated = new Map(prev);
      updated.delete(remoteUserId);
      return updated;
    });
  }, []);

  // Close all connections
  const closeAllConnections = useCallback(() => {
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    setRemoteStreams(new Map());
  }, []);

  // Setup socket listeners
  useEffect(() => {
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [handleOffer, handleAnswer, handleIceCandidate]);

  // Cleanup on unmount or class change
  useEffect(() => {
    return () => {
      closeAllConnections();
    };
  }, [closeAllConnections]);

  return {
    localStream,
    remoteStreams,
    createOffer,
    closePeerConnection,
    closeAllConnections,
  };
};

export default useWebRTC;
