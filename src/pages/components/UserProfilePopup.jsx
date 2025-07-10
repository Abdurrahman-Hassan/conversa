import { useRef, useEffect, useMemo } from "react";
import useWebRTC from "@/hooks/useWebRTC";
import useCallSignaling from "@/hooks/useCallSignaling";

const UserProfilePopup = ({ chat, onClose, currentUserId }) => {
    const remoteUserId = chat?.user_id;
    const roomId = useMemo(() => {
        if (!currentUserId || !remoteUserId) return null;
        return `call-${[currentUserId, remoteUserId].sort().join("-")}`;
    }, [currentUserId, remoteUserId]);
    const remoteAudioRef = useRef(null);

    // 1. Create webrtc hook without signaling first
    const webrtc = useWebRTC({
        localUserId: currentUserId,
        remoteUserId,
        signaling: null, // will be set later
    });

    // 2. Create signaling hook with handlers from webrtc
    const signaling = useCallSignaling({
        roomId,
        userId: currentUserId,
        onOffer: webrtc.handleOffer,
        onAnswer: webrtc.handleAnswer,
        onCandidate: webrtc.handleCandidate,
    });

    // 3. After signaling is created, set it in webrtc
    useEffect(() => {
        webrtc.setSignaling(signaling);
    }, [signaling]);

    // 4. Set the remote audio ref for playback
    useEffect(() => {
        webrtc.remoteAudio.current = remoteAudioRef.current;
    }, [remoteAudioRef.current]);

    const handleCall = () => {
        webrtc.startCall();
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
                {/* 🔊 Remote Audio */}
                <audio ref={remoteAudioRef} autoPlay className="hidden" />
            </div>
        </div>
    );
};

export default UserProfilePopup;