import React from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User } from "lucide-react"
import axios from 'axios'
import { useRouter } from 'next/router'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from "@/components/ui/toaster"

const AvatarProfile = () => {
  const router  = useRouter();
  const {toast} = useToast();
  const baseURL = process.env.NEXT_PUBLIC_API_CALL;

  const logout = async () => {
    try{
      console.log('logout');
      
      const res = await axios.delete(`${baseURL}/logout`, {withCredentials: true});
      toast({
        title: "Logout is Success!",
        duration: 2500,
      })
      if(res) router.push('/login')
    }catch(err){
      console.error(err);
      toast({
        title: "Logout is Failed!",
        duration: 2500,
      })
    }
  }

  return (
    <>
      <DropdownMenu>
    {/* <Toaster/> */}
        <DropdownMenuTrigger asChild>
          <Avatar className="cursor-pointer">
            <AvatarImage src="https://github.com/yandaagil.png" />
            <AvatarFallback>YA</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <Link href="">
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/profile/settings">
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4 text-red-500" />
            <span className="text-red-500">Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex flex-col">
        <h6 className="text-sm">Yanda Agil</h6>
        <h6 className="text-sm text-muted-foreground">@yandaagil</h6>
      </div>
    </>
  )
}

export default AvatarProfile