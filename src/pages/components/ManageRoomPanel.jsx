import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../../utils/supabase";

const fetchRoomData = async (roomId) => {
    if (!roomId) return { name: "", pending_users: [] };
    const { data: room, error } = await supabase
        .from("chat_rooms")
        .select("name, pending_users")
        .eq("id", roomId)
        .single();

    if (error) throw error;

    let users = [];
    if (room?.pending_users?.length) {
        const { data: usersData } = await supabase
            .from("users")
            .select("id, user_name, user_avatar")
            .in("id", room.pending_users);
        users = usersData || [];
    }
    return {
        name: room.name,
        pendingUsers: users,
    };
};

const approveUserRequest = async ({ userId, roomId }) => {
    // Remove from pending in room
    const { data: room } = await supabase
        .from("chat_rooms")
        .select("pending_users")
        .eq("id", roomId)
        .single();

    const updatedPending = (room?.pending_users || []).filter((id) => id !== userId);

    const { error: pendingUpdateError } = await supabase
        .from("chat_rooms")
        .update({ pending_users: updatedPending })
        .eq("id", roomId);

    if (pendingUpdateError) throw pendingUpdateError;

    // Update user's approved_chat_rooms
    const { data: userData } = await supabase
        .from("users")
        .select("approved_chat_rooms")
        .eq("id", userId)
        .single();

    const updatedApproved = [...(userData.approved_chat_rooms || []), roomId];

    const { error: updateUserError } = await supabase
        .from("users")
        .update({ approved_chat_rooms: updatedApproved })
        .eq("id", userId);

    if (updateUserError) throw updateUserError;

    // Broadcast approval
    await supabase
        .channel('room-approvals')
        .send({
            type: 'broadcast',
            event: 'user-approved',
            payload: { userId }
        });

    return true;
};

const renameRoomRequest = async ({ roomId, newName }) => {
    const { error } = await supabase
        .from("chat_rooms")
        .update({ name: newName.trim() })
        .eq("id", roomId);
    if (error) throw error;
    return newName.trim();
};

const deleteRoomRequest = async ({ roomId }) => {
    const { error } = await supabase.from("chat_rooms").delete().eq("id", roomId);
    if (error) throw error;
    return true;
};

const ManageRoomPanel = ({ roomId, onRoomDeleted }) => {
    const queryClient = useQueryClient();

    // Room data (name, pending users)
    const { data, refetch } = useQuery({
        queryKey: ['manage-room-data', roomId],
        queryFn: () => fetchRoomData(roomId),
        enabled: !!roomId,
        staleTime: 0,
    });

    // Mutations
    const approveUserMutation = useMutation({
        mutationFn: ({ userId }) => approveUserRequest({ userId, roomId }),
        onSuccess: () => refetch(),
        onError: (e) => console.error("Approve user error:", e),
    });

    const renameRoomMutation = useMutation({
        mutationFn: ({ newName }) => renameRoomRequest({ roomId, newName }),
        onSuccess: () => refetch(),
        onError: (e) => console.error("Rename failed:", e),
    });

    const deleteRoomMutation = useMutation({
        mutationFn: () => deleteRoomRequest({ roomId }),
        onSuccess: () => {
            alert("Room deleted.");
            onRoomDeleted?.();
        },
        onError: (e) => console.error("Delete failed:", e),
    });

    // Sync with refetch on roomId change
    useEffect(() => {
        if (roomId) refetch();
        // eslint-disable-next-line
    }, [roomId]);

    const handleApproveUser = (userId) => {
        approveUserMutation.mutate({ userId });
    };

    const handleRenameRoom = async () => {
        const newName = prompt("Enter new room name:", data?.name);
        if (!newName || newName === data?.name) return;
        renameRoomMutation.mutate({ newName });
    };

    const handleDeleteRoom = () => {
        const confirmDelete = confirm("Are you sure you want to delete this room?");
        if (!confirmDelete) return;
        deleteRoomMutation.mutate();
    };

    const pendingUsers = data?.pendingUsers || [];
    const roomName = data?.name || "";

    return (
        <div className="mb-4 p-4 border-4 border-black bg-[#E87F86] text-black">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-extrabold">Manage Room: {roomName}</h3>
                <div className="space-x-2">
                    <button
                        onClick={handleRenameRoom}
                        className="px-3 py-1 border-2 border-black bg-white font-bold hover:bg-black hover:text-white"
                    >
                        ✏ Rename
                    </button>
                    <button
                        onClick={handleDeleteRoom}
                        className="px-3 py-1 border-2 border-black bg-red-600 text-white font-bold hover:bg-white hover:text-red-600"
                    >
                        ❌ Delete
                    </button>
                </div>
            </div>

            <h4 className="font-bold mb-2">Pending Requests</h4>
            {pendingUsers.length > 0 ? (
                <ul className="space-y-2">
                    {pendingUsers.map((user) => (
                        <li
                            key={user.id}
                            className="flex items-center justify-between border-b-2 border-black pb-1"
                        >
                            <div className="flex items-center space-x-3">
                                <img
                                    src={user.user_avatar || "https://via.placeholder.com/40"}
                                    alt={user.user_name}
                                    className="w-8 h-8 rounded-full border-2 border-black"
                                />
                                <span className="font-bold">{user.user_name || "Unnamed"}</span>
                            </div>
                            <button
                                onClick={() => handleApproveUser(user.id)}
                                className="px-3 py-1 border-2 border-black bg-black text-white font-bold hover:bg-white hover:text-black"
                                disabled={approveUserMutation.isLoading}
                            >
                                Approve
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="font-bold text-sm">No pending users.</p>
            )}
        </div>
    );
};

export default ManageRoomPanel;