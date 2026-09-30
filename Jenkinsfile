pipeline {
    agent any

    tools {
        jdk    'JDK-11'
        maven  'Maven-3.9'
        nodejs 'Node-16'
    }

    parameters {
        string(name: 'REGISTRY', defaultValue: 'docker.io/your-dockerhub-user', description: 'Docker registry / namespace to push images to')
        string(name: 'FAIL_ON_CVSS', defaultValue: '11', description: 'OWASP Dependency-Check: fail build at/above this CVSS score (11 = report only, 7 = fail on HIGH+)')
        booleanParam(name: 'ENFORCE_QUALITY_GATE', defaultValue: false, description: 'Abort the pipeline if the SonarQube quality gate fails')
        booleanParam(name: 'PUSH_IMAGES', defaultValue: false, description: 'Push images to the registry')
        booleanParam(name: 'DEPLOY', defaultValue: false, description: 'Deploy with docker compose on this agent (main branch only)')
    }

    environment {
        SONAR_SERVER   = 'SonarQube'            // Manage Jenkins > System > SonarQube servers (name)
        REGISTRY_CREDS = 'docker-registry-creds' // Username/password credentials
        NVD_API_KEY    = credentials('nvd-api-key')   // Secret text credentials
        APP_ENV_FILE   = 'obds-env-file'         // Secret file credentials (.env for deployment)
        IMAGE_TAG      = "${env.BUILD_NUMBER}"
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '15'))
        timeout(time: 60, unit: 'MINUTES')
    }

    stages {

        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Build & Unit Test (Maven)') {
            steps {
                sh 'mvn -B clean verify'
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: '**/target/surefire-reports/*.xml'
                }
            }
        }

        stage('OWASP Dependency-Check') {
            steps {
                withEnv(["CVSS_LIMIT=${params.FAIL_ON_CVSS}"]) {
                    // single quotes: the secret is read from the environment, never interpolated by Groovy
                    sh 'mvn -B dependency-check:aggregate -Dnvd.api.key="$NVD_API_KEY" -Ddependency-check.failBuildOnCVSS="$CVSS_LIMIT"'
                }
            }
            post {
                always {
                    dependencyCheckPublisher pattern: '**/dependency-check-report.xml'
                    archiveArtifacts artifacts: '**/dependency-check-report.html', allowEmptyArchive: true
                }
            }
        }

        stage('SonarQube - Java') {
            steps {
                withSonarQubeEnv("${SONAR_SERVER}") {
                    sh 'mvn -B sonar:sonar'
                }
            }
        }

        stage('Quality Gate - Java') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: params.ENFORCE_QUALITY_GATE
                }
            }
        }

        stage('SonarQube - Frontend') {
            steps {
                dir('frontend-service') {
                    script {
                        def scannerHome = tool 'SonarScanner'
                        withSonarQubeEnv("${SONAR_SERVER}") {
                            sh "${scannerHome}/bin/sonar-scanner"
                        }
                    }
                }
            }
        }

        stage('Quality Gate - Frontend') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: params.ENFORCE_QUALITY_GATE
                }
            }
        }

        stage('Frontend dependency audit') {
            steps {
                dir('frontend-service') {
                    sh 'npm ci --ignore-scripts'
                    // Report only; tighten to --audit-level=high once dependencies are upgraded
                    sh 'npm audit --production --audit-level=critical || true'
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh "REGISTRY=${params.REGISTRY} IMAGE_TAG=${IMAGE_TAG} docker compose build"
            }
        }

        stage('Docker Push') {
            when { expression { params.PUSH_IMAGES } }
            steps {
                withCredentials([usernamePassword(credentialsId: env.REGISTRY_CREDS,
                                                  usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
                    sh '''
                        echo "$REG_PASS" | docker login -u "$REG_USER" --password-stdin
                        REGISTRY=$REGISTRY IMAGE_TAG=$IMAGE_TAG docker compose push
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy') {
            when {
                allOf {
                    expression { params.DEPLOY }
                    anyOf { branch 'main'; branch 'master' }
                }
            }
            steps {
                withCredentials([file(credentialsId: env.APP_ENV_FILE, variable: 'ENV_FILE')]) {
                    sh '''
                        cp "$ENV_FILE" .env
                        REGISTRY=$REGISTRY IMAGE_TAG=$IMAGE_TAG docker compose up -d
                        rm -f .env
                    '''
                }
            }
        }
    }

    post {
        success { echo "Build ${env.BUILD_NUMBER} succeeded" }
        failure { echo "Build ${env.BUILD_NUMBER} failed" }
        cleanup { cleanWs(deleteDirs: true, notFailBuild: true) }
    }
}
