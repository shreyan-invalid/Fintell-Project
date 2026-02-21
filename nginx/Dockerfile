FROM node:20-alpine AS web-build
WORKDIR /web
ENV CYPRESS_INSTALL_BINARY=0

COPY apps/web/package.json apps/web/tsconfig.json apps/web/vite.config.ts ./
COPY apps/web/index.html ./
COPY apps/web/src ./src
COPY apps/web/public ./public

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
RUN pnpm install --frozen-lockfile=false
RUN pnpm build

FROM nginx:1.27-alpine
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=web-build /web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
