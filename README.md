# WordPress Docker Local Environment CLI
The purpose of this library is for easy creation and management of local WordPress development environments with Docker. Essentially, this library uses `visiblevc`'s excellent [Docker images](https://github.com/visiblevc/wordpress-starter) as the base and adds CLI options which make environment management considerably easier. With most other tools the user must manually create/edit/delete `docker-compose.yml` files. This library foregoes that option in favor of `JSON` files specifically made for managing WordPress environments. The user does not need to have any prior knowledge of Docker to use this tool.

Features of this library include:
- Mounting plugins/themes as Docker volumes **regardless of their path on the host system**
- Automatic database creation from an SQL dump file on start-up
- Automatic URL replacement after an SQL dump on start-up
- Downloading and installing plugins/themes **automatically** on start-up
- Downloading and installing private plugins/themes via SSH/FTP **automatically** on start-up
- XDebug built-in for easy debugging of local environments **using the same port number for every environment**
- Easy exporting of an environments database as a `.sql` dump file
- `ngrok` support for easy SSL testing on localhost
- A single `phpMyAdmin` container for all of your environments
- Configurable PHP environment variables

This library is **only for managing development environments** and is not intended for creating production ready containers.
<hr>

## Prerequisites:
- node・npm
- docker
<hr>

## Install
Install globally with `npm`.
```sh
$ npm -g install @aivec/wp-docker-dev-factory
```
<hr>

## Quickstart Guide
To spin-up a minimal environment, create a file named `wp-instances.json` with the following contents:
```json
{
  "instanceName": "my-local-wordpress",
  "containerPort": 8000,
  "locale": "en_US",
  "downloadPlugins": ["wordpress-plugin-1", "wordpress-plugin-2"],
  "localPlugins": [
    "/absolute/path/to/plugin/directory",
    "relative/path/to/plugin/directory",
    "../relative/path/to/plugin/directory"
  ],
  "localThemes": [
    "/absolute/path/to/theme/directory",
    "relative/path/to/theme/directory",
    "../relative/path/to/theme/directory"
  ]
}
```
Where:
- `instanceName` is the title of your website.
- `containerPort` is the port number the environment will expose. In this case the final URL will be `localhost:8000`.
- `locale` is the language you want for the WordPress install.
- `downloadPlugins` is a list of any number of publicly available WordPress plugins to be downloaded.
- `localPlugins` is a list of absolute or relative paths to any number of local plugin folders.
- `localThemes` is a list of absolute or relative paths to any number of local theme folders.

After setting up your config file, invoke the CLI tool from within the folder where your `wp-instances.json` file is saved:
```sh
$ aivec-wpdocker
```

A select prompt will appear:

<img src="media/action-select.png" alt="example action-select" />

Press the enter key on `Run Containers` and wait for the containers to be created (if this is your first time it might take a while). After the containers are created, open your browser and navigate to [localhost:8000/wp-admin](localhost:8000/wp-admin).

You should see the WordPress login screen. Login with the default username and password `root`.
That's it!

A full example config can be found [here](examples/wp-instances.json). For a detailed description of every setting, refer to the [JSON Structure section](#json-structure).
<hr>

## CLI Usage
The CLI is completely interactive. There are two ways to use it:
1. With no arguments
2. With a relative/absolute path

If you invoke `aivec-wpdocker` with no arguments, it will look for a `wp-instances.json` file in the current directory.

Alternatively, you can pass a relative or absolute path as an argument to tell the CLI where it should look for a `wp-instances.json` file. For example, assuming you have a `wp-instances.json` file in a folder called `configs` relative to the current directory, you would invoke the CLI like so:
```sh
$ aivec-wpdocker configs
```
The CLI has seven different operations:
| Operation | Description |
| ----- | ----------- |
| `Run Containers` | This will create and run the `MySQL` and `phpMyAdmin` containers if they are not already created and running, as well as start the `WordPress` container. If the environment's `WordPress` container is already running the CLI will abort with an error. Note that exiting with Ctrl+c will only stop the log stream, not the containers |
| `Stop WordPress Container` | This will stop the `WordPress` container for the selected environment. It **will not** stop the `MySQL` and `phpMyAdmin` containers. |
| `Launch NGROK (local SSL)` | This will start the `ngrok` client for local SSL. Ctrl+c to stop the client. If you use `ngrok`, We **highly recommend** creating a free account on [ngrok.com](ngrok.com) so that you get more connections per minute. |
| `Log WordPress Container` | By default, when you start a `WordPress` container with `Run Containers`, it will stream the `Apache` logs to standard input. You can use this command to pipe the log stream to your console again if you have exited the stream. |
| `Overwrite host dumpfile with DB of currently mounted volume` | This will only work if you specified [mysqlDumpFile](#database.mysqldumpfile) in your config. By invoking this command, the dumpfile, which is mounted as a volume in the container, will be overwritten with a dump of the database of the selected environment |
| `Create new dumpfile with DB of currently mounted volume` | This will create a dumpfile from the database of the selected environment and prompt the user to name the dumpfile. The resultant dumpfile will be placed in a folder called `dumpfiles` in the same folder as `wp-instances.json`. If a `dumpfiles` folder does not already exist, it will be created. |
| `Replace plugin volume with deployment ready bundle (Toggle)` | **NOT YET IMPLEMENTED**. This operation will prompt the user to select a plugin from a list of mounted plugins for the selected environment. If the plugin contains a script named `bundle.sh`, it will be executed and the contents of the generated `.zip` file will temporarily replace the plugin folder contents. Running this command again will revert the plugin back to its original contents. If a `bundle.sh` script does not exist or cannot be executed, an error will occur. |
<hr>

## Environments
Config files can contain any number of environments. To do so, wrap your config objects in an array:
```json
[
    {
        "instanceName": "my-local-wordpress-1",
        "containerPort": 8000,
        "locale": "en_US",
    },
    {
        "instanceName": "my-local-wordpress-2",
        "containerPort": 8010,
        "locale": "en_US",
    },
]
```
The CLI will then prompt you to choose which environment to use:

<img src="media/instance-select.png" alt="example instance-select" />

Every environment has exactly one `WordPress` container associated with it. Conversely, there is only one `MySQL` and `phpMyAdmin` container used for the databases of *all* `WordPress` environments. The naming pattern for containers is as follows:
| Container | Name | Example |
| ----- | ---- | ------ |
| `MySQL` | aivec_wp_mysql | |
| `phpMyAdmin` | aivec_wp_pma | |
| `WordPress` | [instanceName](#instancename) + _dev_wp | test-wordpress_dev_wp |
### Logging in
You can access `phpMyAdmin` at [localhost:22222](localhost:22222) with the following login information:
- Username: `root`
- Password: `root`

For `WordPress` environments that **do not** specify a [mysqlDumpfile](#database.mysqldumpfile), the login information is the same:
- Username: `root`
- Password: `root`
### Lifecycle details
If you specify a [mysqlDumpfile](#database.mysqldumpfile) in your `wp-instances.json` configuration file, it will only be dumped **the first time that environment is created**. This is because even if you [stop the WordPress container](#cli-usage), the `MySQL` container will continue to run. The next time you [run the containers](#cli-usage), the database will already exist so the dumpfile will not be used. If you want a fresh environment every time you [run the containers](#cli-usage), you should delete the database associated with your environment first.
<hr>

## PHP Debugging
Any environment you create will have `XDebug` installed and configured by default listening on port `9900`. Visual Studio Code users can debug with the [PHP Debug extension](https://marketplace.visualstudio.com/items?itemName=felixfbecker.php-debug). Create a `launch.json` file and place it either in the `.vscode` directory of a workspace folder for a plugin/theme, or the `.vscode` directory of a workspace folder specifically for managing PHP debugging.

For users who have many plugins and themes scattered across their filesystem, we recommend creating a workspace folder for managing path mappings of all of those environments with a `launch.json` file like the following:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Listen for XDebug",
      "type": "php",
      "request": "launch",
      "port": 9900,
      "pathMappings": {
        "/var/www/html/wp-content/plugins/my-plugin": "/home/user/path/to/my-plugin",
        "/var/www/html/wp-content/themes/my-theme": "/home/user/path/to/my-theme"
      }
    }
  ]
}

```
For users who would rather have a separate `launch.json` file for each of their plugin/theme workspaces, the file would look something like this:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Listen for XDebug",
      "type": "php",
      "request": "launch",
      "port": 9900,
      "pathMappings": {
        "/var/www/html/wp-content/plugins/my-plugin": "{workspaceRoot}"
      }
    }
  ]
}
```
Some users prefer to keep all of their plugins and themes in a local WordPress installation folder. For those users, only one `launch.json` file is required:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Listen for XDebug",
      "type": "php",
      "request": "launch",
      "port": 9900,
      "pathMappings": {
        "/var/www/html/wp-content": "/absolute/path/to/my/local/wordpress/wp-content"
      }
    }
  ]
}
```
<hr>

## JSON Structure
### -- instanceName
- *Required*
- *Type: `String`*
- Description: The `instanceName` becomes the title of your website. Note that even if you import a database with an SQL dumpfile that contains a WordPress install with a different title, `instanceName` will override it.
<hr>

### -- containerPort
- *Required*
- *Type: `Number`*
- Description: This is the port number for the WordPress installation. The final URL is `localhost` with this port number appended. A `containerPort` of 8000 would result in `localhost:8000`.
<hr>

### -- locale
- *Optional*
- *Type: `String`*
- *Default: `en_US`*
- Description: This is the locale used by WordPress to determine which language to use.
<hr>

### -- database
- *Optional*
- *Type: `Object`*
### -- database.mysqlDumpfile
- *Optional*
- *Type: `String`*
- Description: A relative or absolute path to a `MySQL` dump file with the extension `.sql`. Note that absolute paths are resolved **starting from your home directory** and relative paths are resolved **starting from the folder of the `wp-instances.json` config file**
### -- database.dbName
- *Optional*
- *Type: `String`*
- Description: By default, if you do not specify a `mysqlDumpfile` then the database name will become the `instanceName`. If you do specify a `mysqlDumpfile` and the database name therein is different than the `instanceName`, you must define this property with the database name defined in the dump file.
### -- database.dbPrefix
- *Optional*
- *Type: `String`*
- *Default: `wp_`*
- Description: This is the prefix for table names. Again, if `mysqlDumpfile` is specified but the table prefix therein differs from the default, you must define this property.
#### Example
```json
{
    "database": {
        "mysqlDumpfile": "dumpfiles/testdatabase.sql",
        "dbName": "dbname",
        "dbPrefix": "dbprefix_"
    }
}
```
<hr>

### -- env
- *Optional*
- *Type: `Object`*
- Description: May be any number of arbitrary key-value pairs to be set as PHP environment variables at start-up. The environment variables can then be accessed in PHP via the PHP environmment global `$_ENV`
<hr>

### -- downloadPlugins
- *Optional*
- *Type: `String[]`*
- Description: May be any number of plugins that you want to be installed during environment creation. You must use the plugin `slug` (name of the plugins base folder), not the name. Also, the plugin must be available on `wordpress.org`.
<hr>

### -- localPlugins
- *Optional*
- *Type: `String[]`*
- Description: May be any number of relative or absolute paths pointing to local plugins that you want mapped into the container. Note that absolute paths are resolved **starting from your home directory** and relative paths are resolved **starting from the folder of the `wp-instances.json` config file**
<hr>

### -- localThemes
- *Optional*
- *Type: `String[]`*
- Description: May be any number of relative or absolute paths pointing to local themes that you want mapped into the container. Note that absolute paths are resolved **starting from your home directory** and relative paths are resolved **starting from the folder of the `wp-instances.json` config file**
<hr>

### -- ftp
- *Optional*
- *Type: `Object[]`*
- Description: `ftp` may contain an array of any number of `ftp` config objects
### -- ftp.[{}.confname]
- *Required*
- *Type: `String`*
- Description: If you include an `ftp` config, you must specify the `confname`. `confname` can refer to either a file of the same name in a folder called `aivec-devenv-configs` which exists in your home folder, or the name of one of the properties specified in a file called `ftp.json` which exists in the `aivec-devenv-configs` folder. If you do not have a `aivec-devenv-configs` folder, create one in your home directory. For information about FTP config files, refer to [FTP/SSH Config Files section](#ftp/ssh-config-files).
### -- ftp.[{}.plugins]
- *Optional*
- *Type: `String[]`*
- Description: Can be any number of relative paths to plugin `.zip` files that exist on the FTP server. Paths are resolved relative to the directory that is opened upon access via FTP. **Do not include the extension `.zip` as part of the file name**.
### -- ftp.[{}.themes]
- *Optional*
- *Type: `String[]`*
- Description: Can be any number of relative paths to theme `.zip` files that exist on the FTP server. Paths are resolved relative to the directory that is opened upon access via FTP. **Do not include the extension `.zip` as part of the file name**.
#### Example
```json
{
    "ftp": [
        {
            "confname": "my-ftp-config",
            "plugins": ["relative/path/to/plugin/zipfile/noextension"],
            "themes": ["relative/path/to/theme/zipfile/noextension"]
        }
    ]
}
```
<hr>

### -- ssh
- *Optional*
- *Type: `Object[]`*
- Description: `ssh` may contain an array of any number of `ssh` config objects
### -- ssh.[{}.confname]
- *Required*
- *Type: `String`*
- Description: If you include an `ssh` config, you must specify the `confname`. `confname` can refer to either a file of the same name in a folder called `aivec-devenv-configs` which exists in your home folder, or the name of one of the properties specified in a file called `ssh.json` which exists in the `aivec-devenv-configs` folder. If you do not have a `aivec-devenv-configs` folder, create one in your home directory. For information about SSH config files, refer to [FTP/SSH Config Files section](#ftp/ssh-config-files).
### -- ssh.[{}.plugins]
- *Optional*
- *Type: `String[]`*
- Description: Can be any number of relative paths to plugin `.zip` files that exist on the SSH server. Paths are resolved relative to the directory that is opened upon access via SSH. **Do not include the extension `.zip` as part of the file name**.
### -- ssh.[{}.themes]
- *Optional*
- *Type: `String[]`*
- Description: Can be any number of relative paths to theme `.zip` files that exist on the SSH server. Paths are resolved relative to the directory that is opened upon access via SSH. **Do not include the extension `.zip` as part of the file name**.
#### Example
```json
{
    "ssh": [
        {
            "confname": "my-ssh-config",
            "plugins": ["relative/path/to/plugin/zipfile/noextension"],
            "themes": ["relative/path/to/theme/zipfile/noextension"]
        }
    ]
}
```
<hr>

## FTP/SSH Config Files

