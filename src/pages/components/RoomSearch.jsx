import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import supabase from "../../utils/supabase";

const searchRooms = async (searchTerm) => {
  if (!searchTerm.trim()) return [];
  const { data, error } = await supabase
    .from("chat_rooms")
    .select("*")
    .eq("name", searchTerm.trim());
  if (error) throw error;
  return data;
};

const requestJoinRoom = async (room) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("You must be logged in.");

  // Owner check
  if (user.id === room.owner) throw new Error("You are the owner of this room.");

  // Step 1: Fetch user to check approved rooms
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("approved_chat_rooms")
    .eq("id", user.id)
    .single();

  if (userError || !userData) throw new Error("Error fetching user info.");

  if (userData.approved_chat_rooms?.includes(room.id))
    throw new Error("You are already approved for this room.");

  // Step 2: Fetch room pending_users
  const { data: currentRoom, error: fetchError } = await supabase
    .from("chat_rooms")
    .select("pending_users")
    .eq("id", room.id)
    .single();

  if (fetchError || !currentRoom) throw new Error("Error checking room access.");

  if (currentRoom.pending_users?.includes(user.id))
    throw new Error("You've already requested to join this room.");

  // Step 3: Send request
  const { error: updateError } = await supabase
    .from("chat_rooms")
    .update({
      pending_users: [...(currentRoom.pending_users || []), user.id],
    })
    .eq("id", room.id);

  if (updateError) throw new Error("Failed to send join request.");

  return "Request sent! Please wait until you are approved.";
};

const RoomSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [matchedRooms, setMatchedRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [message, setMessage] = useState("");

  // Search mutation
  const { mutate: triggerSearch, isLoading: searching } = useMutation({
    mutationFn: searchRooms,
    onSuccess: (data) => {
      setMatchedRooms(data);
      setMessage("");
    },
    onError: (err) => {
      setMatchedRooms([]);
      setMessage("Search error: " + err.message);
    },
  });

  // Request join mutation
  const { mutate: triggerRequestJoin, isLoading: requesting } = useMutation({
    mutationFn: requestJoinRoom,
    onMutate: (room) => {
      setSelectedRoom(room);
      setMessage("Checking...");
    },
    onSuccess: (successMsg) => {
      setMessage(successMsg);
    },
    onError: (err) => {
      setMessage(err.message);
    },
  });

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    triggerSearch(searchTerm);
  };

  const requestJoin = (room) => {
    triggerRequestJoin(room);
  };

  return (
    <div className="p-4 border-4 border-black bg-yellow-200 text-black w-full max-w-md">
      <h2 className="font-extrabold text-lg mb-2">Search Room</h2>
      <div className="flex mb-3">
        <input
          type="text"
          placeholder="Exact Room Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 p-2 border-2 border-black font-bold bg-white"
          disabled={searching}
        />
        <button
          onClick={handleSearch}
          className="ml-2 px-4 py-2 border-2 border-black font-bold bg-black text-white hover:bg-[#E87F86] hover:text-black"
          disabled={searching}
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </div>

      {matchedRooms.length > 0 && (
        <div className="border-t-2 border-black pt-3">
          <p className="font-bold mb-2">Matching Rooms:</p>
          <ul className="space-y-2">
            {matchedRooms.map((room) => (
              <li
                key={room.id}
                className="p-2 bg-white border-2 border-black flex justify-between items-center"
              >
                <span className="font-bold">{room.name}</span>
                <button
                  onClick={() => requestJoin(room)}
                  className="ml-2 px-3 py-1 bg-black text-white border-2 border-black font-bold hover:bg-[#E87F86] hover:text-black"
                  disabled={requesting && selectedRoom?.id === room.id}
                >
                  {requesting && selectedRoom?.id === room.id
                    ? "Requesting..."
                    : "Request Access"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {message && (
        <p className="mt-4 font-bold border-2 border-black p-2 bg-white text-black">
          {message}
        </p>
      )}
    </div>
  );
};

export default RoomSearch;