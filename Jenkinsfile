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

        stage('Archive') {
            steps {
                bat 'powershell -NoProfile -Command "Compress-Archive -Path index.html,script.js,style.css,images -DestinationPath to-do-list.zip -Force"'
                archiveArtifacts artifacts: 'to-do-list.zip', fingerprint: true
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([string(credentialsId: 'netlify-token', variable: 'NETLIFY_AUTH_TOKEN')]) {
                    bat 'npx --yes netlify-cli deploy --prod --dir=. --auth=%NETLIFY_AUTH_TOKEN% --site=dd49b7aa-30bd-40a9-be21-c75bf195a08c'
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}