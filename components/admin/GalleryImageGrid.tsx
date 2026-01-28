"use client";

import { Image as PrismaImage } from "@prisma/client";
import Image from "next/image";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Trash2, Loader2, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { toggleGalleryVisibility, deleteImage } from "@/actions/admin/gallery-actions";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface GalleryImageGridProps {
    images: PrismaImage[];
}

export function GalleryImageGrid({ images }: GalleryImageGridProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((image) => (
                <GalleryCard key={image.id} image={image} />
            ))}
            {images.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500">
                    Žádné obrázky k zobrazení.
                </div>
            )}
        </div>
    );
}

function GalleryCard({ image }: { image: PrismaImage }) {
    const [isPending, startTransition] = useTransition();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleToggle = () => {
        startTransition(async () => {
            const res = await toggleGalleryVisibility(image.id, image.isGalleryVisible);
            if (res.error) toast.error(res.error);
            else toast.success(image.isGalleryVisible ? "Skryto z galerie" : "Zobrazeno v galerii");
        });
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await deleteImage(image.id, image.publicId);
            if (res.error) toast.error(res.error);
            else toast.success("Obrázek smazán");
        } catch (e) {
            toast.error("Chyba při mazání");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className={`group relative aspect-square rounded-xl overflow-hidden border ${image.isGalleryVisible ? 'border-green-500/50 ring-2 ring-green-500/20' : 'border-gray-200 dark:border-white/10'}`}>
            <Image
                src={image.url}
                alt={image.title || "Gallery Image"}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 20vw"
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
                {image.isGalleryVisible && (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-[10px] h-5 px-1.5">
                        <Eye className="w-3 h-3 mr-1" />
                        Galerie
                    </Badge>
                )}
                {image.visitId && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-black/50 text-white border-none backdrop-blur">Výlet</Badge>}
                {image.newsId && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-blue-500/50 text-white border-none backdrop-blur">Článek</Badge>}
            </div>

            {/* Actions */}
            <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
                <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 bg-white/90 hover:bg-white text-black dark:bg-black/90 dark:text-white"
                    onClick={handleToggle}
                    disabled={isPending || isDeleting}
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : image.isGalleryVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            disabled={isPending || isDeleting}
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Smazat obrázek?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tato akce je nevratná. Obrázek bude smazán z databáze i z Cloudinary.
                                {image.visitId && " Pozor: Tento obrázek je přiřazen k výletu."}
                                {image.newsId && " Pozor: Tento obrázek je součástí článku."}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Zrušit</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Smazat</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
