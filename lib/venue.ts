import { z } from "zod";
import { optionalInt, requiredInt } from "@/lib/form";
import { imageUrlField } from "@/lib/media";

export const VENUE_SURFACE = {
  natural: "Rumput alami",
  artificial: "Rumput sintetis",
  hybrid: "Hybrid",
  futsal: "Futsal",
};

export const venueSchema = z.object({
  name: z.string().trim().min(3, "Nama venue minimal 3 karakter").max(200, "Nama maksimal 200 karakter"),
  city: z.string().trim().min(2, "Kota wajib diisi").max(120),
  province: z.string().trim().max(120).optional(),
  address: z.string().trim().max(500, "Alamat maksimal 500 karakter").optional(),
  surface: z.enum(["natural", "artificial", "hybrid", "futsal"], "Pilih permukaan lapangan"),
  capacity: optionalInt(0, 2_147_483_647, "Kapasitas harus bilangan bulat positif atau nol"),
  fieldCount: requiredInt(1, 2_147_483_647, "Jumlah lapangan minimal satu dan harus bilangan bulat"),
  floodlights: z.preprocess((value) => value === "on", z.boolean()),
  photoUrl: imageUrlField,
  notes: z.string().trim().max(2000, "Catatan maksimal 2000 karakter").optional(),
});
