import { Link } from 'react-router-dom'

export default function Installation() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold text-text-primary">Instalacao</h1>
        <p className="text-text-secondary max-w-2xl">
          Instale o Shitenno no seu ambiente de desenvolvimento.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <div className="layer-card flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-text-primary">Requisitos</h3>
          <ul className="text-sm text-text-secondary flex flex-col gap-1">
            <li>Node.js 18+ ou superior</li>
            <li>pnpm (recomendado) ou npm</li>
            <li>Terminal / CLI</li>
          </ul>
        </div>

        <div className="layer-card flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-text-primary">Instalacao global</h3>
          <div className="command-block">pnpm add -g shitenno</div>
          <p className="text-xs text-text-muted">Instala o CLI do Shugo globalmente no seu sistema.</p>
        </div>

        <div className="layer-card flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-text-primary">Verificar instalacao</h3>
          <div className="command-block">shugo --version</div>
          <p className="text-xs text-text-muted">Deve retornar a versao instalada do Shugo.</p>
        </div>

        <div className="layer-card flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-text-primary">Inicializar num projeto</h3>
          <div className="command-block">shugo init</div>
          <p className="text-xs text-text-muted">Detecta o stack, gera o profile, e cria a estrutura de governanca.</p>
        </div>
      </section>

      <Link to="/use/first-steps" className="btn btn-primary">
        Proximo: Primeiros passos
      </Link>
    </div>
  )
}
