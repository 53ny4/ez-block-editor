<?php

// json reseponse
header('Content-Type: application/json');

// make response with image, title, description
$response = array(
    'image' => 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',
    'title' => 'Google',
    'description' => 'Google is an American multinational technology company that specializes in Internet-related services and products, which include online advertising technologies, search engine, cloud computing, software, and hardware.',
    'url' => 'https://www.google.com'
);


// return json response
echo json_encode($response);


