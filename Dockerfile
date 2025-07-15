# --- Stage 1: ダウンロードandビルド ---
FROM debian:bookworm-slim AS downloader

# ARGでバージョンを指定
ARG NODE_VERSION=22.16.0

# ダウンロードと展開に必要なツールをインストール
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    wget \
    unzip \
    ca-certificates \
    xz-utils \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 成果物を格納するディレクトリを作成
WORKDIR /artifacts

# GumTreeのダウンロードと展開
RUN wget "https://github.com/GumTreeDiff/gumtree/releases/download/v4.0.0-beta2/gumtree-4.0.0-beta2.zip" \
    && unzip "gumtree-4.0.0-beta2.zip" \
    && mv "gumtree-4.0.0-beta2" "gumtree"

# Node.jsの公式バイナリをダウンロードし展開
RUN wget "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-arm64.tar.xz" \
        -O nodejs.tar.xz && \
    tar -xJf nodejs.tar.xz && \
    rm nodejs.tar.xz && \
    mv "node-v${NODE_VERSION}-linux-arm64" nodejs_dist

# --- Stage 2: アプリケーション環境のセットアップ ---
FROM debian:bookworm-slim

# ARGで指定した値の再定義
ARG NODE_VERSION=22.16.0
ARG UID=1000
ARG GID=1000
ARG USERNAME=developer
ARG GROUPNAME=developer

# 環境設定
ENV LANG=C.UTF-8
ENV LC_ALL C.UTF-8
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_HOME=/opt/nodejs
ENV PATH=${NODE_HOME}/bin:${PATH}
ENV PYTHON=/usr/bin/python3
COPY --from=downloader /artifacts/nodejs_dist ${NODE_HOME}

# タイムゾーン設定
ENV TZ=Asia/Tokyo
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# ランタイムとビルドに必要な依存パッケージをインストール
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    sudo \
    openjdk-17-jre \
    procps \
    make \
    git \
    sqlite3 \
    python3 \
    python3-pip \
    build-essential \
    g++ \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# GumTreeのセットアップ
COPY --from=downloader /artifacts/gumtree /opt/gumtree

# グループとユーザーを作成
RUN (getent group ${GROUPNAME} || groupadd -g ${GID} ${GROUPNAME}) && \
    (getent passwd ${USERNAME} || useradd -u ${UID} -g ${GROUPNAME} -d /home/${USERNAME} -m -s /bin/bash ${USERNAME}) && \
    echo "${USERNAME} ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/${USERNAME} && \
    chmod 0440 /etc/sudoers.d/${USERNAME}

# ユーザーを切り替え
USER ${USERNAME}
# ユーザー切り替え後の作業ディレクトリ
ENV WORK_DIR=/home/${USERNAME}/works
WORKDIR ${WORK_DIR}

# package.jsonとpackage-lock.jsonをコピー
COPY --chown=${USERNAME}:${GROUPNAME} package.json package-lock.json ./

# Node.js依存関係のインストール
RUN npm install

# GumTreeをPATHに追加
ENV PATH="/opt/gumtree/bin:${PATH}"

# データディレクトリの作成
RUN mkdir -p /home/${USERNAME}/works/data /home/${USERNAME}/works/logs /home/${USERNAME}/works/exports

# ボリュームマウントポイント
VOLUME ["/home/${USERNAME}/works/data", "/home/${USERNAME}/works/logs", "/home/${USERNAME}/works/exports"]
