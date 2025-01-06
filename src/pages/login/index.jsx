import { useState, useEffect } from "react";
import supabase from "../api/supabase";
import { useRouter } from "next/navigation";

const Login = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  async function signinWithEmail(e) {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (data) {
      if (data.user) {
        router.push("/");
      } else if (data.user == null) {
        alert("Email or Password is incorrect.");
      }
    } else if (error) {
      console.log(error);
      alert("Theres an error");
    }
  }

  return (
    <div>
      <h1>Login Page</h1>
      <form onSubmit={signinWithEmail}>
        <input
          type="email"
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          minLength={6}
          maxLength={8}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Sign In</button>
      </form>

      <button
        onClick={() => {
          router.push("/login/signup");
        }}
      >
        signup
      </button>
    </div>
  );
};

export default Login;
