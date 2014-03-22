#!/usr/local/bin/php
<?php

$date = new DateTime();
$timestamp = $date->getTimestamp();
$ttl = 0;
$username = "user1";
$secret_key = "abc";

$t_user = ($timestamp + $ttl) . ':' .  $username;
$t_pass = hash_hmac("sha1", $t_user, $secret_key);

echo "timestamp: " . $timestamp . "\n";
echo "user: " . $t_user . "\n";
echo "pass: " . $t_pass . "\n";

?>
