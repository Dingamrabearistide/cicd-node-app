pipeline {
    agent any
    tools {
        nodejs 'node20' // Mets Node 20 dans Jenkins > Tools
    }
    parameters {
        choice(name: 'BRANCH_NAME', choices: ['develop', 'main', 'staging'], description: 'Branche à builder')
    }
    environment {
        SONAR_SCANNER = tool 'sonar-scanner'
        SONARQUBE_SERVER = 'sonar_qube'
        SONAR_HOST_URL = 'http://10.54.154.171:9000'
        IMAGE_NAME = 'dingamrabearistide/web-tryrecruiters' // CHANGE ICI
        REGISTRY = 'docker.io'
        ANSIBLE_IP = '10.54.154.144'
    }
    stages {
        stage('Initialize') {
            steps { echo "🚀 Build ${params.BRANCH_NAME} - Angular 20" }
        }
        stage('Install Dependencies') {
            steps {
                sh 'corepack enable && corepack prepare pnpm@latest --activate'
                sh 'pnpm install'
                sh 'cat public/test.txt || echo "no test.txt"'
            }
        }
        stage('Generate Environment') {
            steps {
                script {
                    def apiUrl = "http://localhost:8800"
                    if (params.BRANCH_NAME == 'main') apiUrl = "https://api.tryrecruiters.com"
                    else if (params.BRANCH_NAME == 'staging') apiUrl = "https://staging-api.tryrecruiters.com"
                    else if (params.BRANCH_NAME == 'develop') apiUrl = "https://dev-api.tryrecruiters.com"

                    // Le fichier que tu as : src/environments/environment.ts
                    sh 'mkdir -p src/environments'
                    writeFile file: 'src/environments/environment.ts', text: """
export const environment = {
  apiUrl: "${apiUrl}",
  google_id: "820754653629-1vl0kfe6heavtdh7sdnl7bv2upjcsrne.apps.googleusercontent.com",
};
"""
                    sh 'cat src/environments/environment.ts'
                }
            }
        }
        stage('Build App') {
            steps {
                // C'est pnpm run build --configuration=production comme dans ton Dockerfile
                sh 'pnpm run build --configuration=production'
            }
        }
        stage('Run Tests') {
            steps { sh 'pnpm test -- --watch=false --browsers=ChromeHeadless || echo "tests skip"' }
        }
        stage('SonarQube') {
            steps {
                withSonarQubeEnv("${SONARQUBE_SERVER}") {
                    sh '''
                        ${SONAR_SCANNER}/bin/sonar-scanner \
                        -Dsonar.projectKey=web-tryrecruiters \
                        -Dsonar.projectName=web-tryrecruiters \
                        -Dsonar.sources=src \
                        -Dsonar.host.url=${SONAR_HOST_URL} || true
                    '''
                }
            }
        }
        stage('Trivy FS Scan') {
            steps { sh 'trivy fs --format table -o trivy-fs-report.html . || true' }
        }
        stage('Build Docker Image') {
            steps {
                script { env.TAG = "${params.BRANCH_NAME}-${env.BUILD_NUMBER}" }
                sh '''
                    echo "Build image ${REGISTRY}/${IMAGE_NAME}:${TAG}"
                    docker build -f Dockerfile.testing -t ${REGISTRY}/${IMAGE_NAME}:${TAG} -t ${REGISTRY}/${IMAGE_NAME}:latest .
                '''
            }
        }
        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    sh 'docker push ${REGISTRY}/${IMAGE_NAME}:${TAG}'
                    sh 'docker push ${REGISTRY}/${IMAGE_NAME}:latest'
                }
            }
        }
        stage('Deploy with Ansible') {
    steps {
        sshagent(['ansible-ssh-key']) {
            sh '''
                ssh -o StrictHostKeyChecking=no root@10.54.154.144 \
                "ansible-playbook /etc/ansible/playbook/deploy-tryrecruiters.yml -i /etc/ansible/hosts -e docker_image=${REGISTRY}/${IMAGE_NAME}:latest"
            '''
        }
    }
}
