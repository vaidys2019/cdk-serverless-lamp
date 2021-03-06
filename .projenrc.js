const {
  AwsCdkConstructLibrary,
  GithubWorkflow,
} = require('projen');

const AWS_CDK_LATEST_RELEASE = '1.62.0';
const PROJECT_NAME = 'cdk-serverless-lamp';
const PROJECT_DESCRIPTION = 'A JSII construct lib to build AWS Serverless LAMP with AWS CDK';
const AUTOMATION_TOKEN = 'AUTOMATION_GITHUB_TOKEN';


const project = new AwsCdkConstructLibrary({
  authorName: "Pahud Hsieh",
  authorEmail: "hunhsieh@amazon.com",
  name: PROJECT_NAME,
  description: PROJECT_DESCRIPTION,
  repository: "https://github.com/aws-samples/cdk-serverless-lamp.git",
  antitamper: false,

  keywords: [
    'aws',
    'serverless',
    'lamp'
  ],

  catalog: {
    twitter: 'pahudnet',
    announce: false
  },

  // creates PRs for projen upgrades
  // projenUpgradeSecret: 'PROJEN_GITHUB_TOKEN',

  cdkVersion: AWS_CDK_LATEST_RELEASE,
  cdkDependencies: [
    '@aws-cdk/core',
    '@aws-cdk/aws-apigateway',
    '@aws-cdk/aws-apigatewayv2',
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-lambda',
    '@aws-cdk/aws-secretsmanager',
    '@aws-cdk/aws-rds',
  ],

  python: {
    distName: 'cdk-serverless-lamp',
    module: 'cdk_serverless_lamp'
  }
});


// create a custom projen and yarn upgrade workflow
const workflow = new GithubWorkflow(project, 'ProjenYarnUpgrade');

workflow.on({
  schedule: [{
    cron: '0 6 * * *'
  }], // 6am every day
  workflow_dispatch: {}, // allow manual triggering
});

workflow.addJobs({
  upgrade: {
    'runs-on': 'ubuntu-latest',
    'steps': [
      ...project.workflowBootstrapSteps,

      // yarn upgrade
      {
        run: `yarn upgrade`
      },

      // upgrade projen
      {
        run: `yarn projen:upgrade`
      },

      // submit a PR
      {
        name: 'Create Pull Request',
        uses: 'peter-evans/create-pull-request@v3',
        with: {
          'token': '${{ secrets.' + AUTOMATION_TOKEN + '}}',
          'commit-message': 'chore: upgrade projen',
          'branch': 'auto/projen-upgrade',
          'title': 'chore: upgrade projen and yarn',
          'body': 'This PR upgrades projen and yarn upgrade to the latest version',
        }
      },
    ],
  },
});


const common_exclude = ['cdk.out', 'cdk.context.json', 'docker-compose.yml', 'images', 'yarn-error.log'];
project.npmignore.exclude(...common_exclude, '/codebase');
project.gitignore.exclude(...common_exclude);

project.synth();
