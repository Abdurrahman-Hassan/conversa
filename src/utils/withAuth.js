// utils/withAuth.js
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import supabase from "./supabase";
import Loading from "@/pages/components/loading";

const fetchUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error("Not authenticated");
  return data.user;
};

const withAuth = (WrappedComponent) => {
  return function ProtectedComponent(props) {
    const router = useRouter();

    const {
      data: user,
      isLoading,
      isError,
    } = useQuery({
      queryKey: ["authUser"],
      queryFn: fetchUser,
      staleTime: 1000 * 60 * 5, // cache for 5 minutes
    });

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5AD80] font-sans">
          <div className="flex flex-col items-center">
            <Loading />
            <p className="mt-4 text-lg font-bold text-black">Checking authentication...</p>
          </div>
        </div>
      );
    }

    if (isError) {
      router.replace("/login");
      return null;
    }

    return <WrappedComponent {...props} user={user} />;
  };
};

export default withAuth;
