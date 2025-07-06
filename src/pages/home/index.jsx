"use client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import supabase from "../../utils/supabase";
import ChatWindow from "../components/ChatWindow";
import RoomCreator from "../components/RoomCreator";
import withAuth from "@/utils/withAuth";
import Loading from "../components/loading";

const fetchUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Unauthenticated");
  return data.user;
};

const fetchUserData = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select("approved_chat_rooms")
    .eq("id", userId)
    .single();

  if (error) throw new Error("Failed to get user data");
  return data.approved_chat_rooms || [];
};

const fetchChatRooms = async () => {
  const { data, error } = await supabase
    .from("chat_rooms")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error("Failed to fetch chat rooms");
  return data;
};

const Home = () => {
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState(null);

  // 🔐 Get current user
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: fetchUser,
  });

  // 📦 Get approved chat rooms for this user
  const {
    data: approvedRoomIds = [],
    isLoading: approvedLoading,
  } = useQuery({
    queryKey: ["approvedRooms", user?.id],
    queryFn: () => fetchUserData(user.id),
    enabled: !!user,
  });

  // 🏠 Get all chat rooms
  const {
    data: allRooms = [],
    isLoading: roomsLoading,
  } = useQuery({
    queryKey: ["chatRooms"],
    queryFn: fetchChatRooms,
    enabled: !!user,
  });

  // 🔍 Filter chat rooms based on user
  const filteredRooms = allRooms.filter(
    (room) => room.owner === user?.id || approvedRoomIds.includes(room.id)
  );

  // 📡 Broadcast setup (on approval)
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel("room-approvals");

    channel
      .on("broadcast", { event: "user-approved" }, async (event) => {
        if (event.payload.userId === user.id) {
          console.log("You were approved! Refetching user data...");
          queryClient.invalidateQueries(["approvedRooms", user.id]);
          queryClient.invalidateQueries(["chatRooms"]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleRoomCreated = (newRooms) => {
    queryClient.invalidateQueries(["chatRooms"]);
  };

  if (userLoading || approvedLoading || roomsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5AD80] font-sans">
        <div className="flex flex-col items-center">
          <Loading />
          <p className="mt-4 text-lg font-bold text-black">Loading your rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F5AD80] p-4 gap-4 font-sans">
      {/* Sidebar */}
      <div className="w-full md:w-1/4 bg-white border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] p-4 space-y-4">
        <h2 className="text-2xl font-bold border-b-2 border-black pb-2 uppercase">
          Chat Rooms
        </h2>

        <RoomCreator onRoomCreated={handleRoomCreated} />

        {filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room.id)}
              className={`w-full text-left p-2 font-bold border-2 border-black hover:bg-[#E87F86] ${selectedRoom === room.id ? "bg-[#E87F86]" : "bg-white"
                }`}
            >
              {room.name || `Room #${room.id}`}
            </button>
          ))
        ) : (
          <p className="text-sm font-bold text-black">No accessible rooms yet.</p>
        )}
      </div>

      {/* Chat Window */}
      <ChatWindow roomId={selectedRoom} currentUser={user.id} />
    </div>
  );
};

export default withAuth(Home);
