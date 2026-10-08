"use client"
import { useState } from "react"
import Image from "next/image"

export type GalleryImage = {
  url: string
  alt: string
}

export default function MediaGallery({ images, title = "Gallery" }: { images: GalleryImage[]; title?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (!images.length) return null

  return (
    <div style={{ marginBottom: 40 }}>
      <h2
        style={{
          margin: "0 0 16px",
          fontFamily: "var(--font-display)",
          fontSize: 32,
          fontWeight: 400,
          color: "var(--ink)",
        }}
      >
        {title}
      </h2>
      <div className="media-gallery-grid">
        {images.map((img, i) => (
          <button
            key={img.url + i}
            type="button"
            onClick={() => setOpenIndex(i)}
            style={{
              position: "relative",
              aspectRatio: "1 / 1",
              borderRadius: 14,
              overflow: "hidden",
              border: 0,
              padding: 0,
              cursor: "pointer",
              background: "var(--surface-2)",
            }}
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              sizes="(max-width: 700px) 33vw, 220px"
              style={{ objectFit: "cover" }}
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenIndex(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.85)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            style={{
              position: "absolute",
              top: 20,
              right: 24,
              background: "transparent",
              border: 0,
              color: "white",
              fontSize: 28,
              cursor: "pointer",
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
          {openIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenIndex((idx) => (idx! > 0 ? idx! - 1 : idx))
              }}
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255,255,255,.12)",
                border: 0,
                color: "white",
                fontSize: 22,
                width: 44,
                height: 44,
                borderRadius: "50%",
                cursor: "pointer",
              }}
              aria-label="Previous"
            >
              ‹
            </button>
          )}
          {openIndex < images.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenIndex((idx) => (idx! < images.length - 1 ? idx! + 1 : idx))
              }}
              style={{
                position: "absolute",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255,255,255,.12)",
                border: 0,
                color: "white",
                fontSize: 22,
                width: 44,
                height: 44,
                borderRadius: "50%",
                cursor: "pointer",
              }}
              aria-label="Next"
            >
              ›
            </button>
          )}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative", width: "min(90vw, 1000px)", height: "min(85vh, 800px)" }}
          >
            <Image
              src={images[openIndex].url}
              alt={images[openIndex].alt}
              fill
              sizes="90vw"
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
      )}

      <style>{`
        .media-gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        @media (min-width: 700px) {
          .media-gallery-grid { grid-template-columns: repeat(5, 1fr); }
        }
      `}</style>
    </div>
  )
}
