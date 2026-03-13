"use client";

import AutoScroll from "embla-carousel-auto-scroll";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Container from "@/components/ui/Container";

interface Logo {
  id: string;
  description: string;
  image: string;
  className?: string;
}

const logos: Logo[] = [
  {
    id: "chatgpt",
    description: "ChatGPT",
    image: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
    className: "h-7 w-auto",
  },
  {
    id: "gemini",
    description: "Google Gemini",
    image: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg",
    className: "h-7 w-auto",
  },
  {
    id: "claude",
    description: "Claude",
    image: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Claude_AI_logo.svg",
    className: "h-7 w-auto",
  },
  {
    id: "perplexity",
    description: "Perplexity",
    image: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Perplexity_AI_logo.svg",
    className: "h-7 w-auto",
  },
  {
    id: "deepseek",
    description: "DeepSeek",
    image: "/images/logos/deepseek.png",
    className: "h-7 w-auto",
  },
  {
    id: "copilot",
    description: "Microsoft Copilot",
    image: "/images/logos/copilot-logo.png",
    className: "h-7 w-auto",
  },
  {
    id: "meta-ai",
    description: "Meta AI",
    image: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg",
    className: "h-5 w-auto",
  },
  {
    id: "bing-ai",
    description: "Bing AI",
    image: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Bing_Fluent_Logo.svg",
    className: "h-7 w-auto",
  },
];

export default function SponsorsSection() {
  return (
    <section className="py-12 md:py-14 lg:py-16">
      <Container>
        <div className="flex flex-col items-center text-center">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted/70">
            Monitor your brand across leading AI platforms
          </p>
        </div>
      </Container>

      <div className="pt-8 md:pt-10 lg:pt-12">
        <div className="relative mx-auto flex items-center justify-center lg:max-w-5xl">
          <Carousel
            opts={{ loop: true }}
            plugins={[AutoScroll({ playOnInit: true })]}
          >
            <CarouselContent className="ml-0">
              {logos.map((logo) => (
                <CarouselItem
                  key={logo.id}
                  className="flex basis-1/3 justify-center pl-0 sm:basis-1/4 md:basis-1/5 lg:basis-1/6"
                >
                  <div className="mx-10 flex shrink-0 items-center justify-center opacity-40 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0">
                    <img
                      src={logo.image}
                      alt={logo.description}
                      className={logo.className}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-page to-transparent"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-page to-transparent"></div>
        </div>
      </div>
    </section>
  );
}
