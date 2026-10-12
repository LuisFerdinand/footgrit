"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { OperatorForm, type OperatorData } from "./operator-form";

export function OperatorEdit({ operator }: { operator: OperatorData }) {
  const [open, setOpen] = useState(false);
  return <><Button size="sm" variant="outline" onClick={() => setOpen(true)}>Kelola akun</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent title="Kelola akun operator" description="Ubah nama, email, kata sandi, atau status akun.">
      <div className="p-6"><OperatorForm operator={operator} onDone={() => setOpen(false)} /></div>
    </DialogContent></Dialog>
  </>;
}
