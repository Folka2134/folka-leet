"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function Header() {
  type UserProfile = {
    id: string;
    display_name?: string;
    email: string;
  };

  const [user, setUser] = useState<UserProfile | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        // Get user profile from our users table
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .single();

        setUser(profile);
      }
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!user) return null;

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="flex items-center justify-between p-4 bg-gray-900 text-white">
      <div className="flex items-end text-2xl font-bold ml-25">
        <Image
          src={"/images/folka-leet_logo.png"}
          alt="Folka Leet Logo"
          height={70}
          width={70}
        />
        Folka Leet
      </div>
      <div className="flex items-center gap-4">
        <div>Hello, {user.display_name || user.email}</div>
        <Avatar className="h-10 w-10 bg-green-700">
          <AvatarFallback>
            {getInitials(user.display_name || "")}
          </AvatarFallback>
        </Avatar>
        <Button variant="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
