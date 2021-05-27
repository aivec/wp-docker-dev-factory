<?php

/**
 * Plugin Name: Mailhog for WordPress
 * Description: This plugin routes your emails to MailHog for development.
 * Author: Evan D Shaw
 * Version: 1.0.0
 * License: GPL2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

/**
 * Modifies WordPress `PHPMailer` instance to send mail to our MailHog SMTP server Docker container
 */
class WPMailHog
{
    /**
     * Registers hooks
     *
     * @author Evan D Shaw <evandanielshaw@gmail.com>
     * @return void
     */
    public function init() {
        $this->defineConstants();
        add_filter('wp_mail_from', [$this, 'setFrom'], 10, 1);
        add_action('phpmailer_init', [$this, 'setPhpMailerToMailHog'], 10, 1);
    }

    /**
     * `PHPMailer`s `setFrom` is invoked before we modify the `From` property directly, which
     * is why we need to filter it here as well or else `wp_mail` throws an error
     *
     * @author Evan D Shaw <evandanielshaw@gmail.com>
     * @param string $from_mail
     * @return string
     */
    public function setFrom($from_mail) {
        $from_mail = WP_MAILHOG_FROM;
        return $from_mail;
    }

    /**
     * Defines MailHog constants
     *
     * @author Evan D Shaw <evandanielshaw@gmail.com>
     * @return void
     */
    public function defineConstants() {
        if (!defined('WP_MAILHOG_HOST')) {
            define('WP_MAILHOG_HOST', 'mailhog');
        }

        if (!defined('WP_MAILHOG_PORT')) {
            define('WP_MAILHOG_PORT', 1025);
        }

        if (!defined('WP_MAILHOG_FROM')) {
            define('WP_MAILHOG_FROM', 'donotreply@wp-local-docker.com');
        }
    }

    /**
     * Overrides `PHPMailer` settings to point to our MailHog Docker container
     *
     * @author Evan D Shaw <evandanielshaw@gmail.com>
     * @param mixed $phpmailer
     * @return void
     */
    public function setPhpMailerToMailHog($phpmailer) {
        $phpmailer->From = WP_MAILHOG_FROM;
        $phpmailer->Sender = WP_MAILHOG_FROM;
        $phpmailer->Host = WP_MAILHOG_HOST;
        $phpmailer->Port = WP_MAILHOG_PORT;
        $phpmailer->SMTPAuth = false;
        $phpmailer->isSMTP();
    }
}

(new WPMailHog())->init();
