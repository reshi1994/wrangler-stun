FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# 第一步：先更新并安装 ca-certificates 和 curl，确保后续换源不会失败
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# 第二步：替换为清华源（已经有证书支持）
RUN sed -i 's|http://archive.ubuntu.com/ubuntu|https://mirrors.tuna.tsinghua.edu.cn/ubuntu|g' /etc/apt/sources.list && \
    sed -i 's|http://security.ubuntu.com/ubuntu|https://mirrors.tuna.tsinghua.edu.cn/ubuntu|g' /etc/apt/sources.list

# 第三步：安装剩余依赖 + Node.js 20
RUN apt-get update && apt-get install -y \
    git \
    bash \
    unzip \
    jq \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 设置 npm 为清华镜像
RUN npm config set registry https://registry.npmmirror.com

# 安装 wrangler
RUN npm install -g wrangler && npm cache clean --force

# 工作目录
WORKDIR /workspace

CMD ["bash"]
