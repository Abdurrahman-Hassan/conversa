import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../../utils/supabase";
import Loading from "./loading";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import ManageRoomPanel from "./ManageRoomPanel";

const fetchChats = async (roomId) => {
    if (!roomId) return [];
    const { data, error } = await supabase
        .from("chats")
        .select("*, users(user_name, user_avatar)")
        .eq("chat_room", roomId)
        .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
};

const fetchRoomDetails = async (roomId) => {
    if (!roomId) return { owner: null, pending_users: [] };
    const { data, error } = await supabase
        .from("chat_rooms")
        .select("owner, pending_users")
        .eq("id", roomId)
        .single();
    if (error) throw error;
    return { owner: data.owner, pending_users: data.pending_users || [] };
};

const updateChatRequest = async ({ id, newText }) => {
    const { error } = await supabase.from("chats").update({ chat: newText }).eq("id", id);
    if (error) throw error;
    return { id, newText };
};

const deleteChatRequest = async (id) => {
    const { error } = await supabase.from("chats").delete().eq("id", id);
    if (error) throw error;
    return id;
};

const approveUserRequest = async ({ roomId, userId, pendingUsers }) => {
    // Remove from room pending_users
    const updatedPendingUsers = pendingUsers.filter((uid) => uid !== userId);
    const { error: pendingUpdateError } = await supabase
        .from("chat_rooms")
        .update({ pending_users: updatedPendingUsers })
        .eq("id", roomId);

    if (pendingUpdateError) throw pendingUpdateError;

    // Fetch user row
    const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("approved_chat_rooms")
        .eq("id", userId)
        .single();

    if (userError) throw userError;

    const updatedApproved = [...(userRow.approved_chat_rooms || []), roomId];

    // Update user row
    const { error: updateUserError } = await supabase
        .from("users")
        .update({ approved_chat_rooms: updatedApproved })
        .eq("id", userId);

    if (updateUserError) throw updateUserError;

    return updatedPendingUsers;
};

const ChatWindow = ({ roomId, currentUser }) => {
    const queryClient = useQueryClient();

    // Room details (owner, pending users)
    const {
        data: roomDetails,
        isLoading: roomLoading,
        refetch: refetchRoomDetails,
    } = useQuery({
        queryKey: ["roomDetails", roomId],
        queryFn: () => fetchRoomDetails(roomId),
        enabled: !!roomId,
        staleTime: 30000,
    });

    const [showApprovalPanel, setShowApprovalPanel] = useState(false);

    // Chats
    const {
        data: chats = [],
        isLoading: chatsLoading,
        refetch: refetchChats,
        setData: setChatsData, // for realtime updates
    } = useQuery({
        queryKey: ["chats", roomId],
        queryFn: () => fetchChats(roomId),
        enabled: !!roomId,
        staleTime: 0,
    });

    // For realtime updates: manage chats state locally
    const [chatsState, setChatsState] = useState([]);

    // Keep chatsState in sync with react-query data
    useEffect(() => {
        setChatsState(chats || []);
    }, [chats]);

    // Real-time logic
    useEffect(() => {
        if (!roomId) return;

        // Reset local state when room changes
        setChatsState([]);
        refetchRoomDetails();
        refetchChats();

        // Setup real-time listener
        const channel = supabase
            .channel(`room-${roomId}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "chats", filter: `chat_room=eq.${roomId}` },
                async (payload) => {
                    if (payload.eventType === "INSERT") {
                        const { data: fullChat } = await supabase
                            .from("chats")
                            .select("*, users(user_name, user_avatar)")
                            .eq("id", payload.new.id)
                            .single();
                        if (fullChat) {
                            setChatsState((prev) =>
                                prev.some((c) => c.id === fullChat.id) ? prev : [...prev, fullChat]
                            );
                            // Optionally update query cache
                            queryClient.setQueryData(["chats", roomId], (old = []) =>
                                old.some((c) => c.id === fullChat.id) ? old : [...old, fullChat]
                            );
                        }
                    }

                    if (payload.eventType === "UPDATE") {
                        setChatsState((prev) =>
                            prev.map((c) => (c.id === payload.new.id ? { ...c, chat: payload.new.chat } : c))
                        );
                        queryClient.setQueryData(["chats", roomId], (old = []) =>
                            old.map((c) =>
                                c.id === payload.new.id ? { ...c, chat: payload.new.chat } : c
                            )
                        );
                    }

                    if (payload.eventType === "DELETE") {
                        setChatsState((prev) => prev.filter((c) => c.id !== payload.old.id));
                        queryClient.setQueryData(["chats", roomId], (old = []) =>
                            old.filter((c) => c.id !== payload.old.id)
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line
    }, [roomId]);

    // Mutations
    const updateChatMutation = useMutation({
        mutationFn: updateChatRequest,
        onSuccess: () => {
            // No manual cache update needed; realtime will update
        },
    });

    const deleteChatMutation = useMutation({
        mutationFn: deleteChatRequest,
        onSuccess: () => {
            // No manual cache update needed; realtime will update
        },
    });

    const approveUserMutation = useMutation({
        mutationFn: ({ userId }) =>
            approveUserRequest({
                roomId,
                userId,
                pendingUsers: roomDetails?.pending_users || [],
            }),
        onSuccess: () => {
            refetchRoomDetails();
        },
    });

    // Derived data
    const roomOwner = roomDetails?.owner;
    const pendingUsers = roomDetails?.pending_users || [];
    const loading = chatsLoading || roomLoading;

    const handleUpdateChat = (id, newText) => {
        updateChatMutation.mutate({ id, newText });
    };

    const handleDeleteChat = (id) => {
        deleteChatMutation.mutate(id);
    };

    const handleApproveUser = (userId) => {
        approveUserMutation.mutate({ userId });
    };

    return (
        <div className="flex-1 bg-white border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] p-4 flex flex-col">
            {/* Menu Bar */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold uppercase border-b-2 border-black pb-2">
                    {roomId ? `Room #${roomId}` : "Select a Room"}
                </h2>

                {currentUser === roomOwner && (
                    <button
                        onClick={() => setShowApprovalPanel(!showApprovalPanel)}
                        className="px-4 py-1 border-2 border-black bg-yellow-300 text-black font-bold hover:bg-black hover:text-yellow-300"
                    >
                        {showApprovalPanel ? "Close Requests" : "Manage Requests"}
                    </button>
                )}
            </div>

            {/* Approval Panel */}
            {showApprovalPanel && (
                <ManageRoomPanel
                    roomId={roomId}
                    onRoomDeleted={() => {
                        setShowApprovalPanel(false);
                        window.location.reload();
                    }}
                />
            )}

            {/* Chat List */}
            {!roomId ? (
                <div className="flex-1 flex items-center justify-center text-center">
                    <p className="text-black font-bold text-lg">Select a room to start chatting.</p>
                </div>
            ) : loading ? (
                <Loading />
            ) : (
                <div className="flex-1 mt-2 overflow-y-auto space-y-4">
                    {chatsState.length ? (
                        chatsState.map((chat) => (
                            <ChatMessage
                                key={chat.id}
                                chat={chat}
                                isOwner={currentUser === chat.user_id}
                                onEdit={handleUpdateChat}
                                onDelete={handleDeleteChat}
                            />
                        ))
                    ) : (
                        <p className="text-sm text-black font-bold">No chats yet...</p>
                    )}
                </div>
            )}

            {roomId && <ChatInput roomId={roomId} />}
        </div>
    );
};

export default ChatWindow;