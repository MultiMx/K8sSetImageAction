FROM golang:latest AS builder

WORKDIR /build

COPY . .

RUN go env -w GO111MODULE=auto \
    && go env -w CGO_ENABLED=0 \
    && set -ex \
    && go build -ldflags "-s -w -extldflags '-static'" -o runner

FROM alpine:latest

RUN apk update && \
    apk upgrade --no-cache && \
    apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo 'Asia/Shanghai' >/etc/timezone && \
    rm -rf /var/cache/apk/*

COPY --from=builder  /build/runner /usr/bin/runner

RUN chmod +x /usr/bin/runner

WORKDIR /data

ENTRYPOINT [ "/usr/bin/runner" ]