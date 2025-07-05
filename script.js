// Comic Book Reader JavaScript

// DOM Elements
const uploadArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const uploadContainer = document.getElementById('upload-container');
const readerContainer = document.getElementById('reader-container');
const loadingOverlay = document.getElementById('loading-overlay');
const comicTitle = document.getElementById('comic-title');
const pageCounter = document.getElementById('page-info');
const bookViewer = document.getElementById('book-viewer');
const book = document.getElementById('book');
const thumbnailsContainer = document.getElementById('thumbnails');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const singlePageViewBtn = document.getElementById('single-page-btn');
const doublePageViewBtn = document.getElementById('double-page-btn');
const zoomInBtn = document.getElementById('zoom-in-btn');
const zoomOutBtn = document.getElementById('zoom-out-btn');
const fullscreenBtn = document.getElementById('fullscreen-toggle');
const themeToggleBtn = document.getElementById('theme-toggle');
const recentList = document.getElementById('recent-list');
const backBtn = document.getElementById('back-btn');
const bookmarkBtn = document.getElementById('bookmark-btn');
const guidedViewBtn = document.getElementById('guided-view-btn');

// Log DOM elements to check if they're properly selected
console.log('DOM Elements:', {
    uploadArea,
    fileInput,
    browseBtn,
    uploadContainer,
    readerContainer,
    loadingOverlay,
    comicTitle,
    pageCounter,
    bookViewer,
    book,
    thumbnailsContainer,
    prevPageBtn,
    nextPageBtn,
    singlePageViewBtn,
    doublePageViewBtn,
    zoomInBtn,
    zoomOutBtn,
    fullscreenBtn,
    themeToggleBtn,
    recentList,
    backBtn
});

// State
let currentComic = {
    title: '',
    pages: [],
    currentPage: 0,
    totalPages: 0,
    viewMode: 'single', // 'single' or 'double'
    zoom: 1,
    recentComics: [],
    bookmarks: [],
    guidedView: false,
    guidedViewIndex: 0
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing Comic Reader');
    console.log('JSZip available:', typeof JSZip !== 'undefined');
    
    // Check if all required elements exist
    const requiredElements = {
        uploadArea,
        fileInput,
        browseBtn,
        uploadContainer,
        readerContainer,
        loadingOverlay
    };
    
    let missingElements = [];
    Object.entries(requiredElements).forEach(([name, element]) => {
        if (!element) {
            missingElements.push(name);
        }
    });
    
    if (missingElements.length > 0) {
        console.error('Missing required DOM elements:', missingElements);
        alert('Error: Some page elements are missing. Please refresh the page.');
        return;
    }
    
    console.log('All required elements found, initializing...');
    initDragAndDrop();
    initEventListeners();
    loadRecentComics();
    console.log('Comic Reader initialized successfully');
});

// Load recent comics from localStorage
function loadRecentComics() {
    try {
        const recentComics = JSON.parse(localStorage.getItem('recentComics')) || [];
        currentComic.recentComics = recentComics;
        renderRecentComics();
    } catch (error) {
        console.error('Error loading recent comics:', error);
        currentComic.recentComics = [];
    }
}

// Save recent comics to localStorage
function saveRecentComics() {
    try {
        localStorage.setItem('recentComics', JSON.stringify(currentComic.recentComics));
    } catch (error) {
        console.error('Error saving recent comics:', error);
    }
}

// Add comic to recent list
function addToRecentComics(comic) {
    // Remove if already exists
    currentComic.recentComics = currentComic.recentComics.filter(c => c.title !== comic.title);
    
    // Add to beginning of array
    currentComic.recentComics.unshift({
        title: comic.title,
        pages: comic.totalPages,
        coverUrl: comic.pages[0]?.url || '',
        data: comic.pages // Store the actual comic data
    });
    
    // Limit to 5 recent comics
    if (currentComic.recentComics.length > 5) {
        currentComic.recentComics.pop();
    }
    
    saveRecentComics();
    renderRecentComics();
}

// Render recent comics list
function renderRecentComics() {
    recentList.innerHTML = '';
    
    if (currentComic.recentComics.length === 0) {
        recentList.innerHTML = '<p class="empty-message">No recent comics</p>';
        return;
    }
    
    currentComic.recentComics.forEach(comic => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        item.innerHTML = `
            <img src="${comic.coverUrl || 'assets/placeholder.svg'}" alt="${comic.title}">
            <div class="recent-item-info">
                <div class="recent-item-title">${comic.title}</div>
                <div class="recent-item-pages">${comic.pages} pages</div>
            </div>
        `;
        
        item.addEventListener('click', () => {
            loadSavedComic(comic);
        });
        
        recentList.appendChild(item);
    });
}

// Load a saved comic from recent list
function loadSavedComic(comic) {
    currentComic.title = comic.title;
    currentComic.pages = comic.data;
    currentComic.totalPages = comic.pages;
    currentComic.currentPage = 0;
    
    showReader();
    renderPages();
    renderThumbnails();
    updatePageCounter();
    updateComicTitle();
}

// Initialize drag and drop functionality
function initDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        uploadArea.classList.add('drag-over');
    }
    
    function unhighlight() {
        uploadArea.classList.remove('drag-over');
    }
    
    uploadArea.addEventListener('drop', handleDrop, false);
}

// Handle file drop
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        handleFiles(files);
    }
}

// Initialize event listeners
function initEventListeners() {
    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    });
    
    // Browse button click
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Upload area click
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Back button click
    backBtn.addEventListener('click', showUpload);
    
    // Navigation buttons
    prevPageBtn.addEventListener('click', navigateToPrevPage);
    nextPageBtn.addEventListener('click', navigateToNextPage);
    
    // View mode buttons
    singlePageViewBtn.addEventListener('click', () => setViewMode('single'));
    doublePageViewBtn.addEventListener('click', () => setViewMode('double'));
    
    // Zoom buttons
    zoomInBtn.addEventListener('click', zoomIn);
    zoomOutBtn.addEventListener('click', zoomOut);
    
    // Fullscreen button
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    // Theme toggle button
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    // Bookmark button
    bookmarkBtn.addEventListener('click', toggleBookmark);
    
    // Guided view button
    guidedViewBtn.addEventListener('click', toggleGuidedView);
    
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Touch events for mobile swipe
    let touchStartX = 0;
    let touchEndX = 0;
    
    bookViewer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    bookViewer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        if (touchEndX < touchStartX - swipeThreshold) {
            // Swipe left - next page
            navigateToNextPage();
        }
        if (touchEndX > touchStartX + swipeThreshold) {
            // Swipe right - previous page
            navigateToPrevPage();
        }
    }
}

// Handle keyboard navigation
function handleKeyboardNavigation(e) {
    // Only if reader is visible
    if (readerContainer.classList.contains('hidden')) return;
    
    switch (e.key) {
        case 'ArrowRight':
        case ' ':
            navigateToNextPage();
            break;
        case 'ArrowLeft':
            navigateToPrevPage();
            break;
        case 'Home':
            navigateToPage(0);
            break;
        case 'End':
            navigateToPage(currentComic.totalPages - 1);
            break;
        case 'f':
        case 'F':
            toggleFullscreen();
            break;
        case '+':
            zoomIn();
            break;
        case '-':
            zoomOut();
            break;
        case 'Escape':
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
            break;
    }
}

// Handle uploaded files
function handleFiles(files) {
    const file = files[0];
    
    if (!file) {
        alert('No file selected');
        return;
    }
    
    console.log('File selected:', file.name, 'Size:', (file.size / (1024 * 1024)).toFixed(2) + 'MB', 'Type:', file.type);
    
    // Check if file is a .cbz or .zip file
    const validExtensions = ['.cbz', '.zip'];
    const fileExtension = file.name.toLowerCase();
    const isValidFile = validExtensions.some(ext => fileExtension.endsWith(ext));
    
    if (!isValidFile) {
        alert('Please upload a .cbz or .zip file containing comic images.');
        return;
    }
    
    // Check file size (limit to 100MB for browser processing)
    if (file.size > 100 * 1024 * 1024) {
        alert('File is too large. Please upload a file smaller than 100MB.');
        return;
    }
    
    // Check if file is empty
    if (file.size === 0) {
        alert('The file is empty. Please upload a valid comic book file.');
        return;
    }
    
    showLoading();
    document.getElementById('loading-message').textContent = 'Preparing to extract comic...';
    console.log('Starting comic extraction process for:', file.name);
    
    // Extract comic title from filename
    const title = file.name.replace(/\.cbz$/i, '');
    currentComic.title = title;
    console.log('Comic title set to:', title);
    
    // Small delay to allow the UI to update before heavy processing
    setTimeout(() => {
        try {
            // Check if JSZip is available
            if (typeof JSZip !== 'function') {
                throw new Error('JSZip library is not loaded properly. Please refresh the page and try again.');
            }
            
            // Parse the .cbz file
            parseComicBook(file);
        } catch (error) {
            console.error('Error in handleFiles:', error);
            alert(`Error preparing the comic: ${error.message}`);
            hideLoading();
        }
    }, 100);
}

// Parse the .cbz file (which is a ZIP file)
async function parseComicBook(file) {
    try {
        console.log('Starting to parse comic book file:', file.name, 'Size:', (file.size / (1024 * 1024)).toFixed(2) + 'MB');
        
        // Use JSZip to extract the contents
        console.log('Creating JSZip instance...');
        const zip = new JSZip();
        if (!zip) {
            throw new Error('JSZip library not loaded properly');
        }
        
        console.log('Loading zip file into JSZip...');
        document.getElementById('loading-message').textContent = 'Reading comic book file...';
        
        // Load the zip file
        const zipData = await zip.loadAsync(file);
        console.log('Zip file loaded successfully. File entries:', Object.keys(zipData.files).length);
        
        // Get all image files
        const imageFiles = [];
        const imageRegex = /\.(jpe?g|png|gif|webp)$/i;
        
        // Process each file in the zip
        const promises = [];
        let fileCount = 0;
        let totalEntries = 0;
        
        console.log('Scanning for image files in the archive...');
        document.getElementById('loading-message').textContent = 'Scanning for images...';
        
        // Count total entries for logging
        Object.keys(zipData.files).forEach(() => {
            totalEntries++;
        });
        
        console.log(`Archive contains ${totalEntries} total entries`);
        
        zipData.forEach((relativePath, zipEntry) => {
            // Log all entries for debugging
            console.log(`Entry: ${relativePath}, isDir: ${zipEntry.dir}`);
            
            if (!zipEntry.dir && imageRegex.test(relativePath)) {
                fileCount++;
                console.log('Found image file:', relativePath);
                const promise = zipEntry.async('blob').then(blob => {
                    console.log(`Extracted ${relativePath}, size: ${(blob.size / 1024).toFixed(2)}KB`);
                    const url = URL.createObjectURL(blob);
                    imageFiles.push({
                        name: relativePath,
                        blob: blob,
                        url: url
                    });
                    document.getElementById('loading-message').textContent = `Extracting comic... (${imageFiles.length}/${fileCount})`;
                }).catch(err => {
                    console.error(`Error extracting ${relativePath}:`, err);
                    throw new Error(`Failed to extract image: ${relativePath}. ${err.message}`);
                });
                promises.push(promise);
            }
        });
        
        if (fileCount === 0) {
            console.error('No image files found in the archive');
            document.getElementById('loading-message').textContent = 'No images found in this file';
            throw new Error('No image files found in the CBZ archive. The file may be corrupted or not a valid comic book.');
        }
        
        console.log(`Found ${fileCount} image files in the archive`);
        document.getElementById('loading-message').textContent = `Extracting ${fileCount} images...`;
        
        // Wait for all files to be processed
        await Promise.all(promises);
        console.log('All files processed successfully');
        
        // Sort files by name (to ensure correct page order)
        imageFiles.sort((a, b) => {
            // Natural sort to handle numeric filenames correctly
            return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        });
        
        console.log('Files sorted, preparing to display. First file:', imageFiles[0]?.name);
        
        // Set comic data
        currentComic.pages = imageFiles;
        currentComic.totalPages = imageFiles.length;
        currentComic.currentPage = 0;
        
        // Add to recent comics
        addToRecentComics({
            title: currentComic.title,
            totalPages: currentComic.totalPages,
            pages: currentComic.pages
        });
        
        // Show the reader
        document.getElementById('loading-message').textContent = 'Preparing comic viewer...';
        showReader();
        loadBookmarks();
        renderPages();
        renderThumbnails();
        updatePageCounter();
        updateComicTitle();
        
        hideLoading();
        console.log('Comic book loaded successfully with', currentComic.totalPages, 'pages');
    } catch (error) {
        console.error('Error parsing comic book:', error);
        alert(`Error parsing the comic book file: ${error.message}. Please try another file.`);
        hideLoading();
    }
}

// Show the reader and hide the upload container
function showReader() {
    uploadContainer.classList.add('hidden');
    readerContainer.classList.remove('hidden');
}

// Show the upload container and hide the reader
function showUpload() {
    uploadContainer.classList.remove('hidden');
    readerContainer.classList.add('hidden');
}

// Show loading overlay
function showLoading() {
    loadingOverlay.classList.remove('hidden');
}

// Hide loading overlay
function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

// Render pages in the book viewer
function renderPages() {
    book.innerHTML = '';
    
    if (currentComic.pages.length === 0) return;
    
    // Clear previous transform
    book.style.transform = `scale(${currentComic.zoom})`;
    
    // Handle guided view
    if (currentComic.guidedView) {
        renderGuidedView();
        return;
    }
    
    if (currentComic.viewMode === 'single') {
        renderSinglePage();
    } else {
        renderDoublePages();
    }
    
    updateNavigationButtons();
    updateBookmarkButton();
}

// Render a single page
function renderSinglePage() {
    book.className = 'book single-view';
    
    const currentPageData = currentComic.pages[currentComic.currentPage];
    if (!currentPageData) return;
    
    const page = document.createElement('div');
    page.className = 'page';
    
    const img = document.createElement('img');
    img.src = currentPageData.url;
    img.alt = `Page ${currentComic.currentPage + 1}`;
    img.onload = () => {
        // Adjust book dimensions based on image aspect ratio
        const imgAspect = img.naturalWidth / img.naturalHeight;
        if (imgAspect > 1) {
            // Landscape image
            book.style.width = '80%';
            book.style.height = 'auto';
        } else {
            // Portrait image (typical for comics)
            book.style.height = '85%';
            book.style.width = 'auto';
        }
    };
    
    page.appendChild(img);
    book.appendChild(page);
}

// Render double pages side by side
function renderDoublePages() {
    book.className = 'book double-view';
    
    // First page (left side)
    const leftPageIndex = currentComic.currentPage % 2 === 0 ? 
        currentComic.currentPage : 
        currentComic.currentPage - 1;
    
    if (leftPageIndex >= 0 && leftPageIndex < currentComic.totalPages) {
        const leftPageData = currentComic.pages[leftPageIndex];
        const leftPage = document.createElement('div');
        leftPage.className = 'page left-side';
        
        const leftImg = document.createElement('img');
        leftImg.src = leftPageData.url;
        leftImg.alt = `Page ${leftPageIndex + 1}`;
        leftPage.appendChild(leftImg);
        book.appendChild(leftPage);
    }
    
    // Second page (right side)
    const rightPageIndex = leftPageIndex + 1;
    if (rightPageIndex < currentComic.totalPages) {
        const rightPageData = currentComic.pages[rightPageIndex];
        const rightPage = document.createElement('div');
        rightPage.className = 'page right-side';
        
        const rightImg = document.createElement('img');
        rightImg.src = rightPageData.url;
        rightImg.alt = `Page ${rightPageIndex + 1}`;
        rightPage.appendChild(rightImg);
        book.appendChild(rightPage);
    }
    
    // Adjust book dimensions
    book.style.height = '85%';
    book.style.width = 'auto';
}

// Render thumbnails
function renderThumbnails() {
    thumbnailsContainer.innerHTML = '';
    
    currentComic.pages.forEach((page, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'thumbnail';
        if (index === currentComic.currentPage) {
            thumbnail.classList.add('active');
        }
        
        const img = document.createElement('img');
        img.src = page.url;
        img.alt = `Thumbnail ${index + 1}`;
        
        thumbnail.appendChild(img);
        thumbnail.addEventListener('click', () => navigateToPage(index));
        
        thumbnailsContainer.appendChild(thumbnail);
    });
    
    // Scroll to active thumbnail
    const activeThumbnail = thumbnailsContainer.querySelector('.thumbnail.active');
    if (activeThumbnail) {
        activeThumbnail.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }
}

// Update page counter
function updatePageCounter() {
    if (currentComic.totalPages === 0) {
        pageCounter.textContent = '0 / 0';
        return;
    }
    
    pageCounter.textContent = `${currentComic.currentPage + 1} / ${currentComic.totalPages}`;
}

// Update comic title
function updateComicTitle() {
    comicTitle.textContent = currentComic.title || 'Comic Book';
}

// Update navigation buttons
function updateNavigationButtons() {
    prevPageBtn.disabled = currentComic.currentPage <= 0;
    
    if (currentComic.viewMode === 'single') {
        nextPageBtn.disabled = currentComic.currentPage >= currentComic.totalPages - 1;
    } else {
        // In double page mode, we need to check if we're at the last pair of pages
        const lastPagePair = Math.floor((currentComic.totalPages - 1) / 2) * 2;
        nextPageBtn.disabled = currentComic.currentPage >= lastPagePair;
    }
}

// Navigate to previous page
function navigateToPrevPage() {
    if (currentComic.currentPage <= 0) return;
    
    if (currentComic.viewMode === 'single') {
        navigateToPage(currentComic.currentPage - 1);
    } else {
        // In double page mode, go back two pages
        navigateToPage(Math.max(0, currentComic.currentPage - 2));
    }
}

// Navigate to next page
function navigateToNextPage() {
    if (currentComic.currentPage >= currentComic.totalPages - 1) return;
    
    if (currentComic.viewMode === 'single') {
        navigateToPage(currentComic.currentPage + 1);
    } else {
        // In double page mode, go forward two pages
        navigateToPage(Math.min(currentComic.totalPages - 1, currentComic.currentPage + 2));
    }
}

// Navigate to specific page
function navigateToPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= currentComic.totalPages) return;
    
    // Add page turn animation
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        if (pageIndex > currentComic.currentPage) {
            page.style.animation = 'pageTurn 0.5s forwards';
        } else if (pageIndex < currentComic.currentPage) {
            page.style.animation = 'pageReverse 0.5s forwards';
        }
    });
    
    // Update current page after animation
    setTimeout(() => {
        currentComic.currentPage = pageIndex;
        renderPages();
        renderThumbnails();
        updatePageCounter();
    }, 300);
}

// Set view mode (single or double)
function setViewMode(mode) {
    if (mode === currentComic.viewMode) return;
    
    currentComic.viewMode = mode;
    
    // Update active button
    singlePageViewBtn.classList.toggle('active', mode === 'single');
    doublePageViewBtn.classList.toggle('active', mode === 'double');
    
    renderPages();
    updateNavigationButtons();
}

// Zoom in
function zoomIn() {
    currentComic.zoom = Math.min(2, currentComic.zoom + 0.1);
    book.style.transform = `scale(${currentComic.zoom})`;
}

// Zoom out
function zoomOut() {
    currentComic.zoom = Math.max(0.5, currentComic.zoom - 0.1);
    book.style.transform = `scale(${currentComic.zoom})`;
}

// Toggle fullscreen
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        readerContainer.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// Toggle theme (light/dark)
function toggleTheme() {
    document.body.setAttribute('data-theme', 
        document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    
    // Update icon
    themeToggleBtn.innerHTML = document.body.getAttribute('data-theme') === 'dark' 
        ? '<i class="fas fa-sun"></i>' 
        : '<i class="fas fa-moon"></i>';
}

// Toggle bookmark for current page
function toggleBookmark() {
    const currentPage = currentComic.currentPage;
    const bookmarkIndex = currentComic.bookmarks.indexOf(currentPage);
    
    if (bookmarkIndex === -1) {
        // Add bookmark
        currentComic.bookmarks.push(currentPage);
        bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
        bookmarkBtn.classList.add('active');
        showNotification('Page bookmarked!');
    } else {
        // Remove bookmark
        currentComic.bookmarks.splice(bookmarkIndex, 1);
        bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i>';
        bookmarkBtn.classList.remove('active');
        showNotification('Bookmark removed!');
    }
    
    // Save bookmarks to localStorage
    saveBookmarks();
}

// Save bookmarks to localStorage
function saveBookmarks() {
    try {
        const bookmarks = {
            [currentComic.title]: currentComic.bookmarks
        };
        localStorage.setItem('comicBookmarks', JSON.stringify(bookmarks));
    } catch (error) {
        console.error('Error saving bookmarks:', error);
    }
}

// Load bookmarks from localStorage
function loadBookmarks() {
    try {
        const bookmarks = JSON.parse(localStorage.getItem('comicBookmarks')) || {};
        currentComic.bookmarks = bookmarks[currentComic.title] || [];
        updateBookmarkButton();
    } catch (error) {
        console.error('Error loading bookmarks:', error);
        currentComic.bookmarks = [];
    }
}

// Update bookmark button state
function updateBookmarkButton() {
    const isBookmarked = currentComic.bookmarks.includes(currentComic.currentPage);
    bookmarkBtn.innerHTML = isBookmarked ? '<i class="fas fa-bookmark"></i>' : '<i class="far fa-bookmark"></i>';
    bookmarkBtn.classList.toggle('active', isBookmarked);
}

// Toggle guided view mode
function toggleGuidedView() {
    currentComic.guidedView = !currentComic.guidedView;
    currentComic.guidedViewIndex = 0;
    
    guidedViewBtn.classList.toggle('active', currentComic.guidedView);
    
    if (currentComic.guidedView) {
        showNotification('Guided view enabled - click to navigate panels');
        renderGuidedView();
    } else {
        showNotification('Guided view disabled');
        renderPages();
    }
}

// Render guided view (panel-by-panel navigation)
function renderGuidedView() {
    if (!currentComic.guidedView) return;
    
    book.innerHTML = '';
    book.className = 'book guided-view';
    
    const currentPageData = currentComic.pages[currentComic.currentPage];
    if (!currentPageData) return;
    
    const page = document.createElement('div');
    page.className = 'page guided-page';
    
    const img = document.createElement('img');
    img.src = currentPageData.url;
    img.alt = `Page ${currentComic.currentPage + 1}`;
    
    // Add click handler for panel navigation
    img.addEventListener('click', handlePanelClick);
    
    page.appendChild(img);
    book.appendChild(page);
    
    showNotification(`Guided view: Click on panels to navigate (${currentComic.guidedViewIndex + 1}/4)`);
}

// Handle panel clicks in guided view
function handlePanelClick(e) {
    if (!currentComic.guidedView) return;
    
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Simple panel detection based on quadrants
    const width = rect.width;
    const height = rect.height;
    
    let panelIndex = 0;
    if (x < width / 2 && y < height / 2) panelIndex = 0; // Top-left
    else if (x >= width / 2 && y < height / 2) panelIndex = 1; // Top-right
    else if (x < width / 2 && y >= height / 2) panelIndex = 2; // Bottom-left
    else panelIndex = 3; // Bottom-right
    
    currentComic.guidedViewIndex = panelIndex;
    
    // Highlight the selected panel
    highlightPanel(e.target, panelIndex);
    
    showNotification(`Panel ${panelIndex + 1} selected`);
}

// Highlight selected panel
function highlightPanel(img, panelIndex) {
    // Remove existing highlights
    img.style.filter = '';
    
    // Add highlight effect
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    
    const panelWidth = width / 2;
    const panelHeight = height / 2;
    
    const x = (panelIndex % 2) * panelWidth;
    const y = Math.floor(panelIndex / 2) * panelHeight;
    
    // Create a highlight overlay
    const highlight = document.createElement('div');
    highlight.className = 'panel-highlight';
    highlight.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: ${panelWidth}px;
        height: ${panelHeight}px;
        border: 3px solid var(--primary-color);
        background: rgba(58, 134, 255, 0.2);
        pointer-events: none;
        z-index: 10;
        animation: panelPulse 1s ease-in-out;
    `;
    
    img.parentElement.appendChild(highlight);
    
    // Remove highlight after animation
    setTimeout(() => {
        if (highlight.parentElement) {
            highlight.parentElement.removeChild(highlight);
        }
    }, 1000);
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary-color);
        color: var(--text-light);
        padding: 10px 20px;
        border-radius: var(--border-radius);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }, 300);
    }, 2000);
}