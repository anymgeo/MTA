FROM node:24-bookworm-slim AS build
WORKDIR /workspace/mta.admin
COPY mta.admin/package*.json ./
RUN npm ci
COPY mta.admin .
COPY shared ../shared
ENV NEXT_TELEMETRY_DISABLED=1 API_ORIGIN=http://api:8080 SITE_INTERNAL_ORIGIN=http://site:3000
RUN npm run build
FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /workspace/mta.admin/.next/standalone ./
COPY --from=build --chown=node:node /workspace/mta.admin/.next/static ./mta.admin/.next/static
COPY --from=build --chown=node:node /workspace/mta.admin/public ./mta.admin/public
USER node
EXPOSE 3000
CMD ["node", "mta.admin/server.js"]
