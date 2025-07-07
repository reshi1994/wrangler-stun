# wrangler-stun

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

- Accessing self-hosted services (e.g., OpenWRT, Portainer) via a stable public endpoint
- Centralized redirect gateway to multiple internal services
- Optional access control (via token or IP filtering)

## Instruction

### Step1

clone the project codes

```
git clone https://github.com/reshi1994/wrangler-stun.git
```

**_Step2 or Step3 choose one according your working env._**

### Step2

if we need a docker image and create a docker container to builda and deploy the project, then build docker image first.

- build image, can define the image name by set var WRANGLER_IMAGE in .env file.

```
cd wrangler-stun
docker compose build
```

- deploy the docker container

```
docker compose up -d
```

- exec in container

```
docker exec -it wrangler-dev bash
```

- login in cloudflare, in docker container, when we login in , return a website to verify, then redirect to a localhost site ti callback, we should copy the redirect site in another ssh terminal to exec command 'curl "redirect site"' after came in this docker container, then we can success to login in.

```
wrangler login --browser false
```

- copy the site in browser and re copy the redirect site used in verify.
- open another ssh terminal and exec

```
docker exec -it wrangler-dev bash
curl "the redirect site used in verify start with localhost"
```

- close the second ssh teminal
- install packages

```
npm install
```

### Step3

if we already in a nodes environment with 20.*

- install wrangler if we have not wrangler-cli env

```
npm install -g wrangler
cd /workspace
npm install
```

### Step4

### 📄 [`wrangler.jsonc`](https://developers.cloudflare.com/workers/wrangler/configuration/#custom-domains) 配置说明

| **Key**              | **Required** | **Description**                                                                                                                                                                                                                                                                                                     |
| -------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`               | ✅ required   | The name of your Worker. Only alphanumeric characters (`a`, `b`, `c`, etc.) and dashes (`-`) are allowed. Underscores (`_`) are **not** allowed.                                                                                                                                                                    |
| `main`               | ✅ required   | Path to the Worker entry file. Example: `./worker.js`.                                                                                                                                                                                                                                                              |
| `compatibility_date` | ✅ required   | Date string in the format `yyyy-mm-dd` that defines the Workers runtime version. Example: `"2025-07-04"`.                                                                                                                                                                                                           |
| `routes`             | optional     | Specifies the domain routes for your Worker. • `pattern` (required): e.g. `"stun.example.com"` • `custom_domain` (optional): defaults to `false`.                                                                                                                                                           |
| `vars`               | ✅ required   | Environment variables available in your Worker: • `DOMAIN`: Your root domain, e.g. `"example.com"` • `SUBDOMAINS`: Comma-separated list, e.g. `"openwrt,portainer"` • `BEARER_TOKEN`: Default value `"873bd064-47e8-4fba-99e0-2ccd42feb52f"` (used for public port updates — **you must change this**). |
| `d1_databases`       | optional     | Configuration for binding D1 databases to your Worker. • `binding`: Variable name for use in Worker, e.g. `"LUCKY"` • `database_name`: e.g. `"lucky"` • `database_id`: Automatically generated or updated during initialization.                                                                        |
| `workers_dev`        | optional     | Whether to deploy to the `*.workers.dev` subdomain. If using a `custom_domain`, this should usually be set to `false`.                                                                                                                                                                                              |

- init d1, it will create D1 database "lucky" and tables "stun" including column name and port, and will auto create a record name=webs, port=9999

```
node init-d1.mjs
```

- deploy worker, will auto bind D1 database lucky and set env name LUCKY, the ENV var, which used in worker.js.

```
wrangler deploy
```

### Step5

curl your custom_domain or worker_dev doamin to update stun public port.

### 📜 `update_public_port.sh` 参数说明

| **Key**          | **Required** | **Description**                                                   |
| ------------------------ | -------------------- | ------------------------------------------------------------------------- |
| `-p`,`--port`  | ✅ required        | Public port to be updated and written into the database.                |
| `-t`,`--token` | ✅ required        | `BEARER_TOKEN`used for authorization. Must match backend.           |
| `-u`,`--url`   | ✅ required        | Target domain for the Worker, e.g. a `custom domain` or`workers.dev`. |

- in lucky script.

```
/path_to/update_public_port.sh \
  -p "${port}" \
  -u "https://custom_domain/api/update_webs_port" \
  -t "BEAR_TOKEN"
```

- or in curl

```
curl -s -X POST "$WORKER_URL" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"port\": $NEW_PORT}"
```

### Step6

consume public port is `12345`

finally you can try to visit custom_domain or worker dev domain, it will return `{"port": 12345}`

for example: visit `stun.example.com/openwrt`, it will redirect to `openwrt.example.com:12345`

