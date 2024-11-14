<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $imageUrl = $_POST['imageUrl'] ?? '';

    // Parse the path from the URL
    $imagePath = parse_url($imageUrl, PHP_URL_PATH);
    $imageFile = $_SERVER['DOCUMENT_ROOT'] . $imagePath; // Full path to the image

    // Check if file exists and delete it
    if (file_exists($imageFile) && strpos($imagePath, 'uploads/') !== false) {
        if (unlink($imageFile)) {
            echo json_encode(['status' => 'success', 'message' => 'Image deleted successfully.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to delete the image.']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Image not found or invalid path.']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
}