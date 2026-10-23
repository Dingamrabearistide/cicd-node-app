pipeline {
    agent any

    environment {
        DOCKER_IMAGE_NAME = 'dingamrabearistide/test-node'
        DOCKER_IMAGE_TAG  = 'latest'
        ANSIBLE_SERVER    = 'ansible@10.54.154.144'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/dingamrabearistide/cicd-node-app.git'
            }
        }

        stage('Remove Existing Local Image') {
            steps {
                sh '''
                    docker rmi \
                        "${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}" \
                        || true
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    set -eu
                    docker build \
                        --rm \
                        -t "${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}" .
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonar_qube') {
                    script {
                        def scannerHome = tool 'sonar-scanner' // Nom que tu as mis dans Manage Jenkins > Tools
                        sh """
                            set -eu
                            ${scannerHome}/bin/sonar-scanner \
                                -Dsonar.projectKey=test-node \
                                -Dsonar.sources=. \
                                -Dsonar.exclusions=**/node_modules/**,**/coverage/** \
                                -Dsonar.host.url=${SONAR_HOST_URL}
                        """
                    }
                }
            }
        }

        stage('Push Docker Image to Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'docker-hub-credentials',
                        usernameVariable: 'DOCKERHUB_USERNAME',
                        passwordVariable: 'DOCKERHUB_PASSWORD'
                    )
                ]) {
                    sh '''
                        set -eu
                        set +x
                        printf '%s' "$DOCKERHUB_PASSWORD" |
                            docker login \
                                --username "$DOCKERHUB_USERNAME" \
                                --password-stdin
                        docker push \
                            "${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}"
                        docker logout
                    '''
                }
            }
        }

        stage('Run Ansible Playbook') {
            steps {
                sh '''
                    set -eu
                    ssh \
                        -o BatchMode=yes \
                        "${ANSIBLE_SERVER}" \
                        "ansible-playbook /etc/ansible/playbook/deploy-node.yml"
                '''
            }
        }

        stage('Deploy') {
            steps {
                echo 'Application deployed successfully'
            }
        }
    }

    post {
        success {
            echo 'PIPELINE SUCCESS'
        }
        failure {
            echo 'PIPELINE FAILED'
        }
    }
}
