# sudo docker build  --build-arg CACHEBUST=$(date +%s)  -t "angelocarlotto/face_login_ui:latest" .

#docker push angelocarlotto/face_login_ui:latest

#docker run --rm -p 3001:3000 angelocarlotto/face_login_ui:latest

FROM ubuntu

RUN apt update

RUN apt install -y nodejs git git-all npm

RUN echo "Cache bust value: ${CACHEBUST}" && git clone https://github.com/angelocarlotto/face_login_ui.git && cd face_login_ui &&  npm install

WORKDIR face_login_ui

CMD ["npm","run","dev"]