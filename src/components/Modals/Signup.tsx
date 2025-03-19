import { authModalState } from "@/atoms/authModalAtom";
import { auth, firestore } from "@/firebase/firebase";
import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { useRouter } from "next/router";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const Signup: React.FC = () => {
	const setAuthModalState = useSetRecoilState(authModalState);
	const handleClick = () => setAuthModalState((prev) => ({ ...prev, type: "login" }));

	const [inputs, setInputs] = useState({ email: "", displayName: "", password: "" });
	const router = useRouter();
	const [createUserWithEmailAndPassword, user, loading, error] = useCreateUserWithEmailAndPassword(auth);
	const provider = new GoogleAuthProvider();

	const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) =>
		setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));

	const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!inputs.email || !inputs.password || !inputs.displayName) return alert("Please fill all fields");

		try {
			toast.loading("Creating your account...", { position: "top-center", toastId: "loadingToast" });
			const newUser = await createUserWithEmailAndPassword(inputs.email, inputs.password);
			if (!newUser) return;

			await setDoc(doc(firestore, "users", newUser.user.uid), {
				uid: newUser.user.uid,
				email: newUser.user.email,
				displayName: inputs.displayName,
				createdAt: Date.now(),
				updatedAt: Date.now(),
				likedProblems: [],
				dislikedProblems: [],
				solvedProblems: [],
				starredProblems: [],
			});
			router.push("/");
		} catch (error: any) {
			toast.error(error.message, { position: "top-center" });
		} finally {
			toast.dismiss("loadingToast");
		}
	};

	const handleGoogleSignIn = async () => {
		try {
			toast.loading("Signing in with Google...", { position: "top-center", toastId: "googleLoading" });
			const result = await signInWithPopup(auth, provider);
			const user = result.user;

			await setDoc(doc(firestore, "users", user.uid), {
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
			}, { merge: true });

			toast.success("Signed in successfully!", { position: "top-center" });
			router.push("/");
		} catch (error: any) {
			toast.error(error.message, { position: "top-center" });
		} finally {
			toast.dismiss("googleLoading");
		}
	};

	useEffect(() => { if (error) alert(error.message); }, [error]);

	return (
		<form className="space-y-6 px-6 pb-4 bg-gray-200 text-gray-900 rounded-lg shadow-lg p-6">
			<h3 className="text-xl font-medium text-gray-900">Register</h3>
			<div>
				<label htmlFor="email" className="text-sm font-medium block mb-2 text-gray-700">Email</label>
				<input
					onChange={handleChangeInput}
					type="email"
					name="email"
					id="email"
					className="border-2 rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-2.5 bg-gray-100 border-gray-400 placeholder-gray-500"
					placeholder="name@company.com"
				/>
			</div>
			<div>
				<label htmlFor="displayName" className="text-sm font-medium block mb-2 text-gray-700">Display Name</label>
				<input
					onChange={handleChangeInput}
					type="text"
					name="displayName"
					id="displayName"
					className="border-2 rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-2.5 bg-gray-100 border-gray-400 placeholder-gray-500"
					placeholder="John Doe"
				/>
			</div>
			<div>
				<label htmlFor="password" className="text-sm font-medium block mb-2 text-gray-700">Password</label>
				<input
					onChange={handleChangeInput}
					type="password"
					name="password"
					id="password"
					className="border-2 rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-2.5 bg-gray-100 border-gray-400 placeholder-gray-500"
					placeholder="*******"
				/>
			</div>

			<button type="submit" className="w-full text-white bg-gray-800 hover:bg-gray-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
				{loading ? "Registering..." : "Register"}
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

			<div className="text-sm font-medium text-gray-700">
				Already have an account?{" "}
				<a href="#" className="text-gray-900 hover:underline" onClick={handleClick}>
					Log In
				</a>
			</div>
		</form>
	);
};

export default Signup;
