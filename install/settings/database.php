<?php

/* settings/database.php */

return array(
    'mysql' => array(
        'dbdriver' => 'mysql',
        'username' => 'root',
        'password' => '',
        'dbname' => 'edocument',
        'prefix' => 'rp',
    ),
    'tables' => array(
        'user' => 'user',
        'edocument' => 'edocument',
        'edocument_download' => 'edocument_download',
    ),
);
