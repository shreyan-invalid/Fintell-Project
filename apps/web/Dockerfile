FROM node:20-alpine AS base
WORKDIR /app
ENV CYPRESS_INSTALL_BINARY=0

COPY package.json tsconfig.json vite.config.ts ./
COPY index.html ./
COPY src ./src
COPY public ./public

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
RUN pnpm install --frozen-lockfile=false
RUN pnpm build

FROM nginx:1.27-alpine
COPY --from=base /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
