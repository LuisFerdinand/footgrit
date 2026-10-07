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
        <button className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-surface-2 sm:pr-3">
          <Avatar src={image} name={name} size={30} />
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-semibold leading-tight text-ink">
              {name}
            </span>
            <span className="block text-[10px] leading-tight text-ink-muted">
              {ROLE_LABEL[role]}
            </span>
          </span>
          <ChevronDown className="hidden size-3.5 text-ink-muted sm:block" />
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
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-danger transition-colors hover:bg-danger/10 [&_svg]:size-3.5"
          >
            <LogOut />
            Keluar
          </button>
        </form>
      </DropdownContent>
    </Dropdown>
  );
}
