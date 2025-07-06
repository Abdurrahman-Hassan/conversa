import Head from "next/head";
import { useRouter } from "next/router";
import supabase from "@/utils/supabase";
import { useQuery } from "@tanstack/react-query";
import Loading from "./components/loading";

const fetchSessionUser = async () => {
  const { data, error } = await supabase.auth.getSession();
  const session = data?.session;

  if (!session || error) throw new Error("No session");

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (!userData || userError) throw new Error("User not found in DB");

  return userData;
};

export default function Home() {
  const router = useRouter();

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["session-user"],
    queryFn: fetchSessionUser,
    retry: false, // Don't retry on error
  });

  // Redirect effects
  if (!isLoading && !isError && user) {
    router.replace("/home");
  }

  if (!isLoading && isError) {
    router.replace("/login");
  }

  return (
    <>
      <Head>
        <title>Welcome</title>
        <meta name="description" content="Chat App" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FEE3D7] text-center">
        {isLoading ? (
          <>
            <Loading />
            <p className="mt-4 text-lg font-semibold text-gray-800">
              Checking authentication...
            </p>
          </>
        ) : (
          <p className="text-lg font-semibold text-gray-700">
            Redirecting...
          </p>
        )}
      </div>
    </>
  );
}
