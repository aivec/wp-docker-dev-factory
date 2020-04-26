import buildFtpConfig from './buildFtpConfig';
import buildEnvVars from './buildEnvVars';
import buildVolumePaths from './buildVolumePaths';
import buildPluginAutoInstallWhitelist from './buildPluginAutoInstallWhitelist';
import { execSync } from 'child_process';
import { _ } from 'lodash';
import { InstanceConfig, FinalInstanceConfig } from '../types';
import buildSSHConfig from './buildSSHConfig';

const buildFinalConfig = (
  config: InstanceConfig,
  workingdir: string,
  topdir: string,
): FinalInstanceConfig => {
  const configCopy: InstanceConfig = _.cloneDeep(config);
  const finalConfig: FinalInstanceConfig = {
    instanceName: configCopy.instanceName,
    containerPort: configCopy.containerPort,
    locale: configCopy.locale ? configCopy.locale : 'en_US',
    localPlugins: configCopy.localPlugins ? configCopy.localPlugins : [],
    localThemes: configCopy.localThemes ? configCopy.localThemes : [],
    downloadPlugins: configCopy.downloadPlugins ? configCopy.downloadPlugins : [],
    networkname: 'wp-dev-instances',
    containerName: `${configCopy.instanceName}_dev_wp`,
    dockerBridgeIP: execSync(
      "docker network inspect bridge -f '{{ (index .IPAM.Config 0).Gateway }}'",
    ).toString(),
    envvars: buildEnvVars(configCopy),
    volumes: buildVolumePaths(configCopy, workingdir),
    alreadyInstalled: buildPluginAutoInstallWhitelist(configCopy, workingdir),
    topdir,
    workingdir,
  };

  if (configCopy.ftp) {
    finalConfig.ftp = buildFtpConfig(configCopy.ftp);
  }

  if (configCopy.ssh) {
    finalConfig.ssh = buildSSHConfig(configCopy.ssh, workingdir);
  }

  return finalConfig;
};

export default buildFinalConfig;
