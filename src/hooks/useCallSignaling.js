import { useEffect, useRef } from "react";
import supabase from "@/utils/supabase";

const useCallSignaling = ({ roomId, userId, onOffer, onAnswer, onCandidate }) => {
  const channelRef = useRef(null);

  useEffect(() => {
    if (!roomId || !userId) return;

    const channel = supabase.channel(roomId, {
      config: { broadcast: { ack: true } },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "offer" }, (payload) => {
        if (payload.sender !== userId) {
          console.log("📡 Incoming offer broadcast:", payload);
          onOffer?.(payload.payload);
        }
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
      if (channelRef.current) supabase.removeChannel(channelRef.current);
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
