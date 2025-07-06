# wrangler-stunwrangler-stun

### 🌐 STUN Redirect Service Based on Cloudflare Workers

This project implements a lightweight redirect service using **Cloudflare Workers**.

It enables access to internal services through a fixed Cloudflare domain using URI path mapping. Incoming requests to specific paths are dynamically redirected to corresponding subdomains with predefined ports.

#### 📌 Example:

```
https://stun.example.com/openwrt
⟶ Redirects to:
https://openwrt.example.com:<public-port>
```

CopyEdit

`https://stun.example.com/openwrt ⟶ Redirects to: https://openwrt.example.com:<configured-port>`

The mapping between subdomain names and ports is stored in a Cloudflare D1 database and can be extended to support dynamic updates or authentication via Bearer token.

#### ✅ Use Cases:

-   Accessing self-hosted services (e.g., OpenWRT, Portainer) via a stable public endpoint
    
-   Centralized redirect gateway to multiple internal services
    
-   Optional access control (via token or IP filtering)
    

## Instruction

### Step1

clone the project codes

```
git clone https://github.com/reshi1994/wrangler-stun.git
```

**_Step2 or Step3 choose one according your working env._**

### Step2

if we need a docker image and create a docker container to builda and deploy the project, then build docker image first.

-   build image, can define the image name by set var WRANGLER_IMAGE in .env file.
    

```
cd wrangler-stun
docker compose build
```

-   deploy the docker container
    

```
docker compose up -d
```

-   exec in container
    

```
docker exec -it wrangler-dev bash
```

-   login in cloudflare, in docker container, when we login in , return a website to verify, then redirect to a localhost site ti callback, we should copy the redirect site in another ssh terminal to exec command 'curl "redirect site"' after came in this docker container, then we can success to login in.
    

```
wrangler login --browser false
```

-   copy the site in browser and re copy the redirect site used in verify.
    
-   open another ssh terminal and exec
    

```
docker exec -it wrangler-dev bash
curl "the redirect site used in verify start with localhost"
```

-   close the second ssh teminal
    
-   install packages
    

```
npm install
```

### Step3

if we already in a nodes environment with 20.*

-   install wrangler if we have not wrangler-cli env
    

```
npm install -g wrangler
cd /workspace
npm install
```

### Step4

wrangler.jsonc args instruction

[**worker.jsonc**](https://developers.cloudflare.com/workers/wrangler/configuration/#custom-domains)

**keys**

**define**

**desc**

name

required

The name of your Worker. Alphanumeric characters (`a`,`b`,`c`, etc.) and dashes (`-`) only. Do not use underscores (`_`)

main

required

The path to the entrypoint of your Worker that will be executed. For example: `./worker.js`

compatibility_date

required

A date in the form `yyyy-mm-dd`, which will be used to determine which version of the Workers runtime is used.

routes

-   `pattern` required
    
    -   The pattern that your Worker should be run on, for example, `"stun.example.com"`.
        
-   `custom_domain` optional
    
    -   Whether the Worker should be on a Custom Domain as opposed to a route. Defaults to `false`.
        

vars

required

-   `DOMAIN` required
    
    -   your domain, for example, `"example.com"`.
        
-   `SUBDOMAINS` required
    

your domain, for example, `"example.com"`.

-   `SUBDOMAINS` required
    
    -   your subdomain, for example, `"openwrt,portainer"`.
        
    -   split by ","
        

-   `BEAR_TOKEN` default
    
    -   default `"873bd064-47e8-4fba-99e0-2ccd42feb52f"`
        
    -   used for update your public port.
        
    -   change your self must !
        

d1_databases

optional

-   `binding` default
    
    -   LUCKY binding name in worker.
        
-   `database_name` default
    
    -   lucky binding database name in d1 database.
        

-   `database_id` default
    
    -   when we init d1 database, it auto generate or updated.
        

workers_dev

optional

-   custom_domain is `true` , workers_dev set `false` .
    

-   init d1
    

```
node init-d1.mjs
```

-   deploy worker
    

```
wrangler deploy
```

### Step5

curl your custom_domain or worker_dev doamin to update stun public port.

**update_public_port.sh**

keys

define

desc

`-p, --port`

required

public port

`-t, --token`

required

BEAR_TOKEN

`-u, --url`

required

custom_domain or worker dev domain

-   in lucky script.
    

```
/path_to/update_public_port.sh \
  -p "${port}" \
  -u "https://custom_domain/api/update_webs_port" \
  -t "BEAR_TOKEN"
```

-   or in curl
    

```
curl -s -X POST "$WORKER_URL" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"port\": $NEW_PORT}"
```

### Step6

consume public port is `12345`

finally you can try custom_domain or worker dev domain, it will return `{"port": 12345}`

for example: visit `stun.example.com/openwrt`, it will redirect to `openwrt.example.com:12345`
