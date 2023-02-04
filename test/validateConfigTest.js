import path from 'path';
import { expect } from 'chai';
import { readFileSync } from 'fs';
import validateConfig from '../src/validation/validateAll';
import { validateSSHConfig } from '../src/validation/validateSSHConfig';
import { HOST_INVALID, HOST_OR_PORT_REQUIRED, PORT_INVALID } from '../src/validation/validateFullUrl';
import { ERR_PROPERTY_REQUIRED, GenericError } from '../src/errors';

const workingdir = path.resolve(__dirname, 'configs');

describe('Validate "instanceName"', function () {
  it('should throw Error when "instanceName" property is not set', function () {
    const config = JSON.parse(readFileSync(`${workingdir}/wp-instances.template.json`, 'utf8'));
    config.instanceName = null;
    const v = function () {
      validateConfig(config, workingdir);
    };
    expect(v).to.throw('instanceName is required').with.property('code', ERR_PROPERTY_REQUIRED);
  });
});

describe('Validate "containerPort" and "hostName"', function () {
  it('should throw Error when "containerPort" is too low', function () {
    const config = JSON.parse(readFileSync(`${workingdir}/wp-instances.template.json`, 'utf8'));
    config.containerPort = 1;
    const v = function () {
      validateConfig(config, workingdir);
    };
    expect(v).to.throw().with.property('code', PORT_INVALID);
  });
  it('should throw Error when "containerPort" is too high', function () {
    const config = JSON.parse(readFileSync(`${workingdir}/wp-instances.template.json`, 'utf8'));
    config.containerPort = 77777;
    const v = function () {
      validateConfig(config, workingdir);
    };
    expect(v).to.throw().with.property('code', PORT_INVALID);
  });
  it('should throw Error when "hostName" is not a sub-domain of localhost', function () {
    const config = JSON.parse(readFileSync(`${workingdir}/wp-instances.template.json`, 'utf8'));
    config.hostName = 'example.com';
    const v = function () {
      validateConfig(config, workingdir);
    };
    expect(v).to.throw().with.property('code', HOST_INVALID);
  });
  it('should throw Error when "hostName" and "containerPort" are not defined', function () {
    const config = JSON.parse(readFileSync(`${workingdir}/wp-instances.template.json`, 'utf8'));
    const v = function () {
      validateConfig(config, workingdir);
    };
    expect(v).to.throw().with.property('code', HOST_OR_PORT_REQUIRED);
  });
});

describe('Validate SSH config', function () {
  it('should throw Error when "confpath" points to a non-existent file', function () {
    const badFn = function () {
      validateSSHConfig({ confpath: 'non/file' }, '/home');
    };
    expect(badFn).to.throw();
  });
});
