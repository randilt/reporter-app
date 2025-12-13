import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CarouselProps {
  images: string[]
  className?: string
}

export function Carousel({ images, className }: CarouselProps) {
  const [current, setCurrent] = React.useState(0)

  const next = () => {
    setCurrent((current + 1) % images.length)
  }

  const prev = () => {
    setCurrent((current - 1 + images.length) % images.length)
  }

  if (images.length === 0) {
    return (
      <div className="w-full h-64 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
        No images available
      </div>
    )
  }

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative w-full bg-slate-900 rounded-lg overflow-hidden aspect-video">
        <img
          src={images[current]}
          alt={`Image ${current + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      <div className="flex items-center justify-center gap-2 mt-4">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2 rounded-full transition-all ${
              index === current ? "w-6 bg-slate-900" : "w-2 bg-slate-300"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <div className="text-center mt-2 text-sm text-slate-600">
        {current + 1} / {images.length}
      </div>
    </div>
  )
}
