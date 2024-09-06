# sudo docker buildx build --platform=linux/arm64,linux/amd64  -t "angelocarlotto/face_login_ui:latest" . --push

#docker push angelocarlotto/face_login_ui:latest

#docker run --rm -p 3001:3000 angelocarlotto/face_login_ui:latest


FROM node:22.8.0-slim

#RUN apt update

#RUN apt install -y  git  

#ADD "https://www.random.org/cgi-bin/randbyte?nbytes=10&format=h" skipcache

#RUN  git clone https://github.com/angelocarlotto/face_login_ui.git && cd face_login_ui &&  npm install

WORKDIR face_login_ui

COPY . .

#RUN npm install -g npm@latest 
#RUN npm install punycode --save
RUN npx next telemetry disable

RUN npm i


#npm warn deprecated rimraf@2.7.1: Rimraf versions prior to v4 are no longer supported                                                                                          
# => => # npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async req 
# => => # uests by a key value, which is much more comprehensive and powerful.                                                                                                           
# => => # npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported     

#RUN npm run build

CMD ["npm","run","dev"]