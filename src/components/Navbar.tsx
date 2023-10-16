import Link from "next/link";
import React from "react";
import SignInButton from "./SignInButton";
import { getAuthSession } from "@/lib/auth";
import UserAccountNav from "./UserAccountNav";
import { ThemeToggle } from "./ThemeToggle";
import Image from "next/image";
import IMG from "../../public/assets /coursewarelogo1.png"

type Props = {};

const Nav = async (props: Props) => {
  const session = await getAuthSession();
  return (
    <nav className="fixed inset-x-0 top-0 bg-white dark:bg-gray-950 z-[10] h-fit border-b border-zinc-300 py-2">
      <div className="flex items-center justify-center h-full gap-2 px-8 mx-auto sm:justify-between max-w-7xl">
        <Link href="/gallery" className="items-center hidden gap-2 sm:flex">
          <Image className="ml-[-3rem]" src={IMG} alt="coursewarelogo" height={48} />
        </Link>
        <div className="flex items-center">
        
          {session?.user && (
            <>
             <Link href="/gallery" className="mr-5 p-3 rounded-md" style={{border:'1px solid grey'}}>
            Gallery
            </Link>
              <Link href="/create" className="mr-3 p-3 rounded-md" style={{border:'1px solid grey'}}>
                Create 
              </Link>
              <Link href="/settings" className="mr-3 p-3 rounded-md" style={{border:'1px solid grey'}}>
                Settings
              </Link>
            </>
          )}
          <ThemeToggle className="mr-3" />
          <div className="flex items-center">
            {session?.user ? (
              <UserAccountNav user={session.user} />
            ) : (
              <SignInButton />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
