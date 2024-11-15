// Utility Functions
// -----------------
function checkEditorEmpty() {
    if ($('.editor-block').length === 0) {
        $('#editor').addClass('empty');
        $('#editor-footer').show();
    } else {
        $('#editor').removeClass('empty');
        $('#editor-footer').hide();
    }
}

// Main Document Ready Function
// ----------------------------
$(document).ready(function () {
    let editor = $('#editor');
    const textStyleMenu = $('#textStyleMenu');
    const uploadDir = '/uploads/';

    // Toggle between image upload or URL input based on user selection
    $('#imageSourceType').on('change', function () {
        if ($(this).val() === 'upload') {
            $('#imageFileInputContainer').show();
            $('#imageUrlInputContainer').hide();
        } else {
            $('#imageFileInputContainer').hide();
            $('#imageUrlInputContainer').show();
        }
    });

    // Enable resizing for images inside editor blocks
    $(document).on('mouseover', '.editor-block img:not(.no-resize)', function() {
        $(this).resizable({
            aspectRatio: true,
            handles: 'se', // Resizable handle at the bottom-right corner
        });
    });

    // Insert an image block based on user selection (file upload or URL)
    $('#insertImageButton').on('click', function () {
        const sourceType = $('#imageSourceType').val();

        if (sourceType === 'upload') {
            const file = $('#imageFileInput')[0].files[0];
            if (file) {
                const formData = new FormData();
                formData.append('imageFile', file);

                $.ajax({
                    url: 'upload.php',
                    type: 'POST',
                    data: formData,
                    contentType: false,
                    processData: false,
                    dataType: 'json',
                    success: function (response) {
                        if (response.status === 'success') {
                            insertImageBlock(response.url, $('#imageUploadModal').data('afterBlock'));
                        } else {
                            alert(response.message);
                        }
                    },
                    error: function () {
                        alert('Image upload failed.');
                    }
                });
            }
        } else {
            const imageUrl = $('#imageUrlInput').val();
            if (imageUrl) {
                insertImageBlock(imageUrl, $('#imageUploadModal').data('afterBlock'));
            }
        }

        $('#imageUploadModal').modal('hide');
    });

    // Display text style menu when text is selected within content-editable areas
    $(document).on('mouseup', '.content-editable', function (event) {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText.length > 0 && $(selection.anchorNode).closest('.content-editable').length) {
            const range = selection.getRangeAt(0).getBoundingClientRect();
            const menuX = range.left + window.scrollX;
            const menuY = range.top + window.scrollY - 40;
            textStyleMenu.css({top: menuY, left: menuX}).fadeIn(200);
        } else {
            textStyleMenu.hide();
        }
    });

    // Prevent hiding of the text style menu on click within the menu
    textStyleMenu.on('mousedown', function (e) {
        e.preventDefault();
    });

    // Apply text styles like bold, italic, etc., to selected text
    $('.style-btn').on('click', function (e) {
        e.preventDefault();
        const style = $(this).data('style');

        if (style === 'link') {
            const url = prompt("Enter URL:");
            if (url) {
                document.execCommand('createLink', false, url);
            }
        } else {
            document.execCommand(style);
        }

        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0).getBoundingClientRect();
            const menuX = range.left + window.scrollX;
            const menuY = range.top + window.scrollY - 40;
            textStyleMenu.css({top: menuY, left: menuX});
        }
    });

    // Hide text style menu when clicking outside
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.content-editable, #textStyleMenu').length) {
            textStyleMenu.hide();
        }
    });

    // Initialize SortableJS for drag-and-drop functionality within the editor
    var sortable = new Sortable(editor[0], {
        handle: '.drag-handle',
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        forceFallback: true,
        fallbackClass: 'sortable-fallback',
        fallbackOnBody: true,
    });

    // Check if editor is empty on page load to adjust footer visibility
    checkEditorEmpty();

    // Add a new header block when the persistent "+" button is clicked
    $('#add-new-block').on('click', function () {
        insertBlock('header', null);
    });

    // Show block type selection menu when "+" button in block is clicked
    editor.on('click', '.add-block-btn', function (e) {
        e.preventDefault();
        let currentBlock = $(this).closest('.editor-block');
        showBlockTypeMenu($(this), currentBlock);
    });

    // Insert a block based on the selected type from the block type menu
    $('#blockTypeMenu a').on('click', function (e) {
        e.preventDefault();
        let type = $(this).data('type');
        let currentBlock = $('#blockTypeMenu').data('currentBlock');
        insertBlock(type, currentBlock);
        $('#blockTypeMenu').hide();
    });

    // Move a block up within the editor on "Move Up" click
    editor.on('click', '.move-up', function (e) {
        e.preventDefault();
        let block = $(this).closest('.editor-block');
        block.prev('.editor-block').before(block);
    });

    // Move a block down within the editor on "Move Down" click
    editor.on('click', '.move-down', function (e) {
        e.preventDefault();
        let block = $(this).closest('.editor-block');
        block.next('.editor-block').after(block);
    });

    // Delete a block with confirmation
    editor.on('click', '.delete-block', function (e) {
        e.preventDefault();
        e.stopPropagation();

        const deleteOption = $(this);
        const block = deleteOption.closest('.editor-block');

        if (!deleteOption.siblings('.confirm-overlay').length) {
            const confirmOverlay = $('<div class="confirm-overlay">Are you sure?</div>');
            confirmOverlay.css({
                position: 'absolute',
                top: deleteOption.position().top,
                left: deleteOption.position().left + 15,
                background: '#dc3545',
                color: '#fff',
                padding: '5px 10px',
                borderRadius: '5px',
                cursor: 'pointer',
                zIndex: 1000,
            });

            deleteOption.after(confirmOverlay);

            confirmOverlay.on('click', function () {
                const image = block.find('img');
                if (image.length && image.attr('src').includes('/uploads/')) {
                    $.ajax({
                        url: 'delete_image.php',
                        type: 'POST',
                        data: {imageUrl: image.attr('src')},
                        dataType: 'json',
                        success: function (response) {
                            if (response.status === 'success') {
                                block.remove();
                                checkEditorEmpty();
                            } else {
                                alert(response.message || 'Failed to delete image from server.');
                            }
                        },
                        error: function () {
                            alert('Error: Could not delete image from server.');
                        }
                    });
                } else {
                    block.remove();
                    checkEditorEmpty();
                }
                confirmOverlay.remove();
            });
        }
    });

    // Set initial content with a header block
    insertBlock('header', null);
});

// Handle Enter and Shift+Enter in content-editable areas
$(document).on('keydown', '.content-editable', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevent the default Enter key action

        if (e.shiftKey) {
            // If Shift+Enter is pressed, insert a line break (<br>)
            document.execCommand('insertHTML', false, '<br><br>');
        } else {
            // If Enter is pressed without Shift, create a new paragraph block
            const currentBlock = $(this).closest('.editor-block');
            insertBlock('paragraph', currentBlock);
        }
    }
});

// Outside Click Handler
// ---------------------
$(document).on('click', function (event) {
    const isClickInside = $(event.target).closest('#blockTypeMenu, .add-block-btn').length > 0;
    if (!isClickInside) {
        $('#blockTypeMenu').hide();
    }


});

// Block Type Menu Display Function
// --------------------------------
function showBlockTypeMenu(button, currentBlock) {
    let menu = $('#blockTypeMenu');
    let position = button.offset();
    menu.css({
        top: position.top + button.height(),
        left: position.left
    });
    menu.data('currentBlock', currentBlock);
    menu.show();
}

// Block Creation and Insertion Functions
// --------------------------------------
function createBlock() {
    let block = $('<div>', {class: 'editor-block'});
    let addButton = $('<div>', {class: 'add-block-btn'}).html('<i class="fas fa-plus-circle"></i>');
    block.append(addButton);

    let optionsButton = $('<div>', {class: 'block-options'}).html(`
        <div class="dropdown">
          <button class="btn btn-sm btn-light dropdown-toggle" type="button" data-toggle="dropdown">
            <i class="fas fa-ellipsis-v"></i>
          </button>
          <div class="dropdown-menu dropdown-menu-right">
            <a class="dropdown-item move-up" href="#"> <i class="fa fa-arrow-up"></i> Move Up</a>
            <a class="dropdown-item move-down" href="#"><i class="fa fa-arrow-down"></i> Move Down</a>
            <div class="dropdown-divider"></div>
            <a class="dropdown-item text-danger delete-block" data-toggle="dropdown" style="cursor: pointer;"><i class="fa fa-trash"></i> Delete</a>
          </div>
        </div>
      `);
    block.append(optionsButton);


    let dragHandle = $('<div>', {class: 'drag-handle'}).html('<i class="fas fa-bars"></i>');
    block.append(dragHandle);

    return block;
}


function insertBlock(type, afterBlock) {
    let block = createBlock();
    let contentArea;

    switch (type) {
        case 'header':
            contentArea = $('<div>', {
                class: 'content-area content-editable h3',
                contenteditable: true,
                'data-placeholder': 'Header'
            });
            break;
        case 'paragraph':
            contentArea = $('<div>', {
                class: 'content-area content-editable',
                contenteditable: true,
                'data-placeholder': 'Paragraph'
            });
            break;
        case 'image':
            // Create input for image URL
            const urlInput = $('<input>', {
                type: 'text',
                class: 'image-input form-control col-md-6',
                placeholder: 'Enter image URL or drag an image here'
            });

            // Create file input for local file selection
            const fileInput = $('<input>', {
                type: 'file',
                class: 'file-input form-control col-md-6',
                accept: 'image/*',
                style: 'margin-top: 10px;'
            });

            // Error message container
            const imageErrorMessage = $('<div>', {
                class: 'error-message',
                text: 'Invalid image or file upload. Please try again.',
                style: 'display: none; color: red; font-size: 12px;'
            });

            // Create progress bar
            const progressBar = $('<div>', {
                class: 'progress',
                style: 'display: none; margin-top: 10px;'
            }).append($('<div>', {
                class: 'progress-bar',
                role: 'progressbar',
                style: 'width: 0%;',
                'aria-valuenow': '0',
                'aria-valuemin': '0',
                'aria-valuemax': '100'
            }));

            // Handle URL input change
            urlInput.on('change', function () {
                const imageUrl = $(this).val();
                urlInput.css('border-color', '');
                imageErrorMessage.hide();

                const img = new Image();
                img.onload = function () {
                    const imgTag = $('<img>', {
                        src: imageUrl,
                        class: 'img-fluid',
                        alt: 'Uploaded Image'
                    });
                    urlInput.replaceWith(imgTag);
                    fileInput.hide(); // Hide file input when URL is used
                };
                img.onerror = function () {
                    urlInput.css('border-color', 'red');
                    imageErrorMessage.show();
                };
                img.src = imageUrl;
            });

            // Handle local file selection
            fileInput.on('change', function () {
                const file = this.files[0];
                if (file && file.type.startsWith('image/')) {
                    const formData = new FormData();
                    formData.append('imageFile', file);

                    // Show progress bar
                    progressBar.show();
                    const progressBarInner = progressBar.find('.progress-bar');
                    progressBarInner.css('width', '0%').attr('aria-valuenow', 0);

                    $.ajax({
                        url: 'upload.php',
                        type: 'POST',
                        data: formData,
                        contentType: false,
                        processData: false,
                        dataType: 'json',
                        xhr: function () {
                            const xhr = new window.XMLHttpRequest();
                            xhr.upload.addEventListener('progress', function (evt) {
                                if (evt.lengthComputable) {
                                    const percentComplete = Math.round((evt.loaded / evt.total) * 100);
                                    progressBarInner.css('width', percentComplete + '%').attr('aria-valuenow', percentComplete);
                                }
                            }, false);
                            return xhr;
                        },
                        success: function (response) {
                            progressBar.hide();
                            if (response.status === 'success') {
                                const imgTag = $('<img>', {
                                    src: response.url,
                                    class: 'img-fluid',
                                    alt: 'Uploaded Image'
                                });
                                fileInput.replaceWith(imgTag);
                                urlInput.hide(); // Hide URL input when file is used
                            } else {
                                alert(response.message);
                            }
                        },
                        error: function () {
                            progressBar.hide();
                            alert('Image upload failed.');
                        }
                    });
                } else {
                    imageErrorMessage.show();
                }
            });

            // Drag-and-drop functionality
            block.on('dragover', function (e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).addClass('dragging');
            });

            block.on('dragleave', function (e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).removeClass('dragging');
            });

            block.on('drop', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const files = e.originalEvent.dataTransfer.files;
                if (files.length > 0) {
                    fileInput[0].files = files;
                    fileInput.trigger('change');
                }
            });

            // Append all elements to the block
            block.append(urlInput)
                .append(fileInput)
                .append(imageErrorMessage)
                .append(progressBar);
            break;





        case 'link':
            contentArea = $('<input>', {
                type: 'text',
                class: 'link-input form-control col-md-6',
                placeholder: 'Enter URL'
            });
            const errorMessage = $('<div>', {
                class: 'error-message ',
                text: 'Invalid URL. Please try again.',
                style: 'display: none; color: red; font-size: 12px;'
            });

            // Event listener for when URL is entered
            contentArea.on('change', function () {
                const url = $(this).val();

                contentArea.css('border-color', '');
                errorMessage.hide();

                // AJAX call to send URL to url_parser.php
                $.ajax({
                    url: 'url_parser.php',
                    type: 'POST',
                    data: {url: url},
                    dataType: 'json',
                    success: function (response) {
                        // Replace input with formatted content based on OG meta tags
                        const formattedContent = `
                            <div class="link-preview col-md-6">
                                <img src="${response.image}" alt="Preview Image" class="link-image no-resize">
                                <div class="link-info">
                                                    <h3>${response.title}</h3>
                                    <p>${response.description}</p>
                                    <a href="${response.url}" target="_blank">${response.url}</a>
                                </div>
                            </div>`;
                        contentArea.replaceWith(formattedContent);
                    },
                    error: function () {
                        contentArea.css('border-color', 'red');
                        errorMessage.show();
                    }
                });
            });




            contentArea.on('input', function () {
                // Remove error styling on input change
                contentArea.css('border-color', '');
                errorMessage.hide();
            });
            block.append(contentArea).append(errorMessage);
            break;
        case 'embed':
            // Create input for embed URL
            contentArea = $('<input>', { type: 'text', class: 'embed-input form-control col-md-6', placeholder: 'Enter embed URL' });
            const embedErrorMessage = $('<div>', { class: 'error-message', text: 'Invalid URL. Please try again.', style: 'display: none; color: red; font-size: 12px;' });

            // On input change, send URL to embed_parser.php
            contentArea.on('change', function() {
                const embedUrl = $(this).val();

                // Reset any previous error styling
                contentArea.css('border-color', '');
                embedErrorMessage.hide();

                // AJAX call to send URL to embed_parser.php
                $.ajax({
                    url: 'embed_parser.php',
                    type: 'POST',
                    data: { url: embedUrl },
                    dataType: 'json',
                    success: function(response) {
                        // Replace input with embedded content preview
                        const embedPreview = `
                            <div class="embed-preview">
                                <iframe src="${response.embedUrl}" width="560" height="315" frameborder="0" allowfullscreen></iframe>
                            </div>`;
                        contentArea.replaceWith(embedPreview);
                    },
                    error: function() {
                        // Show red border and error message on invalid URL
                        contentArea.css('border-color', 'red');
                        embedErrorMessage.show();
                    }
                });
            });

            // Remove error styling on input
            contentArea.on('input', function() {
                contentArea.css('border-color', '');
                embedErrorMessage.hide();
            });

            block.append(contentArea).append(embedErrorMessage);
            break;
    }

    if (afterBlock) {
        afterBlock.after(block);
    } else {
        $('#editor').append(block);
    }
    contentArea.focus();
    checkEditorEmpty();

    block.append(contentArea);
    if (afterBlock) {
        afterBlock.after(block);
    } else {
        $('#editor').append(block);
    }
    contentArea.focus();
    checkEditorEmpty();
}


function insertImageBlock(src, afterBlock) {
    let block = createBlock();
    let img = $('<img>', {src: src, class: 'img-fluid'});
    block.append(img);
    if (afterBlock) {
        afterBlock.after(block);
    } else {
        $('#editor').append(block);
    }
    checkEditorEmpty();
}

function insertEmbedBlock(url, afterBlock) {
    let block = createBlock();
    let iframe = $('<iframe>', {
        src: url,
        width: '100%',
        height: '400',
        frameborder: '0',
        allowfullscreen: true
    });
    block.append(iframe);
    if (afterBlock) {
        afterBlock.after(block);
    } else {
        $('#editor').append(block);
    }
    checkEditorEmpty();
}
