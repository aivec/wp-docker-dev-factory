import path from 'path';
import { expect } from 'chai';
import { readFileSync } from 'fs';
import validateConfig from '../src/validation/validateAll';
import { validateSSHConfig } from '../src/validation/validateSSHConfig';
import { ERR_PROPERTY_REQUIRED, GenericError } from '../src/errors';

describe('Validate instance name', function () {
  it('should throw Error when "instanceName" property is not set', function () {
    const workingdir = path.resolve(__dirname, 'testconfigs/instanceNameNotSet');
    const config = JSON.parse(readFileSync(`${workingdir}/wp-instances.json`, 'utf8'));
    const v = function () {
      validateConfig(config, workingdir);
    };
    expect(v)
      .to.throw('instanceName is required')
      .with.property('code', ERR_PROPERTY_REQUIRED);
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
