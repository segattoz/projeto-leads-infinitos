import { useNavigate } from 'react-router-dom'
import { Crosshair } from 'lucide-react'
import { LogoMark } from '@/components/layout/Logo'

/**
 * Abertura do sistema — primeiro frame da apresentação.
 * Não é uma landing page: é uma tela de entrada com identidade de radar.
 */
export function SplashPage() {
  const navigate = useNavigate()

  return (
    <div className="grid-bg relative flex h-screen flex-col items-center justify-center overflow-hidden bg-bg">
      {/* Círculos de radar ao fundo */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
        <div className="relative h-[135vmin] w-[135vmin]">
          {[1, 0.78, 0.56, 0.36, 0.2].map((scale) => (
            <div
              key={scale}
              className="absolute inset-0 rounded-full border border-primary/15"
              style={{ transform: `scale(${scale})` }}
            />
          ))}
          <div className="radar-sweep opacity-50" />
          {/* Pontos de "empresas" detectadas */}
          {[
            { top: '32%', left: '61%' },
            { top: '55%', left: '70%' },
            { top: '64%', left: '38%' },
            { top: '41%', left: '29%' },
            { top: '25%', left: '44%' },
          ].map((pos, i) => (
            <div key={i} className="absolute" style={pos}>
              <span className="absolute h-2 w-2 rounded-full bg-success/80" />
              <span
                className="radar-ping absolute -inset-2 rounded-full border border-success/50"
                style={{ animationDelay: `${i * 0.5}s` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Vinheta para legibilidade */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 15%, var(--color-bg) 75%)' }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center px-6 text-center animate-slide-up">
        <LogoMark className="h-16 w-16" />

        <h1 className="mt-8 text-3xl font-extrabold leading-tight tracking-[0.1em] text-ink sm:text-4xl md:text-5xl">
          i9 <span className="text-primary">RADAR</span>
        </h1>

        <p className="mt-4 font-mono text-[10px] font-medium uppercase tracking-[0.4em] text-faint">
          Inteligência comercial
        </p>

        <p className="mt-8 max-w-md text-base text-muted">
          Do mapeamento de mercado ao fechamento — em uma única plataforma.
        </p>
        <p className="mt-2 text-sm font-medium text-ink/90">
          Encontre quem pode comprar. Priorize quem vale a pena abordar. Feche mais.
        </p>

        <button
          onClick={() => navigate('/app')}
          className="group mt-10 inline-flex h-12 items-center gap-2.5 rounded-lg bg-primary px-8 text-sm font-bold tracking-widest text-white transition-all hover:bg-primary-strong hover:shadow-[0_4px_24px_-4px] hover:shadow-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Crosshair className="h-4 w-4 transition-transform group-hover:rotate-90" />
          ENTRAR NA PLATAFORMA
        </button>

        <p className="mt-12 font-mono text-[10px] tracking-[0.2em] text-faint/80">
          RADAR → PROSPECÇÃO → QUALIFICAÇÃO → FUNIL → FECHAMENTO
        </p>
      </div>
    </div>
  )
}
