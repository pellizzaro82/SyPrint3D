# SyPrint3D

Sistema de gestao para operacoes de impressao 3D.

## Stack

- Node.js
- Express
- MongoDB
- Mongoose
- Frontend em HTML, CSS e JavaScript

## Requisitos

- Node.js 18+
- MongoDB em execucao

## Configuracao

Crie um arquivo `.env` na raiz do projeto se quiser sobrescrever as configuracoes padrao.

Variaveis uteis:

- `PORT`: porta do servidor. Padrao `3000`
- `MONGO_URI` ou `MONGODB_URI`: conexao com o MongoDB

Conexao padrao do banco quando nenhuma variavel e informada:

```env
mongodb://127.0.0.1:27017/syprint3d
```

## Instalar dependencias

```bash
npm install
```

## Rodar em desenvolvimento

```bash
npm run dev
```

## Rodar em producao

```bash
npm start
```

## Scripts

- `npm run dev`: inicia com `nodemon`
- `npm start`: inicia o servidor Node
- `npm test`: placeholder atual para testes
- `npm run backfill:owner`: script de ajuste de `ownerUserId`

## Estrutura

- `public/`: frontend e assets estaticos
- `src/controllers/`: controladores da API
- `src/models/`: modelos Mongoose
- `src/routes/`: rotas da API
- `src/services/`: servicos de negocio
- `src/server.js`: bootstrap do servidor

## Observacoes

- O sistema serve o frontend estatico pelo backend Express.
- Ao iniciar o servidor, o bootstrap garante conexao com banco, usuario admin padrao e catalogo de planos.