import { useEffect, useRef, useState } from "react";

const useWebRTC = ({ localUserId, remoteUserId, remoteAudioRef }) => {
  const pc = useRef(null);
  const localStream = useRef(null);
  const remoteAudio = remoteAudioRef || useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const signalingRef = useRef(null);

  const setSignaling = (sig) => {
    signalingRef.current = sig;
  };

  useEffect(() => {
    pc.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.current.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteAudio.current) {
        remoteAudio.current.srcObject = remoteStream;
      }
    };

    pc.current.onicecandidate = (event) => {
      if (event.candidate && signalingRef.current) {
        signalingRef.current.sendCandidate(event.candidate);
      }
    };

    return () => {
      pc.current?.close();
    };
    // Only run once
    // eslint-disable-next-line
  }, []);

  const startCall = async () => {
    localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStream.current.getTracks().forEach((track) => {
      pc.current.addTrack(track, localStream.current);
    });

    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);

    if (signalingRef.current) {
      signalingRef.current.sendOffer(offer);
    } else {
      console.error("Signaling not set, cannot send offer");
    }
  };

  const handleOffer = async (offer) => {
    localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStream.current.getTracks().forEach((track) => {
      pc.current.addTrack(track, localStream.current);
    });

    await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.current.createAnswer();
    await pc.current.setLocalDescription(answer);

    if (signalingRef.current) {
      signalingRef.current.sendAnswer(answer);
    } else {
      console.error("Signaling not set, cannot send answer");
    }
  };

  const handleAnswer = async (answer) => {
    await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
    setIsConnected(true);
  };

  const handleCandidate = async (candidate) => {
    try {
      await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error("Error adding received ice candidate", e);
    }
  };

  return {
    startCall,
    handleOffer,
    handleAnswer,
    handleCandidate,
    remoteAudio,
    setSignaling,
    isConnected,
  };
};

export default useWebRTC;