import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import supabase from "../../utils/supabase";
import RoomSearch from "./RoomSearch";

const createRoomRequest = async ({ newRoomName }) => {
  if (!newRoomName.trim()) throw new Error("Room name required");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("chat_rooms")
    .insert([{ name: newRoomName.trim(), owner: user?.id }])
    .select();

  if (error) throw error;

  // Fetch and update approved_chat_rooms properly!
  const { data: userRow, error: userFetchError } = await supabase
    .from("users")
    .select("approved_chat_rooms")
    .eq("id", user?.id)
    .single();

  if (userFetchError) throw userFetchError;

  const updatedRooms = (userRow?.approved_chat_rooms || []).includes(data[0].id)
    ? userRow.approved_chat_rooms
    : [...(userRow.approved_chat_rooms || []), data[0].id];

  const { error: userError } = await supabase
    .from("users")
    .update({
      approved_chat_rooms: updatedRooms,
    })
    .eq("id", user?.id);

  if (userError) throw userError;

  return data;
};

const RoomPopup = ({ onRoomCreated }) => {
  const [newRoomName, setNewRoomName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const { mutate: createRoom, isLoading: creatingRoom } = useMutation({
    mutationFn: ({ newRoomName }) => createRoomRequest({ newRoomName }),
    onSuccess: (data) => {
      setNewRoomName("");
      onRoomCreated(data); // notify parent
      setShowCreateModal(false);
    },
    onError: (error) => {
      console.error("Error creating room:", error);
    },
  });

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;
    createRoom({ newRoomName });
  };

  return (
    <div className="relative">
      {/* Brutalist Buttons */}
      <div className="flex space-x-4 mb-4">
        <button
          className="px-6 py-2 border-4 border-black bg-[#E87F86] font-bold text-black hover:bg-black hover:text-[#E87F86] transition-all"
          onClick={() => setShowCreateModal(true)}
        >
          Create Room
        </button>
        <button
          className="px-6 py-2 border-4 border-black bg-yellow-300 font-bold text-black hover:bg-black hover:text-yellow-300 transition-all"
          onClick={() => setShowSearchModal(true)}
        >
          Search Room
        </button>
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white border-4 border-black p-6 w-full max-w-md">
            <h2 className="text-xl font-extrabold mb-4 text-black">Create New Room</h2>
            <input
              type="text"
              placeholder="Enter room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="w-full p-2 mb-4 border-2 border-black bg-[#E87F86] text-black font-bold"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border-2 border-black bg-white text-black font-bold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={creatingRoom}
                className="px-4 py-2 border-2 border-black bg-black text-white font-bold hover:bg-[#E87F86] hover:text-black"
              >
                {creatingRoom ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Room Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white border-4 border-black p-6 w-full max-w-md relative">
            <h2 className="text-xl font-extrabold mb-4 text-black">Search Room</h2>
            <RoomSearch />
            <button
              onClick={() => setShowSearchModal(false)}
              className="absolute top-2 right-2 px-3 py-1 border-2 border-black bg-black text-white hover:bg-[#E87F86] hover:text-black font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomPopup;