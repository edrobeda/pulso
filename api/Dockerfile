FROM node:20-alpine
WORKDIR /app
# fontconfig + DejaVu: sharp usa librsvg pra rasterizar o SVG da imagem OG
# dinâmica por post (api/lib/ogImage.js) — sem fonte instalada, o texto do
# título sai em branco/caixa no PNG gerado.
RUN apk add --no-cache fontconfig ttf-dejavu
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
COPY lib ./lib
EXPOSE 3000
CMD ["node", "server.js"]
