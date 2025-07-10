import { useEffect, useRef } from "react";
import supabase from "@/utils/supabase";

const useCallSignaling = ({ roomId, userId, onOffer, onAnswer, onCandidate }) => {
  const channelRef = useRef(null);

  useEffect(() => {
    if (!roomId || !userId) return;

    // Clean up previous channel (if any)
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase.channel(roomId, {
      config: { broadcast: { ack: true } },
    });

    channelRef.current = channel;

    channel
      .on("broadcast", { event: "offer" }, (payload) => {
        if (payload.sender === userId) return; // skip self

        // Ensure the payload is targeted to current user
        if (!payload.payload || payload.payload.user_id !== userId) return;

        console.log("📡 Incoming offer for me:", payload);
        onOffer?.(payload.payload);
      })

      .on("broadcast", { event: "answer" }, (payload) => {
        if (payload.sender !== userId) {
          onAnswer?.(payload.payload);
        }
      })

      .on("broadcast", { event: "candidate" }, (payload) => {
        if (payload.sender !== userId) {
          onCandidate?.(payload.payload);
        }
      })

      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Subscribed to signaling channel", roomId);
        }
      });

    return () => {
      if (channelRef.current) {
        console.log("❌ Unsubscribing signaling channel", roomId);
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId, userId]);

  const sendOffer = (offer) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "offer",
      payload: offer,
      sender: userId,
    });
  };

  const sendAnswer = (answer) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "answer",
      payload: answer,
      sender: userId,
    });
  };

  const sendCandidate = (candidate) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "candidate",
      payload: candidate,
      sender: userId,
    });
  };

  return {
    sendOffer,
    sendAnswer,
    sendCandidate,
  };
};

export default useCallSignaling;
