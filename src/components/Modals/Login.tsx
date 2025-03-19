import { authModalState } from "@/atoms/authModalAtom";
import { auth, firestore } from "@/firebase/firebase";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { useSetRecoilState } from "recoil";
import { toast } from "react-toastify";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const Login: React.FC = () => {
	const setAuthModalState = useSetRecoilState(authModalState);
	const handleClick = (type: "login" | "register" | "forgotPassword") =>
		setAuthModalState((prev) => ({ ...prev, type }));

	const [inputs, setInputs] = useState({ email: "", password: "" });
	const [signInWithEmailAndPassword, user, loading, error] = useSignInWithEmailAndPassword(auth);
	const router = useRouter();
	const provider = new GoogleAuthProvider();

	// Handle input change
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
		setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));

	// Email/password login
	const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!inputs.email || !inputs.password) return alert("Please fill all fields");

		try {
			toast.loading("Signing in...", { position: "top-center", toastId: "loginToast" });
			const newUser = await signInWithEmailAndPassword(inputs.email, inputs.password);
			if (!newUser) return;
			toast.success("Logged in successfully!", { position: "top-center" });
			router.push("/");
		} catch (error: any) {
			toast.error(error.message, { position: "top-center", autoClose: 3000 });
		} finally {
			toast.dismiss("loginToast");
		}
	};

	// Google Sign-In
	const handleGoogleSignIn = async () => {
		try {
			toast.loading("Signing in with Google...", { position: "top-center", toastId: "googleLoading" });
			const result = await signInWithPopup(auth, provider);
			const user = result.user;

			await setDoc(
				doc(firestore, "users", user.uid),
				{
					uid: user.uid,
					email: user.email,
					displayName: user.displayName,
					photoURL: user.photoURL,
					createdAt: Date.now(),
					updatedAt: Date.now(),
					likedProblems: [],
					dislikedProblems: [],
					solvedProblems: [],
					starredProblems: [],
				},
				{ merge: true }
			);

			toast.success("Signed in successfully!", { position: "top-center" });
			router.push("/");
		} catch (error: any) {
			toast.error(error.message, { position: "top-center" });
		} finally {
			toast.dismiss("googleLoading");
		}
	};

	useEffect(() => {
		if (error) toast.error(error.message, { position: "top-center", autoClose: 3000 });
	}, [error]);

	return (
		<form className="space-y-6 px-6 pb-4 bg-gray-200 text-gray-900 rounded-lg shadow-lg p-6">
			<h3 className="text-xl font-medium text-gray-900">Sign in</h3>
			<div>
				<label htmlFor="email" className="text-sm font-medium block mb-2 text-gray-700">
					Your Email
				</label>
				<input
					onChange={handleInputChange}
					type="email"
					name="email"
					id="email"
					className="border-2 rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-2.5 bg-gray-100 border-gray-400 placeholder-gray-500"
					placeholder="name@company.com"
				/>
			</div>
			<div>
				<label htmlFor="password" className="text-sm font-medium block mb-2 text-gray-700">
					Your Password
				</label>
				<input
					onChange={handleInputChange}
					type="password"
					name="password"
					id="password"
					className="border-2 rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-2.5 bg-gray-100 border-gray-400 placeholder-gray-500"
					placeholder="*******"
				/>
			</div>

			<button
				type="submit"
				className="w-full text-white bg-gray-800 hover:bg-gray-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
			>
				{loading ? "Loading..." : "Log In"}
			</button>

			{/* Google Sign-In Button */}
			<button
				type="button"
				onClick={handleGoogleSignIn}
				className="w-full bg-gray-100 text-gray-900 focus:ring-gray-500 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center space-x-2 hover:bg-gray-300 mt-3"
			>
				<img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
				<span>Continue with Google</span>
			</button>

			<button className="flex w-full justify-end mt-3" onClick={() => handleClick("forgotPassword")}>
				<a href="#" className="text-sm block text-gray-900 hover:underline w-full text-right">
					Forgot Password?
				</a>
			</button>

			<div className="text-sm font-medium text-gray-700">
				Not Registered?{" "}
				<a href="#" className="text-gray-900 hover:underline" onClick={() => handleClick("register")}>
					Create account
				</a>
			</div>
		</form>
	);
};

export default Login;
