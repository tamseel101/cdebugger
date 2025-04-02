import { auth } from "@/firebase/firebase";
import Link from "next/link";
import React from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import Logout from "../Buttons/Logout";
import { useSetRecoilState } from "recoil";
import { authModalState } from "@/atoms/authModalAtom";
import Image from "next/image";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { BsList } from "react-icons/bs";
import Timer from "../Timer/Timer";
import { useRouter } from "next/router";
import { problems } from "@/utils/problems";
import { Problem } from "@/utils/types/problem";

type TopbarProps = {
	problemPage?: boolean;
};

const Topbar: React.FC<TopbarProps> = ({ problemPage }) => {
	const [user] = useAuthState(auth);
	const setAuthModalState = useSetRecoilState(authModalState);
	const router = useRouter();

	const handleProblemChange = (isForward: boolean) => {
		const { order } = problems[router.query.pid as string] as Problem;
		const direction = isForward ? 1 : -1;
		const nextProblemOrder = order + direction;
		const nextProblemKey = Object.keys(problems).find(
			(key) => problems[key].order === nextProblemOrder
		);

		if (isForward && !nextProblemKey) {
			const firstProblemKey = Object.keys(problems).find(
				(key) => problems[key].order === 1
			);
			router.push(`/problems/${firstProblemKey}`);
		} else if (!isForward && !nextProblemKey) {
			const lastProblemKey = Object.keys(problems).find(
				(key) => problems[key].order === Object.keys(problems).length
			);
			router.push(`/problems/${lastProblemKey}`);
		} else {
			router.push(`/problems/${nextProblemKey}`);
		}
	};

	return (
		<nav className="relative flex h-[50px] w-full shrink-0 items-center px-5 bg-blue-900 text-white">
			<div
				className={`flex w-full items-center justify-between ${
					!problemPage ? "max-w-[1200px] mx-auto" : ""
				}`}
			>
				{/* Logo & Bug Journal (Side by Side) */}
				<div className="flex items-center space-x-4">
					{/* Home Logo */}
					<Link href="/">
						<Image src="/logo-full.png" alt="Logo" height={40} width={40} />
					</Link>

					{/* Bug Journal Icon */}
					<Link href="/journal">
						<Image
							src="/bug-journal.png" // Ensure this image exists in the public folder
							alt="Journal"
							height={40}
							width={40}
							className="cursor-pointer hover:opacity-80 transition duration-300"
						/>
					</Link>
				</div>

				<div className="flex items-center space-x-4 flex-1 justify-end">
					{!user && (
						<Link
							href="/auth"
							onClick={() =>
								setAuthModalState((prev) => ({
									...prev,
									isOpen: true,
									type: "login",
								}))
							}
						>
							<button className="bg-dark-fill-3 py-1 px-2 cursor-pointer rounded">
								Sign In
							</button>
						</Link>
					)}
					{user && problemPage && <Timer />}
					{user && (
						<div className="cursor-pointer group relative">
							<Image
								src="/avatar.png"
								alt="Avatar"
								width={30}
								height={30}
								className="rounded-full"
							/>
							<div
								className="absolute top-10 left-2/4 -translate-x-2/4 mx-auto bg-dark-layer-1 text-brand-orange p-2 rounded shadow-lg 
								z-40 group-hover:scale-100 scale-0 
								transition-all duration-300 ease-in-out"
							>
								<p className="text-sm">{user.email}</p>
							</div>
						</div>
					)}
					{user && <Logout />}
				</div>
			</div>
		</nav>
	);
};

export default Topbar;
