# WSO2 APIM Deployment Steps

Use these steps to build the WSO2 APIM Docker image locally, copy it to `svcadm@172.20.104.100`, and deploy it with Docker Swarm.

## 1. Build Image Locally

Open PowerShell from the project root:

```powershell
cd c:\Users\Prasad.N\WorkSpace\NodeJsReact\user-mgmt-platform\ump

docker buildx build --platform linux/amd64 -t ump-wso2-apim:4.4.0 --load -f .\apim\Dockerfile .\apim
```

## 2. Export Image

Create export folder if it does not exist:

```powershell
mkdir D:\docker-exports
mkdir D:\docker-exports\wso2
```

Save the image:

```powershell
docker save -o D:\docker-exports\wso2\ump-wso2-apim-4.4.0.tar ump-wso2-apim:4.4.0
```

## 3. Copy Files To Server

Create server folder:

```powershell
ssh svcadm@172.20.104.100 "mkdir -p /tmp/wso2"
```

Copy the image tar file:

```powershell
scp D:\docker-exports\wso2\ump-wso2-apim-4.4.0.tar svcadm@172.20.104.100:/tmp/wso2/
```

Copy the Swarm stack file:

```powershell
scp D:\docker-exports\wso2\docker-stack.wso2.yml svcadm@172.20.104.100:/tmp/wso2/
```

If using Git Bash, use this path format:

```bash
scp /d/docker-exports/wso2/ump-wso2-apim-4.4.0.tar svcadm@172.20.104.100:/tmp/wso2/
scp ./apim/docker-stack.wso2.yml svcadm@172.20.104.100:/tmp/wso2/
```

## 4. SSH To Server

```bash
ssh svcadm@172.20.104.100
sudo su
```

## 5. Cleanup Old Deployment

```bash
docker stack rm ump-wso2
`docker volume rm ump-wso2_wso2_repository_database ump-wso2_wso2_repository_deployment 2>/dev/null`
docker service rm ump-wso2_wso2-apim 2>/dev/null
docker rm -f $(docker ps -aq --filter ancestor=ump-wso2-apim:4.4.0) 2>/dev/null
docker rmi ump-wso2-apim:4.4.0 2>/dev/null
```

Wait a few seconds after `docker stack rm` before redeploying:

```bash
docker stack ls
docker service ls | grep ump-wso2
```

## 6. Load Image

```bash
cd /tmp/wso2

docker load -i ump-wso2-apim-4.4.0.tar
docker image ls | grep ump-wso2-apim
```

## 7. Deploy Stack

```bash
cd /tmp/wso2

docker stack deploy --resolve-image never --compose-file docker-stack.wso2.yml ump-wso2
docker service update --force ump-wso2_wso2-apim
```

## 8. Verify Deployment

Check stack services:

```bash
docker stack services ump-wso2
docker stack ps ump-wso2
```

Check WSO2 logs:

```bash
docker service logs -f ump-wso2_wso2-apim
```

WSO2 APIM can take several minutes to start.

## 9. Test WSO2 Local Ports On Server

These commands test the WSO2 container through the local published ports:

```bash
curl -k -I https://127.0.0.1:9443/devportal/
curl -k -I https://127.0.0.1:9443/publisher/
curl -k -I https://127.0.0.1:9443/carbon/
curl -k -I https://127.0.0.1:9443/console/
curl -k -I https://127.0.0.1:8243/
```

Expected result is HTTP `200`, `302`, or another WSO2 response.

## 10. Test Through Host Nginx

After host Nginx has the WSO2 reverse proxy locations configured, test public port `80`:

```bash
curl -I http://172.20.104.100/devportal/
curl -I http://172.20.104.100/publisher/
curl -I http://172.20.104.100/carbon/
curl -I http://172.20.104.100/console/
```

Browser URLs:

```text
http://172.20.104.100/devportal/
http://172.20.104.100/publisher/
http://172.20.104.100/carbon/
http://172.20.104.100/console/
```

If DNS is configured:

```text
http://eserviceweb.nws.nama.om/devportal/
http://eserviceweb.nws.nama.om/publisher/
http://eserviceweb.nws.nama.om/carbon/
http://eserviceweb.nws.nama.om/console/
```

## 11. Backup Uploaded Tar

If health check is fine:

```bash
cd /tmp/wso2
mkdir -p /tmp/wso2/bkp
mv ump-wso2-apim-4.4.0.tar /tmp/wso2/bkp/
```

## 12. Useful Commands

Restart WSO2 service:

```bash
docker service update --force ump-wso2_wso2-apim
```

Remove stack:

```bash
docker stack rm ump-wso2
```

Check published ports:

```bash
docker service inspect ump-wso2_wso2-apim --format '{{json .Endpoint.Ports}}'
```

Check container task:

```bash
docker service ps ump-wso2_wso2-apim
```
