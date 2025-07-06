import { useState } from "react";
import supabase from "../../utils/supabase";
import { useRouter } from "next/navigation";

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function signinWithEmail(e) {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.log(error);
      setErrorMsg("Invalid email or password.");
    } else if (data?.user) {
      router.push("/");
    } else {
      setErrorMsg("Something went wrong. Try again.");
    }
  }

  return (
    <div className="min-h-screen bg-[#F5AD80] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-4 border-black shadow-[10px_10px_0px_rgba(0,0,0,1)] p-6 space-y-6">
        <h1 className="text-4xl font-extrabold text-black uppercase tracking-tight border-b-4 border-black pb-2">
          Login
        </h1>

        <form onSubmit={signinWithEmail} className="flex flex-col space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 bg-[#E87F86] text-black font-bold border-2 border-black focus:outline-none"
          />
          <input
            type="password"
            required
            placeholder="Password"
            minLength={6}
            maxLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 bg-[#E87F86] text-black font-bold border-2 border-black focus:outline-none"
          />
          <button
            type="submit"
            className="bg-black text-white p-3 font-bold uppercase tracking-wide border-2 border-black hover:bg-[#E87F86] hover:text-black transition-all"
          >
            Sign In
          </button>
        </form>

        {errorMsg && (
          <p className="mt-2 text-red-700 font-bold border-l-4 border-red-700 pl-3">
            {errorMsg}
          </p>
        )}

        <div className="pt-4">
          <button
            type="button"
            onClick={() => router.push("/login/signup")}
            className="bg-[#E87F86] text-black p-3 font-bold uppercase w-full border-2 border-black hover:bg-black hover:text-white transition-all"
          >
            Go to Signup
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
