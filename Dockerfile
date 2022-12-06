FROM joseluisq/static-web-server:2-alpine

ENV SERVER_ROOT=/build

COPY build/ /build/
EXPOSE 8080
