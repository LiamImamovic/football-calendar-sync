"use client";

const PARTICLE_COUNT = 60;
const PARTICLE_COLOR = "#1A4382"; // bleu club

function getParticleStyle(i: number) {
  const left = (i * 17 + 13) % 100;
  const top = (i * 23 + 7) % 100;
  const size = 3 + (i % 4);
  const duration = 15 + (i % 10);
  const delay = (i * 0.2) % 5;
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: size,
    height: size,
    backgroundColor: PARTICLE_COLOR,
    opacity: 0.22,
    animationDuration: `${duration}s`,
    animationDelay: `-${delay}s`,
  };
}

export function ParticlesBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{ backgroundColor: "hsl(var(--background))" }}
      aria-hidden
    >
      <div className="absolute inset-0">
        {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
          <span
            key={i}
            className="particle absolute rounded-full"
            style={getParticleStyle(i)}
          />
        ))}
      </div>
    </div>
  );
}
