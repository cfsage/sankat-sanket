import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === "hero");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-8">
      <div className="absolute inset-0 z-0">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center text-foreground">
        <h1 className="font-headline text-5xl font-bold tracking-tighter md:text-7xl">
          Resilient Echo
        </h1>
        <p className="mt-4 max-w-2xl text-lg md:text-xl">
          Crowdsourced Climate Resilience Network – Report. Alert. Match. Recover.
        </p>
        <p className="mt-6 max-w-3xl text-muted-foreground">
          A real-time platform for communities to report climate threats, alert those in danger, and match volunteer aid with verified needs, creating a faster, more inclusive, and resilient response network.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/dashboard">
            Enter Dashboard
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </main>
  );
}
