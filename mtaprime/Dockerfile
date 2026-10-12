FROM node:24-bookworm-slim AS build
WORKDIR /workspace/mtaprime
COPY mtaprime/package*.json ./
RUN npm ci
COPY mtaprime .
COPY shared ../shared
ENV NEXT_TELEMETRY_DISABLED=1 API_ORIGIN=http://api:8080
# Fixtures at build time; runtime news reads are uncached and server-rendered.
RUN npm run build
FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /workspace/mtaprime/.next/standalone ./
COPY --from=build --chown=node:node /workspace/mtaprime/.next/static ./mtaprime/.next/static
COPY --from=build --chown=node:node /workspace/mtaprime/public ./mtaprime/public
USER node
EXPOSE 3000
CMD ["node", "mtaprime/server.js"]
