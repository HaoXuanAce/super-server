pipeline {
    agent any

    environment {
        IMAGE_NAME = 'super-server'
        IMAGE_TAG = 'latest'
        API_CONTAINER_NAME = 'super-server'
        WORKER_CONTAINER_NAME = 'super-server-worker'
        APP_PORT = '3000'
        ENV_FILE = '/opt/super-server/.env'
    }

    stages {
        stage('清理工作区') {
            steps {
                cleanWs()
            }
        }

        stage('拉取代码') {
            steps {
                script {
                    retry(3) {
                        timeout(time: 10, unit: 'MINUTES') {
                            git(
                                branch: 'main',
                                changelog: false,
                                poll: false,
                                credentialsId: 'github-ssh',
                                url: 'git@github.com:HaoXuanAce/super-server.git'
                            )
                        }
                    }

                    echo '✅ 代码拉取成功'
                }
            }
        }




        stage('构建 Docker 镜像') {
            steps {
                sh '''
                    echo "🚀 开始构建 Docker 镜像..."
                    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
                '''
            }
        }

        stage('停止旧容器') {
            steps {
                sh '''
                    echo "🛑 停止旧 API 和 Worker 容器..."
                    docker stop ${API_CONTAINER_NAME} ${WORKER_CONTAINER_NAME} || true
                    docker rm ${API_CONTAINER_NAME} ${WORKER_CONTAINER_NAME} || true
                '''
            }
        }

        stage('启动 API 容器') {
            steps {
                sh '''
                    test -r "${ENV_FILE}"

                    echo "🚀 启动 API 容器..."
                    docker run -d \
                      --name ${API_CONTAINER_NAME} \
                      --env-file ${ENV_FILE} \
                      -p ${APP_PORT}:3000 \
                      --restart=always \
                      ${IMAGE_NAME}:${IMAGE_TAG}
                '''
            }
        }

        stage('启动 Worker 容器') {
            steps {
                sh '''
                    echo "🚀 启动图片任务 Worker 容器..."
                    docker run -d \
                      --name ${WORKER_CONTAINER_NAME} \
                      --env-file ${ENV_FILE} \
                      --restart=always \
                      ${IMAGE_NAME}:${IMAGE_TAG} node dist/worker
                '''
            }
        }
    }

    post {
        success {
            echo '✅ 部署成功'
        }

        failure {
            echo '❌ 部署失败，请查看 Jenkins 日志'
        }
    }
}
