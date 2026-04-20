# WSO2 API Manager Docker Swarm Deployment

This runbook builds a WSO2 API Manager image for this project and deploys it to Docker Swarm on `svcadm@172.20.104.100`.

The target server exposes only port `80` to users. The existing host Nginx service remains the public entry point and reverse proxies WSO2 paths to the local Swarm-published WSO2 ports.

The WSO2 Swarm service publishes `9443`, `8243`, and `8280` on the server so host Nginx can reach them on `127.0.0.1`. Keep those ports blocked from external clients at the firewall/security-group level.

## Target URLs

Use one public host name for all WSO2 web applications:

```text
http://eserviceweb.nws.nama.om/devportal
http://eserviceweb.nws.nama.om/publisher
http://eserviceweb.nws.nama.om/admin
http://eserviceweb.nws.nama.om/carbon
http://eserviceweb.nws.nama.om/console
http://eserviceweb.nws.nama.om/oauth2
http://eserviceweb.nws.nama.om/gateway
```

Important: your current Nginx file redirects `80` to `443`. If the server truly exposes only port `80`, remove that redirect for this deployment. If TLS is required, terminate TLS before this server at a load balancer or firewall that forwards to this server on port `80`.

## Files To Create

Create these files locally before building:

```text
apim/Dockerfile
apim/docker-stack.wso2.yml
```

## 1. Update `apim/deployment.toml`

For reverse proxy on port `80`, WSO2 must know its external URL. Change the top server section from `localhost` to the public host:

```toml
[server]
hostname = "eserviceweb.nws.nama.om"
node_ip = "127.0.0.1"
base_path = "http://eserviceweb.nws.nama.om"
server_role = "default"

[transport.https.properties]
proxyPort = 80
```

Keep the existing admin account and gateway settings unless you are moving to an external database.

For production, replace the default admin password:

```toml
[super_admin]
username = "admin"
password = "CHANGE_THIS_PASSWORD"
create_admin_account = true
```

## 2. Create WSO2 Dockerfile

Create `apim/Dockerfile`:

```dockerfile
FROM wso2/wso2am:4.4.0

COPY deployment.toml /home/wso2carbon/wso2am-4.4.0/repository/conf/deployment.toml
```

## 3. Create Nginx Reverse Proxy Config

Create `/etc/nginx/sites-available/flutter-app`:

```nginx
location = /devportal {
    return 301 /devportal/;
}

location = /publisher {
    return 301 /publisher/;
}

location = /carbon {
    return 301 /carbon/;
}

location = /admin {
    return 301 /admin/;
}

location = /console {
    return 301 /console/;
}

location /devportal/ {
    proxy_pass https://127.0.0.1:9443/devportal/;
    proxy_ssl_verify off;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port 80;
    proxy_set_header X-Forwarded-Proto http;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

location /publisher/ {
    proxy_pass https://127.0.0.1:9443/publisher/;
    proxy_ssl_verify off;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port 80;
    proxy_set_header X-Forwarded-Proto http;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

location /carbon/ {
    proxy_pass https://127.0.0.1:9443/carbon/;
    proxy_ssl_verify off;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port 80;
    proxy_set_header X-Forwarded-Proto http;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

location /admin/ {
    proxy_pass https://127.0.0.1:9443/admin/;
    proxy_ssl_verify off;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port 80;
    proxy_set_header X-Forwarded-Proto http;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

location /console/ {
    proxy_pass https://127.0.0.1:9443/console/;
    proxy_ssl_verify off;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port 80;
    proxy_set_header X-Forwarded-Proto http;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

location /oauth2/ {
    proxy_pass https://127.0.0.1:9443/oauth2/;
    proxy_ssl_verify off;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port 80;
    proxy_set_header X-Forwarded-Proto http;
}

location /authenticationendpoint/ {
    proxy_pass https://127.0.0.1:9443/authenticationendpoint/;
    proxy_ssl_verify off;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port 80;
    proxy_set_header X-Forwarded-Proto http;
}

location /commonauth {
    proxy_pass https://127.0.0.1:9443/commonauth;
    proxy_ssl_verify off;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port 80;
    proxy_set_header X-Forwarded-Proto http;
}

location /gateway/ {
    proxy_pass https://127.0.0.1:8243/;
    proxy_ssl_verify off;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port 80;
    proxy_set_header X-Forwarded-Proto http;
}

```

Notes:

- `devportal`, `publisher`, `admin`, `carbon`, and `console` use WSO2 management port `9443` internally.
- `/gateway/` proxies to WSO2 gateway HTTPS port `8243` internally.
- Existing host Nginx listens on public port `80`.
- Because the upstream WSO2 container uses its default self-signed certificate, `proxy_ssl_verify off` is required unless you install a trusted internal certificate.

## 4. Create Docker Swarm Stack File

Create `apim/docker-stack.wso2.yml`:

```yaml
version: "3.8"

services:
  wso2-apim:
    image: ump-wso2-apim:4.4.0
    hostname: wso2-apim
    ports:
      - target: 9443
        published: 9443
        protocol: tcp
        mode: ingress
      - target: 8243
        published: 8243
        protocol: tcp
        mode: ingress
      - target: 8280
        published: 8280
        protocol: tcp
        mode: ingress
    networks:
      - ump_wso2
    volumes:
      - wso2_repository_database:/home/wso2carbon/wso2am-4.4.0/repository/database
      - wso2_repository_deployment:/home/wso2carbon/wso2am-4.4.0/repository/deployment/server
    deploy:
      replicas: 1
      restart_policy:
        condition: any
        delay: 10s
      update_config:
        order: stop-first
      placement:
        constraints:
          - node.role == manager

networks:
  ump_wso2:
    driver: overlay
    attachable: true

volumes:
  wso2_repository_database:
  wso2_repository_deployment:
```

## 5. Build The WSO2 Image Locally

From the repository root:

```powershell
docker build -t ump-wso2-apim:4.4.0 -f apim/Dockerfile apim
New-Item -ItemType Directory -Force D:\docker-exports\wso2
docker save ump-wso2-apim:4.4.0 -o D:\docker-exports\wso2\ump-wso2-apim-4.4.0.tar
```

## 6. Copy Files To Server

From your local machine using PowerShell:

```powershell
ssh svcadm@172.20.104.100 "mkdir -p /tmp/wso2"
scp D:\docker-exports\wso2\ump-wso2-apim-4.4.0.tar svcadm@172.20.104.100:/tmp/wso2/
scp .\apim\docker-stack.wso2.yml svcadm@172.20.104.100:/tmp/wso2/
```

From Git Bash, use `/d/docker-exports/wso2` for the same Windows folder:

```bash
ssh svcadm@172.20.104.100 "mkdir -p /tmp/wso2"
scp /d/docker-exports/wso2/ump-wso2-apim-4.4.0.tar svcadm@172.20.104.100:/tmp/wso2/
scp ./apim/docker-stack.wso2.yml svcadm@172.20.104.100:/tmp/wso2/
```

## 7. Prepare Docker Swarm On Server

SSH to the server:

```bash
ssh svcadm@172.20.104.100
```

Initialize Swarm if it is not already initialized:

```bash
docker swarm init --advertise-addr 172.20.104.100
```

Load the image on the Swarm node:

```bash
docker load -i /tmp/wso2/ump-wso2-apim-4.4.0.tar
docker image ls | grep ump-wso2-apim
```

If your Swarm has multiple nodes, load the same image tar on every node where the WSO2 service can run, or push the image to your private registry and update `docker-stack.wso2.yml` with that registry image name.

## 8. Deploy Stack

Run from `/tmp/wso2`:

```bash
cd /tmp/wso2
docker stack deploy --resolve-image never -c docker-stack.wso2.yml ump-wso2
```

Check service status:

```bash
docker stack services ump-wso2
docker service logs -f ump-wso2_wso2-apim
```

WSO2 startup can take several minutes.

## 9. Test From Server

From `172.20.104.100`:

```bash
curl -I http://localhost/devportal/
curl -I http://localhost/publisher/
curl -I http://localhost/carbon/
curl -I http://localhost/console/
```

Expected result is HTTP `200`, `302`, or another WSO2 application response. A `502` usually means WSO2 is still starting or host Nginx cannot reach `127.0.0.1:9443` or `127.0.0.1:8243`.

## 10. Test From Client Machine

Make sure DNS points to the server:

```text
eserviceweb.nws.nama.om -> 172.20.104.100
```

Then open:

```text
http://eserviceweb.nws.nama.om/devportal/
http://eserviceweb.nws.nama.om/publisher/
http://eserviceweb.nws.nama.om/carbon/
http://eserviceweb.nws.nama.om/console/
```

## 11. Gateway API URL

When importing APIs into WSO2 Publisher, backend service URLs should use Docker service names on the same Swarm overlay network, for example:

```text
http://auth-service:6001/api/v1
http://master-service:6002/api/v1/master
http://document-service:6003/api/v1/documents
```

Public gateway calls should go through Nginx:

```bash
curl http://eserviceweb.nws.nama.om/gateway/identity/auth/me \
  -H "Authorization: Bearer <access-token>"
```

If your APIs are published in WSO2 with context `/identity`, `/master`, and `/documents`, then `/gateway/identity`, `/gateway/master`, and `/gateway/documents` should route to the WSO2 gateway.

## 12. Update Existing Nginx Site

Your posted Nginx file has an HTTP-to-HTTPS redirect:

```nginx
server {
    listen 80;
    server_name eserviceweb.nws.nama.om;
    return 301 https://$server_name$request_uri;
}
```

For a server that exposes only port `80`, remove this block or replace it with WSO2 proxy locations.

This server already uses host Nginx for the Flutter app, so add the WSO2 locations from section 3 before the final catch-all `location /` block.

If you prefer to define upstreams, use local loopback targets:

```nginx
upstream wso2_mgt {
    server 127.0.0.1:9443;
}

upstream wso2_gateway_https {
    server 127.0.0.1:8243;
}

location /devportal/ {
    proxy_pass https://wso2_mgt/devportal/;
    proxy_ssl_verify off;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port 80;
    proxy_set_header X-Forwarded-Proto http;
}

location /publisher/ {
    proxy_pass https://wso2_mgt/publisher/;
    proxy_ssl_verify off;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port 80;
    proxy_set_header X-Forwarded-Proto http;
}

location /carbon/ {
    proxy_pass https://wso2_mgt/carbon/;
    proxy_ssl_verify off;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port 80;
    proxy_set_header X-Forwarded-Proto http;
}

location /console/ {
    proxy_pass https://wso2_mgt/console/;
    proxy_ssl_verify off;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port 80;
    proxy_set_header X-Forwarded-Proto http;
}

location /gateway/ {
    proxy_pass https://wso2_gateway_https/;
    proxy_ssl_verify off;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port 80;
    proxy_set_header X-Forwarded-Proto http;
}
```

## 13. Common Commands

Redeploy after updating `docker-stack.wso2.yml`:

```bash
cd /tmp/wso2
docker stack deploy --resolve-image never -c docker-stack.wso2.yml ump-wso2
```

Restart WSO2:

```bash
docker service update --force ump-wso2_wso2-apim
```

Remove stack:

```bash
docker stack rm ump-wso2
```

View container tasks:

```bash
docker service ps ump-wso2_wso2-apim
```

## 14. Production Notes

- Do not use H2 database for production. Configure MySQL or PostgreSQL for `apim_db` and `shared_db`.
- Do not keep `admin/admin`.
- Do not allow external client access to WSO2 ports `9443`, `8243`, or `8280`; keep public traffic on Nginx port `80`.
- If HTTPS is mandatory for browser access, terminate TLS before this server and forward traffic to `172.20.104.100:80`.
- WSO2 callbacks and redirects are sensitive to hostname and scheme. If login redirects point to `localhost`, fix `hostname` and `base_path` in `deployment.toml`.
- If Publisher, Developer Portal, or Admin Portal login returns a callback mismatch, enable WSO2 custom callback origin in the portal `settings.json` files and use `X-Forwarded-Host`.

## 15. References

- WSO2 API Manager 4.4.0 reverse proxy and load balancer configuration: https://apim.docs.wso2.com/en/4.4.0/install-and-setup/setup/setting-up-proxy-server-and-the-load-balancer/configuring-the-proxy-server-and-the-load-balancer/
