FROM node:lts-alpine as build
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json src ./
RUN npm run build

FROM node:lts-alpine
COPY --from=build package.json package-lock.json ./
RUN npm ci --production
COPY --from=build dist ./dist
ENV NODE_ENV=production
CMD ["node", "dist/index.js", "watchlist.json"]
