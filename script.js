// script.js
class BooksLibrary {
    constructor() {
        this.books = window.books || [];
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.setTheme();
        this.bindEvents();
        this.renderBooks();
        this.loadPDFJS();
    }

    setTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        const isDark = this.currentTheme === 'dark';
        document.getElementById('themeToggle').textContent = isDark ? '☀️' : '🌙';
    }

    bindEvents() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', this.currentTheme);
            this.setTheme();
        });

        // Search and filter
        document.getElementById('searchInput').addEventListener('input', debounce(this.filterBooks.bind(this), 300));
        document.getElementById('categoryFilter').addEventListener('change', this.filterBooks.bind(this));

        // Modal
        document.getElementById('bookModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') || e.target.classList.contains('close')) {
                this.closeModal();
            }
        });

        document.getElementById('previewBtn').addEventListener('click', () => {
            this.previewPDF();
        });
    }

    renderBooks(books = this.books) {
        const grid = document.getElementById('booksGrid');
        grid.innerHTML = books.map(book => `
            <div class="book-card" data-id="${book.id}">
                <div class="book-cover">📖</div>
                <div class="book-info">
                    <div class="book-title">${book.title}</div>
                    <div class="book-author">by ${book.author}</div>
                    <div class="book-meta">
                        <span>${book.category}</span>
                        <span>${book.year}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Bind click events to cards
        document.querySelectorAll('.book-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                this.openModal(id);
            });
        });
    }

    filterBooks() {
        const query = document.getElementById('searchInput').value.toLowerCase();
        const category = document.getElementById('categoryFilter').value;

        const filtered = this.books.filter(book => {
            const matchesSearch = !query || 
                book.title.toLowerCase().includes(query) || 
                book.author.toLowerCase().includes(query);
            const matchesCategory = !category || book.category === category;
            return matchesSearch && matchesCategory;
        });

        this.renderBooks(filtered);
    }

    openModal(id) {
        const book = this.books.find(b => b.id == id);
        if (!book) return;

        document.getElementById('modalTitle').textContent = book.title;
        document.getElementById('modalAuthor').textContent = `by ${book.author}`;
        document.getElementById('modalDesc').textContent = book.description;
        document.getElementById('downloadBtn').href = book.pdfUrl;

        document.getElementById('bookModal').style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Set modal data
        window.currentBook = book;
    }

    closeModal() {
        document.getElementById('bookModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.clearPDFViewer();
    }

    async loadPDFJS() {
        // PDF.js is loaded as module via CDN
        this.pdfjsLib = window.pdfjsLib;
        if (this.pdfjsLib) {
            this.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.432/pdf.worker.min.mjs';
        }
    }

    async previewPDF() {
        const book = window.currentBook;
        const viewer = document.getElementById('pdfViewer');
        viewer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;">Loading PDF...</div>';

        try {
            // Note: For demo, since real PDFs from Gutenberg are large, simulate preview
            // In production, use actual PDF URLs
            const loadingTask = this.pdfjsLib.getDocument(book.pdfUrl);
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);
            
            const scale = 1.5;
            const viewport = page.getViewport({ scale });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            viewer.innerHTML = '';
            viewer.appendChild(canvas);
            
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            // Add page navigation buttons
            const nav = document.createElement('div');
            nav.innerHTML = `
                <button onclick="library.prevPage()" style="margin:10px;">Previous</button>
                <span id="pageNum">Page 1 of ${pdf.numPages}</span>
                <button onclick="library.nextPage()" style="margin:10px;">Next</button>
            `;
            viewer.appendChild(nav);
            
            window.currentPDF = pdf;
            window.currentPage = 1;
            
        } catch (error) {
            viewer.innerHTML = '<div style="padding:2rem;color:var(--text-secondary);">PDF preview unavailable. Please download to read.</div>';
            console.error('PDF load error:', error);
        }
    }

    prevPage() {
        if (window.currentPage > 1) {
            window.currentPage--;
            this.renderCurrentPage();
        }
    }

    nextPage() {
        if (window.currentPage < window.currentPDF.numPages) {
            window.currentPage++;
            this.renderCurrentPage();
        }
    }

    async renderCurrentPage() {
        const pdf = window.currentPDF;
        const page = await pdf.getPage(window.currentPage);
        // Re-render logic similar to previewPDF
        document.getElementById('pageNum').textContent = `Page ${window.currentPage} of ${pdf.numPages}`;
    }

    clearPDFViewer() {
        document.getElementById('pdfViewer').innerHTML = '';
        window.currentPDF = null;
        window.currentPage = 1;
    }
}

// Utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize
const library = new BooksLibrary();
window.library = library;
