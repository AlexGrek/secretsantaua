FROM joseluisq/static-web-server:2-alpine

ENV SERVER_ROOT=/build
ENV WS_HOSTNAME=13.51.255.81:3330

COPY build/ /build/
COPY replacer.sh /
RUN "/replacer.sh" "/build"

EXPOSE 8080
