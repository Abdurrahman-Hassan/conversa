// utils/createCallSignaling.js
import supabase from "@/utils/supabase";

/**
 * Signaling channel for simple-peer via Supabase Realtime Broadcast.
 */
export default function createCallSignaling({ roomId, userId, onSignal }) {
    const channel = supabase.channel(roomId, {
        config: { broadcast: { ack: true } },
    });

    // Listen for all signaling messages
    channel.on("broadcast", { event: "signal" }, (payload) => {
        const { signal, from, to } = payload.payload;

        if (!signal || from === userId) return; // Ignore self-sent
        if (to !== userId) return; // Ignore messages not meant for me

        console.log("📡 Incoming signal from:", from, signal);
        onSignal?.({ ...signal, sender: from }); // attach sender for context
    });

    channel.subscribe((status) => {
        console.log("🛰️ Channel status:", status);
    });

    channel.on("broadcast", { event: "signal" }, (payload) => {
        console.log("📡 Received signal payload:", payload);
    });

    channel.on("broadcast", { event: "signal" }, (payload) => {
        console.log("📡 RECEIVED SIGNAL", payload);
        const { signal, from } = payload.payload;

        if (!signal || from === userId) return; // don’t self-handle

        onSignal?.(signal);
    });


    // Subscribe to channel
    channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
            console.log("✅ Subscribed to signaling channel:", roomId);
        } else {
            console.error("❌ Failed to subscribe to signaling channel:", roomId, status);
        }
    });

    // Signaling API for sending signal data
    return {
        sendSignal: async ({ signal, to }) => {
            if (!signal) return;
            console.log("📤 Sending signal to:", to, signal);

            await channel.send({
                type: "broadcast",
                event: "signal",
                payload: {
                    signal,
                    from: userId,
                    to,
                },
            });
        },

        destroy: () => {
            console.log("🧹 Destroying signaling channel:", roomId);
            supabase.removeChannel(channel);
        },
    };
}
