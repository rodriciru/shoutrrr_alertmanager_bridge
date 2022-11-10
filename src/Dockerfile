FROM node:current-alpine

RUN wget https://github.com/containrrr/shoutrrr/releases/latest/download/shoutrrr_linux_amd64.tar.gz \
&& mkdir /shoutrrr && tar zxvf shoutrrr_linux_amd64.tar.gz --directory=/shoutrrr && rm shoutrrr_linux_amd64.tar.gz
RUN mv /shoutrrr/shoutrrr /usr/local/bin/ && rm -r /shoutrrr
RUN mkdir /etc/s_a_b/

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 30000
CMD ["node", "server.js"]