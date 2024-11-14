<?php
// Define the upload directory
$uploadDir = 'uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Check if the file was uploaded
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['imageFile'])) {
    $file = $_FILES['imageFile'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

    // Check if the uploaded file is an image
    if (in_array($file['type'], $allowedTypes)) {
        $fileName = basename($file['name']);
        $targetFilePath = $uploadDir . uniqid() . '_' . $fileName;

        // Resize and compress image (optional)
        $imageResource = null;
        if ($file['type'] === 'image/jpeg') {
            $imageResource = imagecreatefromjpeg($file['tmp_name']);
        } elseif ($file['type'] === 'image/png') {
            $imageResource = imagecreatefrompng($file['tmp_name']);
        } elseif ($file['type'] === 'image/gif') {
            $imageResource = imagecreatefromgif($file['tmp_name']);
        }

        // Resize the image if needed
        if ($imageResource) {
            $width = imagesx($imageResource);
            $height = imagesy($imageResource);
            $maxSize = 1000; // Maximum width/height

            if ($width > $maxSize || $height > $maxSize) {
                $scale = min($maxSize / $width, $maxSize / $height);
                $newWidth = (int)($width * $scale);
                $newHeight = (int)($height * $scale);

                $resizedImage = imagecreatetruecolor($newWidth, $newHeight);
                imagecopyresampled($resizedImage, $imageResource, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

                // Save resized image
                imagejpeg($resizedImage, $targetFilePath, 85); // 85 is the compression quality
                imagedestroy($resizedImage);
            } else {
                move_uploaded_file($file['tmp_name'], $targetFilePath);
            }
            imagedestroy($imageResource);
        }

        // Return the image URL
        $scheme = isset($_SERVER['REQUEST_SCHEME']) ? $_SERVER['REQUEST_SCHEME'] : (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http');
        $imageURL = $scheme . '://' . $_SERVER['HTTP_HOST'] . '/' . $targetFilePath;

        echo json_encode(['status' => 'success', 'url' => $imageURL]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid file type. Only JPG, PNG, and GIF are allowed.']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'No file uploaded.']);
}
