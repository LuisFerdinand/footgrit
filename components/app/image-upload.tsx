"use client";

import * as React from "react";
import { ImagePlus, Link2, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/**
 * Image field with graceful degradation:
 *  - Cloudinary upload widget when NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is set
 *  - otherwise a paste-URL input (initials avatar is the ultimate fallback)
 */
export function ImageUpload({
  name,
  defaultValue,
  label = "Foto",
  displayName,
  shape = "circle",
}: {
  name: string;
  defaultValue?: string | null;
  label?: string;
  displayName: string;
  shape?: "circle" | "square";
}) {
  const [url, setUrl] = React.useState(defaultValue ?? "");
  const [mode, setMode] = React.useState<"upload" | "url">(CLOUD ? "upload" : "url");
  const [Widget, setWidget] = React.useState<React.ComponentType<Record<string, unknown>> | null>(null);

  React.useEffect(() => {
    if (CLOUD && mode === "upload") {
      import("next-cloudinary").then((m) =>
        setWidget(() => m.CldUploadWidget as unknown as React.ComponentType<Record<string, unknown>>),
      );
    }
  }, [mode]);

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-ink-secondary">{label}</span>
      <div className="flex items-center gap-3">
        <Avatar src={url || null} name={displayName} size={56} square={shape === "square"} />
        <div className="flex-1 space-y-2">
          {mode === "upload" && Widget ? (
            <Widget
              signatureEndpoint="/api/cloudinary/sign"
              options={{ folder: "footgrit", sources: ["local", "url"], multiple: false }}
              onSuccess={(res: { info?: { secure_url?: string } }) => {
                if (res.info?.secure_url) setUrl(res.info.secure_url);
              }}
            >
              {({ open }: { open: () => void }) => (
                <Button type="button" variant="outline" size="sm" onClick={() => open()}>
                  <ImagePlus className="size-3.5" /> Unggah gambar
                </Button>
              )}
            </Widget>
          ) : (
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Tempel URL gambar (opsional)"
            />
          )}
          <div className="flex items-center gap-2 text-[11px] text-ink-muted">
            {CLOUD ? (
              <button
                type="button"
                onClick={() => setMode((m) => (m === "upload" ? "url" : "upload"))}
                className="inline-flex items-center gap-1 hover:text-ink"
              >
                <Link2 className="size-3" />
                {mode === "upload" ? "Gunakan URL" : "Unggah ke Cloudinary"}
              </button>
            ) : (
              <span>Cloudinary belum dikonfigurasi — gunakan URL atau avatar inisial otomatis.</span>
            )}
            {url && (
              <button
                type="button"
                onClick={() => setUrl("")}
                className="inline-flex items-center gap-1 hover:text-ink"
              >
                <X className="size-3" /> Hapus
              </button>
            )}
          </div>
        </div>
      </div>
      <input type="hidden" name={name} value={url} />
    </div>
  );
}
