# Instalação

> Como instalar o Shiten no seu ambiente.

---

## Pré-requisitos

- **Node.js** >= 18.0.0
- **npm** (vem com Node.js)
- **Git** (opcional, mas recomendado para detecção de branch)

Verifique sua versão:

```bash
node --version   # Deve mostrar v18.x ou superior
npm --version
git --version    # Opcional
```

---

## Método 1: Instalação Global (recomendado)

Instala o `shiten` como comando global no sistema:

```bash
npm install -g shitenno-go
```

Após instalar, execute:

```bash
shiten --version
```

Se mostrar a versão, está tudo certo.

---

## Método 2: Instalação Local (por projeto)

Instala o `shiten` como dependência do projeto:

```bash
cd seu-projeto
npm install shitenno-go
```

Para usar:

```bash
npx shiten --version
```

---

## Método 3: Do código fonte (desenvolvimento)

Para contribuir ou usar a versão mais recente:

```bash
# Clone o repositório
git clone https://github.com/ednosmab/shitenno-go.git
cd shitenno-go

# Instale dependências
pnpm install

# Compile
pnpm build

# Teste
npx shiten --version
```

---

## Verificação

Após a instalação, verifique se tudo funciona:

```bash
shiten --version
```

Saída esperada:

```
0.1.0
```

---

## Primeira inicialização

Navegue até seu projeto e execute:

```bash
cd seu-projeto
shiten init
```

O Shiten irá:

1. Analisar seu projeto (stack, packages, estrutura)
2. Fazer perguntas sobre maturidade
3. Calcular seu perfil de maturidade
4. Instalar capabilities recomendadas
5. Criar a pasta `shitenno-go/`

→ Veja [Primeiros Passos](quick-start.md) para detalhes.

---

## Solução de problemas

### "shiten: command not found"

Se instalou globalmente, verifique o PATH:

```bash
npm bin -g
```

Adicione o resultado ao seu PATH se necessário.

### "Permission denied"

Use `sudo` (Linux/Mac):

```bash
sudo npm install -g shitenno-go
```

Ou configure npm para não precisar de sudo:

```bash
npm config set prefix ~/.npm-global
```

### "Node.js version not supported"

Atualize o Node.js para versão >= 18.0.0:

```bash
# Com nvm
nvm install 18
nvm use 18
```

---

## Próximo passo

→ [Primeiros Passos](quick-start.md)
