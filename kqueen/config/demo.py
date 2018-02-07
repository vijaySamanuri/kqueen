from .base import BaseConfig


class Config(BaseConfig):
    DEBUG = False
    LOG_LEVEL = 'INFO'

    KQUEEN_HOST = '0.0.0.0'

    # App secret - set this to random string >= 16 chars
    # SECRET_KEY = 'secret'

    # Jenkins engine settings
    JENKINS_API_URL = 'https://ci.mcp.mirantis.net'
    JENKINS_PROVISION_JOB_NAME = 'deploy-aws-k8s_ha_calico_sm'
    JENKINS_PROVISION_JOB_CTX = {
        'STACK_DELETE': 'False'
    }
    JENKINS_DEPROVISION_JOB_NAME = 'deploy-stack-cleanup'
    JENKINS_DEPROVISION_JOB_CTX = {
        'STACK_TYPE': 'aws'
    }
    JENKINS_PARAMETER_MAP = {
        'cluster_name': 'STACK_NAME',
        'cluster_uuid': 'KQUEEN_BUILD_ID'
    }
    JENKINS_USERNAME = None
    JENKINS_PASSWORD = None
