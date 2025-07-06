import { useState } from "react";

const ChatMessage = ({ chat, isOwner, onEdit, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(chat.chat);

  return (
    <div className="flex items-start border-2 border-black p-2 bg-[#E87F86] font-bold">
      <img src={chat.users?.user_avatar} alt="avatar" className="w-8 h-8 border-2 border-black mr-2" />
      <div className="flex-1">
        <div className="text-xs text-black/80">{chat.users?.user_name}</div>
        {editing ? (
          <div className="flex gap-2 mt-1">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              className="flex-1 p-1 border-2 border-black bg-white focus:outline-none"
            />
            <button onClick={() => {onEdit(chat.id, text); setEditing(false);}} className="px-2 bg-black text-white border-2 border-black">Save</button>
          </div>
        ) : (
          <div className="mt-1">{chat.chat}</div>
        )}
        <div className="text-[10px] mt-1 text-black/60">{new Date(chat.created_at).toLocaleString()}</div>
      </div>
      {isOwner && !editing && (
        <div className="flex flex-col ml-2 space-y-1">
          <button onClick={() => setEditing(true)} className="px-2 bg-black text-white border-2 border-black">Edit</button>
          <button onClick={() => onDelete(chat.id)} className="px-2 bg-black text-white border-2 border-black">Del</button>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
