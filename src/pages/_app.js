import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../styles/globals.css";
import { useEffect, useRef, useState, useMemo } from "react";
import useWebRTC from "@/hooks/useWebRTC";
import supabase from "@/utils/supabase";
import createCallSignaling from "@/utils/createCallSignaling";

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }) {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [incomingChat, setIncomingChat] = useState(null);
  const [incomingSignal, setIncomingSignal] = useState(null);

  const remoteAudioRef = useRef(null);
  const signalingRef = useRef(null);

  const remoteUserId = incomingChat?.user_id || null;

  const roomId = `call-${[currentUserId, "someDefaultReceiverId"].sort().join("-")}`;

  const webrtc = useWebRTC({
    localUserId: currentUserId,
    remoteUserId,
    remoteAudioRef,
  });

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("❌ Failed to get user:", error);
        return;
      }
      if (data?.user?.id) {
        setCurrentUserId(data.user.id);
      }
    };
    fetchUser();
  }, []);

  // Setup signaling when roomId becomes available
  useEffect(() => {
    if (!roomId || !currentUserId) return;

    const signaling = createCallSignaling({
      roomId,
      userId: currentUserId,
      onSignal: (signal) => {
        console.log("📡 Incoming signal (global handler):", signal);

        if (signal?.type === "offer") {
          console.log("🛎️ Offer detected, initializing peer & showing popup");

          webrtc.acceptCall(signal); // ← initialize peer silently
          setIncomingSignal(signal); // ← show accept UI
          setIncomingChat({ user_id: signal.from });
        } else {
          webrtc.handleSignal(signal); // ← ICE candidates etc.
        }
      },

    });


    signalingRef.current = signaling;
    webrtc.setSignaling(signaling);

    return () => {
      signaling.destroy?.();
    };
  }, [roomId, currentUserId]);

  // Accept/Decline controls
  const acceptCall = async () => {
    if (incomingSignal) {
      await webrtc.acceptCall(incomingSignal);
      setIncomingSignal(null);
    }
  };

  const declineCall = () => {
    setIncomingSignal(null);
    setIncomingChat(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />

      {/* Global Incoming Call UI */}
      {incomingSignal && incomingChat && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg border-4 border-black space-y-4 shadow-xl">
            <h2 className="text-lg font-bold">📞 Incoming Call</h2>
            <p>{incomingChat.users?.user_name || "Unknown User"} is calling you.</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={acceptCall}
                className="px-4 py-2 bg-green-600 text-white font-bold border-2 border-black hover:bg-green-800"
              >
                Accept
              </button>
              <button
                onClick={declineCall}
                className="px-4 py-2 bg-red-600 text-white font-bold border-2 border-black hover:bg-red-800"
              >
                Decline
              </button>
            </div>
          </div>
          <audio ref={remoteAudioRef} autoPlay className="hidden" />
        </div>
      )}
    </QueryClientProvider>
  );
}

export default MyApp;
