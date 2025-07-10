import { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";

const useWebRTC = ({ localUserId, remoteUserId, remoteAudioRef }) => {
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const signalingRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  const setSignaling = (sig) => {
    signalingRef.current = sig;
  };

  const setupPeerEvents = (peer) => {
    peer.on("signal", (data) => {
      console.log("📤 Peer emitting signal:", data);
      signalingRef.current?.sendSignal({
        signal: data,
        to: remoteUserId,
        from: localUserId,
      });
    });

    peer.on("stream", (remoteStream) => {
      if (remoteAudioRef?.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    });

    peer.on("connect", () => {
      setIsConnected(true);
      console.log("✅ WebRTC connection established");
    });

    peer.on("error", (err) => {
      console.error("❌ Peer error:", err);
    });

    peer.on("close", () => {
      console.log("❌ WebRTC connection closed");
      setIsConnected(false);
      peerRef.current = null;
    });
  };

  const createPeer = async ({ initiator, signal = null }) => {
    if (peerRef.current) return peerRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;

    const peer = new Peer({
      initiator,
      trickle: true,
      stream,
    });

    peerRef.current = peer;

    setupPeerEvents(peer);

    if (signal) {
      peer.signal(signal);
    }

    return peer;
  };

  const startCall = async () => {
    if (!remoteUserId) {
      console.error("❌ No remote user to call.");
      return;
    }

    await createPeer({ initiator: true });
  };

  const acceptCall = async (signal) => {
    await createPeer({ initiator: false, signal }); // <- Unified handling
  };

  const handleSignal = (signal) => {
    console.log("📥 Handling incoming signal:", signal);
    if (!peerRef.current) {
      console.warn("⚠️ Peer not ready. Ignoring signal.");
      return;
    }

    try {
      peerRef.current.signal(signal);
    } catch (err) {
      console.error("❌ Failed to apply signal:", err);
    }
  };

  const cleanup = () => {
    if (peerRef.current) peerRef.current.destroy();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    peerRef.current = null;
    localStreamRef.current = null;
    setIsConnected(false);
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return {
    startCall,
    acceptCall,
    handleSignal,
    setSignaling,
    isConnected,
    remoteAudio: remoteAudioRef,
    cleanup,
  };
};

export default useWebRTC;
