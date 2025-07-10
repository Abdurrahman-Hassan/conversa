import { useRef, useEffect, useMemo } from "react";
import useWebRTC from "@/hooks/useWebRTC";
import createCallSignaling from "@/utils/createCallSignaling";

const UserProfilePopup = ({ chat, onClose, currentUserId }) => {
    const remoteUserId = chat?.user_id;

    const roomId = useMemo(() => {
        if (!currentUserId || !remoteUserId) return null;
        return `call-${[currentUserId, remoteUserId].sort().join("-")}`;
    }, [currentUserId, remoteUserId]);

    const remoteAudioRef = useRef(null);
    const signalingRef = useRef(null);

    // WebRTC setup
    const webrtc = useWebRTC({
        localUserId: currentUserId,
        remoteUserId,
        remoteAudioRef,
    });

    // Setup signaling
    useEffect(() => {
        if (!roomId || !currentUserId) return;

        const signaling = createCallSignaling({
            roomId,
            userId: currentUserId,

            onSignal: (signal) => {
                console.log("📡 Incoming signal (UserProfilePopup):", signal);

                // 🚫 Ignore offer — we're the initiator here
                if (signal?.type === "offer") return;

                // ✅ Accept answer/candidates
                webrtc.peer?.signal?.(signal);
            },
        });

        signalingRef.current = signaling;
        webrtc.setSignaling(signaling);

        return () => {
            signaling.destroy?.();
        };
    }, [roomId, currentUserId]);

    // Peer + audio cleanup
    useEffect(() => {
        return () => {
            webrtc.cleanup?.();
        };
    }, []);

    // 🔔 Start call
    const handleCall = async () => {
        await webrtc.startCall({
            meta: {
                user_id: remoteUserId,
                user_name: chat?.users?.user_name,
                chat_preview: chat?.chat,
            },
        });
    };

    if (!chat) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white border-4 border-black p-6 w-80 rounded-lg shadow-lg space-y-4 relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 font-bold text-black hover:text-red-500"
                >
                    ×
                </button>

                <div className="flex items-center space-x-4">
                    <img
                        src={chat.users?.user_avatar}
                        alt="avatar"
                        className="w-12 h-12 border-2 border-black"
                    />
                    <div>
                        <div className="font-bold text-lg">{chat.users?.user_name}</div>
                        <div className="text-sm text-gray-500">
                            {new Date(chat.created_at).toLocaleString()}
                        </div>
                    </div>
                </div>

                <p className="text-sm text-black font-semibold">"{chat.chat}"</p>

                <button
                    onClick={handleCall}
                    className="w-full py-2 mt-2 bg-green-600 text-white font-bold border-2 border-black hover:bg-green-800"
                >
                    📞 Call User
                </button>

                <audio ref={remoteAudioRef} autoPlay className="hidden" />
            </div>
        </div>
    );
};

export default UserProfilePopup;
