import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import supabase from "../../utils/supabase";

const Signup = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);

  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function signupWithEmail() {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    if (data.user) {
      userdatainsert(data.user.id, name, avatar);
    } else if (error) {
      console.log(error);
      setErrorMessage(error.message || "Something went wrong!");
      setShowError(true);
    }
  }

  const userdatainsert = async (uid, uname, uavatar) => {
    const { data, error } = await supabase
      .from("users")
      .insert([{ id: uid, user_name: uname, user_avatar: uavatar }])
      .select();
    if (data) {
      setShowSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else if (error) {
      console.log(error);
      setErrorMessage(error.message || "Something went wrong!");
      setShowError(true);
    }
  };

  useEffect(() => {
    setAvatar(`https://api.dicebear.com/7.x/thumbs/svg?seed=${name}`);
  }, [name]);

  return (
    <div className="min-h-screen bg-[#F5AD80] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white border-4 border-black shadow-[10px_10px_0px_rgba(0,0,0,1)] p-6 space-y-6">
        <h1 className="text-4xl font-extrabold text-black uppercase tracking-tight border-b-4 border-black pb-2">
          Sign up
        </h1>

        <div className="flex flex-col space-y-4">
          <input
            type="text"
            required
            maxLength={23}
            placeholder="Your Name"
            onChange={(e) => setName(e.target.value)}
            value={name}
            className="p-3 bg-[#E87F86] text-black font-bold border-2 border-black focus:outline-none"
          />
          <input
            type="email"
            required
            placeholder="Email Address"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            className="p-3 bg-[#E87F86] text-black font-bold border-2 border-black focus:outline-none"
          />
          <input
            type="password"
            required
            minLength={6}
            maxLength={8}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            className="p-3 bg-[#E87F86] text-black font-bold border-2 border-black focus:outline-none"
          />
          <button
            type="submit"
            onClick={signupWithEmail}
            className="bg-black text-white p-3 font-bold uppercase tracking-wide border-2 border-black hover:bg-[#E87F86] hover:text-black transition-all"
          >
            Signup
          </button>
        </div>

        {avatar && (
          <div className="flex flex-col items-center pt-4">
            <img src={avatar} alt={name} className="w-24 h-24 border-4 border-black" />
            <p className="mt-2 text-black font-bold">{name || "Avatar Preview"}</p>
          </div>
        )}
      </div>

      {/* Success Dialog */}
      <Transition appear show={showSuccess} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setShowSuccess(false)}>
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm" />
          <div className="fixed inset-0 flex items-center justify-center">
            <Dialog.Panel className="bg-white border-4 border-black p-6 text-center shadow-[10px_10px_0px_rgba(0,0,0,1)]">
              <Dialog.Title className="text-2xl font-bold text-black uppercase">
                🎉 Signup Successful!
              </Dialog.Title>
              <p className="mt-2 text-black">Redirecting to login...</p>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      {/* Error Dialog */}
      <Transition appear show={showError} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setShowError(false)}>
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm" />
          <div className="fixed inset-0 flex items-center justify-center">
            <Dialog.Panel className="bg-[#E87F86] border-4 border-black p-6 text-center shadow-[10px_10px_0px_rgba(0,0,0,1)]">
              <Dialog.Title className="text-2xl font-bold text-black uppercase">
                ⚠️ Error!
              </Dialog.Title>
              <p className="mt-2 text-black">{errorMessage}</p>
              <button
                className="mt-4 px-4 py-2 bg-black text-white font-bold border-2 border-black"
                onClick={() => setShowError(false)}
              >
                Close
              </button>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default Signup;
