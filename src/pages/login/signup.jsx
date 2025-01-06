import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "../api/supabase";

const Signup = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signedupData, setSignedupData] = useState(null);
  const [signeduperror, setSigneduperror] = useState(null);
  const [avatar, setAvatar] = useState(null);

  async function signupWithEmail() {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    if (data.user) {
      setSignedupData(data.user);
      userdatainsert(data.user.id, name, avatar);
    } else if (error) {
      console.log(error);
      alert("Theres an error please try again later.");
    }
  }
  let userdatainsert = async (uid, uname, uavatar) => {
    const { data, error } = await supabase
      .from("users")
      .insert([{ id: uid, user_name: uname, user_avatar: uavatar }])
      .select();
    if (data) {
      router.push("/login");
    } else if (error) {
      console.log(error);
      alert("Theres an error please try again later.");
    }
  };

  useEffect(() => {
    setAvatar(`https://api.dicebear.com/7.x/thumbs/svg?seed=${name}`);
  }, [name]);

  return (
    <div>
      <h1>Login Page</h1>
      <input
        type="text"
        required
        maxLength={12}
        placeholder="name"
        onChange={(e) => setName(e.target.value)}
        value={name}
      />
      <input
        type="email"
        required
        placeholder="email"
        onChange={(e) => setEmail(e.target.value)}
        value={email}
      />
      <input
        type="password"
        required
        minLength={6}
        maxLength={8}
        placeholder="password"
        onChange={(e) => setPassword(e.target.value)}
        value={password}
      />
      <button type="submit" onClick={signupWithEmail}>
        signup
      </button>

      {console.log(name)}
      {avatar && (
        <div>
          <img src={avatar} alt={name} className="avatarimg"/>
        </div>
      )}
    </div>
  );
};

export default Signup;
