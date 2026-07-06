pipeline {
    agent any

    environment {
        IMAGE_NAME = 'super-server'
        IMAGE_TAG = 'latest'
        CONTAINER_NAME = 'super-server'
        APP_PORT = '3000'
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
                    echo "🛑 停止旧容器..."
                    docker stop ${CONTAINER_NAME} || true
                    docker rm ${CONTAINER_NAME} || true
                '''
            }
        }

        stage('启动新容器') {
            steps {
                sh '''
                    echo "🚀 启动新容器..."
                    docker run -d \
                      --name ${CONTAINER_NAME} \
                      -p ${APP_PORT}:${APP_PORT} \
                      --restart=always \
                      ${IMAGE_NAME}:${IMAGE_TAG}
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