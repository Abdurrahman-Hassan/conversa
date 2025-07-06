import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import supabase from "../../utils/supabase";

const sendMessageToSupabase = async ({ message, roomId }) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("chats").insert([
    {
      chat: message.trim(),
      user_id: user.id,
      chat_room: roomId,
    },
  ]);

  if (error) throw error;
};

const ChatInput = ({ roomId, onMessageSent }) => {
  const [message, setMessage] = useState("");

  const { mutate: sendMessage, isLoading: sending } = useMutation({
    mutationFn: ({ message, roomId }) => sendMessageToSupabase({ message, roomId }),
    onSuccess: () => {
      setMessage("");
      if (onMessageSent) onMessageSent();
    },
    onError: (error) => {
      console.error("Message send error:", error);
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage({ message, roomId });
  };

  return (
    <div className="flex items-center gap-2 mt-4 border-t-2 border-black pt-4">
      <input
        type="text"
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        className="flex-1 p-3 bg-[#E87F86] text-black font-bold border-2 border-black focus:outline-none"
        disabled={sending}
      />
      <button
        onClick={handleSend}
        disabled={sending}
        className="bg-black text-white px-4 py-2 font-bold border-2 border-black hover:bg-[#F5AD80] hover:text-black transition-all"
      >
        Send
      </button>
    </div>
  );
};

export default ChatInput;