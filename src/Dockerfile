FROM node:current-slim AS BUILD_IMAGE

RUN apt update && apt install -y curl wget

RUN wget https://github.com/containrrr/shoutrrr/releases/latest/download/shoutrrr_linux_amd64.tar.gz \
&& mkdir /shoutrrr && tar zxvf shoutrrr_linux_amd64.tar.gz --directory=/shoutrrr && rm shoutrrr_linux_amd64.tar.gz

RUN curl -sfL https://gobinaries.com/tj/node-prune | bash -s -- -b /usr/local/bin

EXPOSE 30000

WORKDIR /usr/src/app
COPY . ./
RUN npm install --production

RUN npm install -g @vercel/ncc

# remove development dependencies
RUN npm prune --production

# run node prune
RUN /usr/local/bin/node-prune
RUN npm audit fix --force
RUN ncc build server.js -o dist

FROM node:current-alpine
RUN mkdir /etc/s_a_b/
WORKDIR /usr/src/app
COPY --from=BUILD_IMAGE /usr/src/app/dist/index.js .
COPY --from=BUILD_IMAGE /shoutrrr/shoutrrr /usr/local/bin/shoutrrr
CMD ["node", "index.js"]