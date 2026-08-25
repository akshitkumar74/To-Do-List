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
                sh 'npm install'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }

        stage('Archive') {
            steps {
                sh 'zip -r to-do-list.zip index.html script.js style.css images'
                archiveArtifacts artifacts: 'to-do-list.zip', fingerprint: true
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
