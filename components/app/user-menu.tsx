"use client";

import * as React from "react";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from "@/components/ui/dropdown";
import { Avatar } from "@/components/ui/avatar";
import { ROLE_LABEL, type Role } from "@/lib/auth/rbac";
import { logoutAction } from "@/app/(app)/actions";

export function UserMenu({
  name,
  email,
  image,
  role,
  title,
}: {
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  title?: string | null;
}) {
  return (
    <Dropdown>
      <DropdownTrigger>
        <button className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-surface-2">
          <Avatar src={image} name={name} size={28} />
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-medium leading-tight text-ink">
              {name}
            </span>
            <span className="block text-[10px] leading-tight text-ink-muted">
              {ROLE_LABEL[role]}
            </span>
          </span>
          <ChevronDown className="size-3.5 text-ink-muted" />
        </button>
      </DropdownTrigger>
      <DropdownContent>
        <DropdownLabel>{email}</DropdownLabel>
        {title && (
          <p className="px-2.5 pb-1 text-[11px] text-ink-secondary">{title}</p>
        )}
        <DropdownSeparator />
        <DropdownItem>
          <UserIcon />
          Profil saya
        </DropdownItem>
        <DropdownSeparator />
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-danger transition-colors hover:bg-danger/10 [&_svg]:size-3.5"
          >
            <LogOut />
            Keluar
          </button>
        </form>
      </DropdownContent>
    </Dropdown>
  );
}
