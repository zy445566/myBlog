# shadowsocks-rust

shadowsocks-rust
```sh
wget https://github.com/shadowsocks/shadowsocks-rust/releases/download/v1.7.2/shadowsocks-v1.7.2-stable.x86_64-unknown-linux-musl.tar.xz
tar xvJf shadowsocks-v1.7.2-stable.x86_64-unknown-linux-musl.tar.xz -C /usr/bin/
```

```sh
echo '{
    "server":"0.0.0.0",
    "server_port":8388,
    "local_address": "127.0.0.1",
    "local_port":1080,
    "password":"54zyw88",
    "timeout":300,
    "method":"aes-256-cfb",
    "fast_open": false
}' > /etc/shadowsocks.json
```
run
```sh
ssserver -c /etc/shadowsocks.json
```
run in back
```
nohup ssserver -c /etc/shadowsocks.json  &
```