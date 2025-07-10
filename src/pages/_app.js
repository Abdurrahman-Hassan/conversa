import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../styles/globals.css";
import { useEffect, useRef, useState } from "react";
import useWebRTC from "@/hooks/useWebRTC";
import useCallSignaling from "@/hooks/useCallSignaling";
import supabase from "@/utils/supabase";

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }) {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [incomingChat, setIncomingChat] = useState(null);
  const [incomingOffer, setIncomingOffer] = useState(null);

  const remoteAudioRef = useRef(null);

  // 1. Create webrtc without signaling
  const webrtc = useWebRTC({
    localUserId: currentUserId,
    remoteUserId: incomingChat?.user_id,
    remoteAudioRef,
  });

  // 2. Create signaling with webrtc handlers
  const signaling = useCallSignaling({
    roomId: incomingChat
      ? `call-${[currentUserId, incomingChat.user_id].sort().join("-")}`
      : null,
    userId: currentUserId,
    onOffer: (offerPayload) => {
      console.log("🔔 Incoming offer:", offerPayload);
      setIncomingOffer(offerPayload);
      setIncomingChat(offerPayload.meta); // Make sure meta is sent when calling
    },
    onAnswer: webrtc.handleAnswer,
    onCandidate: webrtc.handleCandidate,
  });

  // 3. Inject signaling into webrtc after both are created
  useEffect(() => {
    if (signaling) webrtc.setSignaling(signaling);
  }, [signaling]);

  // 4. Get current user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getUser();
  }, []);

  const acceptCall = async () => {
    if (incomingOffer) {
      await webrtc.handleOffer(incomingOffer);
      setIncomingOffer(null);
    }
  };

  const declineCall = () => {
    setIncomingOffer(null);
    setIncomingChat(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />

      {/* Global Incoming Call Popup */}
      {incomingOffer && incomingChat && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg border-4 border-black space-y-4 shadow-xl">
            <h2 className="text-lg font-bold">📞 Incoming Call</h2>
            <p>{incomingChat.users?.user_name || "Unknown User"} is calling you.</p>
            <div className="flex justify-end space-x-2">
              <button onClick={acceptCall} className="px-4 py-2 bg-green-600 text-white font-bold border-2 border-black hover:bg-green-800">Accept</button>
              <button onClick={declineCall} className="px-4 py-2 bg-red-600 text-white font-bold border-2 border-black hover:bg-red-800">Decline</button>
            </div>
          </div>
          {/* Hidden audio */}
          <audio ref={remoteAudioRef} autoPlay className="hidden" />
        </div>
      )}
    </QueryClientProvider>
  );
}

export default MyApp;