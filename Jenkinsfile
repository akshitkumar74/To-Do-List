pipeline {
    agent any

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    tools {
        nodejs 'node'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/akshitkumar74/To-Do-List.git'
            }
        }

        stage('Install') {
            steps {
                bat 'npm install'
            }
        }

        stage('Lint') {
            steps {
                bat 'npm run lint'
            }
        }

        stage('Test') {
    steps {
        bat 'npm test'
    }
}

        stage('Security Scan') {
            steps {
                bat 'trivy fs --include-dev-deps --exit-code 1 --severity HIGH,CRITICAL .'
            }
        }

        stage('SonarCloud Analysis') {
            steps {
                withCredentials([string(credentialsId: 'sonarcloud-token', variable: 'SONAR_TOKEN')]) {
                    bat 'npx --yes sonarqube-scanner -Dsonar.organization=akshitkumar74 -Dsonar.projectKey=akshitkumar74_To-Do-List -Dsonar.sources=. -Dsonar.host.url=https://sonarcloud.io -Dsonar.token=%SONAR_TOKEN%'
                }
            }
        }

        stage('Docker Build') {
            steps {
                bat 'docker build -t to-do-list-app:%BUILD_NUMBER% .'
            }
        }

        stage('Archive') {
            steps {
                bat 'powershell -NoProfile -Command "Compress-Archive -Path index.html,todo.html,auth.js,auth.css,supabaseClient.js,script.js,style.css,images -DestinationPath to-do-list.zip -Force"'
                archiveArtifacts artifacts: 'to-do-list.zip', fingerprint: true
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([string(credentialsId: 'vercel-token', variable: 'VERCEL_TOKEN')]) {
                    withEnv([
                        'VERCEL_ORG_ID=team_9sZCT5UF0EVbDMjUGLMKvz2Y',
                        'VERCEL_PROJECT_ID=prj_aXVzh8MAd9TiqfBy1DAdhACJqfkv'
                    ]) {
                        bat 'npx --yes vercel --prod --token=%VERCEL_TOKEN% --yes'
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            mail to: 'akshitchoudhary7409@gmail.com',
                 subject: "✅ Build Success: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                 body: "Build successful!\n\nCheck details: ${env.BUILD_URL}"
        }
        failure {
            mail to: 'akshitchoudhary7409@gmail.com',
                 subject: "❌ Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                 body: "Build failed!\n\nCheck details: ${env.BUILD_URL}"
        }
    }
}