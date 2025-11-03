const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Add JSON parsing for API requests
app.use(express.static(path.join(__dirname, 'public')));

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1309@Mrutyun', // Update with your MySQL password
    database: 'library_management'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
    db.query('SELECT DATABASE()', (err, result) => {
        if (err) {
            console.error('Error checking database:', err);
            return;
        }
        console.log('Current database:', result[0]['DATABASE()']);
    });
    db.query('SELECT * FROM books', (err, results) => {
        if (err) {
            console.error('Error fetching books at startup:', err);
            return;
        }
        console.log('Books in database at startup:', results);
    });
});

// Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/add_book', (req, res) => res.sendFile(path.join(__dirname, 'public', 'add_book.html')));
app.get('/search_book', (req, res) => res.sendFile(path.join(__dirname, 'public', 'search_book.html')));
app.get('/view_books', (req, res) => {
    console.log('Handling /view_books request');
    const query = 'SELECT book_id, title, author, isbn FROM books';
    console.log('Executing query:', query);
    db.query(query, [], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.send(generateErrorPage('Database error occurred. <a href="/view_books">Try again</a>'));
        }
        console.log('View books results:', results);
        console.log('Number of books retrieved:', results.length);
        let html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>View Books - Library Management System</title>
                <link rel="stylesheet" href="/styles.css">
                <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
            </head>
            <body>
                <nav>
                    <ul>
                        <li><a href="/">Login</a></li>
                        <li><a href="/register">Register</a></li>
                        <li><a href="/add_book">Add Book</a></li>
                        <li><a href="/search_book">Search Book</a></li>
                        <li><a href="/view_books">View Books</a></li>
                        <li><a href="/borrowed_books">Borrowed Books</a></li>
                        <li><a href="/borrow_book">Borrow Book</a></li>
                    </ul>
                </nav>
                <main>
                    <div class="container">
                        <h2>View All Books</h2>
                        <div id="book-list">
        `;
        if (results.length === 0) {
            console.log('No books found in database');
            html += '<p>No books available in the library.</p>';
        } else {
            console.log('Books found, rendering table');
            html += `
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Author</th>
                            <th>ISBN</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            results.forEach((book, index) => {
                console.log(`Rendering book ${index + 1}:`, book);
                html += `
                    <tr>
                        <td>${book.book_id}</td>
                        <td>${book.title}</td>
                        <td>${book.author}</td>
                        <td>${book.isbn}</td>
                    </tr>
                `;
            });
            html += `
                    </tbody>
                </table>
            `;
        }
        html += `
                        </div>
                        <div class="link">
                            <a href="/add_book">Add a New Book</a> | <a href="/search_book">Search Books</a> | <a href="/borrowed_books">View Borrowed Books</a> | <a href="/borrow_book">Borrow a Book</a>
                        </div>
                    </div>
                </main>
                <footer>
                    <p>Library Management System © 2025</p>
                </footer>
            </body>
            </html>`;
        console.log('Sending HTML response for /view_books');
        res.send(html);
    });
});

// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT user_id, username FROM users WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.send(generateErrorPage('Database error occurred. <a href="/">Try again</a>'));
        }
        if (results.length > 0) {
            res.redirect('/add_book');
        } else {
            res.send(generateErrorPage('Invalid username or password. <a href="/">Try again</a>'));
        }
    });
});

// Register
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(query, [username, email, password], (err) => {
        if (err) {
            console.error('Database error:', err);
            let errorMsg = 'Error registering user.';
            if (err.code === 'ER_DUP_ENTRY') {
                errorMsg = 'Username or email already exists.';
            }
            return res.send(generateErrorPage(`${errorMsg} <a href="/register">Try again</a>`));
        }
        res.redirect('/');
    });
});

// Add Book
app.post('/add_book', (req, res) => {
    const { title, author, isbn } = req.body;
    console.log('Adding book:', { title, author, isbn });

    if (!isbn || isbn.length !== 13 || !/^\d{13}$/.test(isbn)) {
        return res.send(generateErrorPage('ISBN must be exactly 13 digits. <a href="/add_book">Try again</a>'));
    }

    const query = 'INSERT INTO books (title, author, isbn) VALUES (?, ?, ?)';
    db.query(query, [title, author, isbn], (err) => {
        if (err) {
            console.error('Database error:', err);
            let errorMsg = 'Error adding book.';
            if (err.code === 'ER_DUP_ENTRY') {
                errorMsg = 'ISBN already exists.';
            }
            return res.send(generateErrorPage(`${errorMsg} <a href="/add_book">Try again</a>`));
        }
        console.log('Book added successfully');
        res.send(generateSuccessPage('Book added successfully! <a href="/add_book">Add another</a> | <a href="/search_book">Search books</a> | <a href="/view_books">View all books</a> | <a href="/borrowed_books">View Borrowed Books</a> | <a href="/borrow_book">Borrow a Book</a>'));
    });
});

// Search Book
app.get('/search_book', (req, res) => {
    const queryStr = req.query.query ? req.query.query.trim() : '';
    if (!queryStr) {
        console.log('No search term provided, serving search_book.html');
        return res.sendFile(path.join(__dirname, 'public', 'search_book.html'));
    }
    console.log('Search term received:', queryStr);
    const query = 'SELECT book_id, title, author, isbn FROM books WHERE TRIM(title) LIKE ? OR TRIM(author) LIKE ? OR isbn LIKE ?';
    const params = [`%${queryStr}%`, `%${queryStr}%`, `%${queryStr}%`];
    console.log('Executing query:', query);
    console.log('Query parameters:', params);
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.send(generateErrorPage('Database error occurred. <a href="/search_book">Try again</a>'));
        }
        console.log('Raw query results:', results);
        console.log('Number of results:', results.length);
        let html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Search Results - Library Management System</title>
                <link rel="stylesheet" href="/styles.css">
                <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
            </head>
            <body>
                <nav>
                    <ul>
                        <li><a href="/">Login</a></li>
                        <li><a href="/register">Register</a></li>
                        <li><a href="/add_book">Add Book</a></li>
                        <li><a href="/search_book">Search Book</a></li>
                        <li><a href="/view_books">View Books</a></li>
                        <li><a href="/borrowed_books">Borrowed Books</a></li>
                        <li><a href="/borrow_book">Borrow Book</a></li>
                    </ul>
                </nav>
                <main>
                    <div class="container">
                        <h2>Search Results</h2>
                        <div id="results">
        `;
        if (results.length === 0) {
            console.log('No results found, rendering "No books found" message');
            html += '<p>No books found.</p>';
        } else {
            console.log('Results found, rendering list of books');
            html += '<ul>';
            results.forEach((book, index) => {
                console.log(`Rendering book ${index + 1}:`, book);
                html += `<li><span>${book.title} by ${book.author} (ISBN: ${book.isbn})</span></li>`;
            });
            html += '</ul>';
        }
        html += `
                        </div>
                        <div class="link">
                            <a href="/search_book">Back to Search</a> | <a href="/view_books">View All Books</a> | <a href="/borrowed_books">View Borrowed Books</a> | <a href="/borrow_book">Borrow a Book</a>
                        </div>
                    </div>
                </main>
                <footer>
                    <p>Library Management System © 2025</p>
                </footer>
            </body>
            </html>`;
        console.log('Sending HTML response');
        res.send(html);
    });
});

// Borrow Book - Serve the borrowing page
app.get('/borrow_book', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'borrow_book.html'));
});

// Borrowed Books - View
app.get('/borrowed_books', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'borrowed_books.html'));
});

// Borrowed Books - Get Available Books for Borrowing
app.get('/api/books/available', (req, res) => {
    const query = `
        SELECT book_id, title, author, isbn
        FROM books
        WHERE book_id NOT IN (
            SELECT book_id FROM borrowed_books WHERE returned = FALSE
        )
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error in /api/books/available:', err);
            return res.status(500).json({ error: 'Database error occurred: ' + err.message });
        }
        console.log('Available books:', results);
        res.json(results);
    });
});

// Borrowed Books - Get All
app.get('/api/borrowed_books', (req, res) => {
    const query = `
        SELECT bb.borrow_id, b.title, u.username, bb.borrow_date, bb.due_date, bb.returned
        FROM borrowed_books bb
        JOIN books b ON bb.book_id = b.book_id
        JOIN users u ON bb.user_id = u.user_id
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error occurred' });
        }
        res.json(results);
    });
});

// Borrowed Books - Borrow
app.post('/api/borrowed_books', (req, res) => {
    const { book_id, username } = req.body;
    if (!book_id || !username) {
        return res.status(400).json({ error: 'Book ID and username are required' });
    }

    // Check if user exists
    db.query('SELECT user_id FROM users WHERE username = ?', [username], (err, userResults) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error occurred' });
        }
        if (userResults.length === 0) {
            return res.status(400).json({ error: 'User not found' });
        }
        const user_id = userResults[0].user_id;

        // Check if book exists and is not already borrowed
        const checkQuery = `
            SELECT book_id FROM books WHERE book_id = ? AND book_id NOT IN (
                SELECT book_id FROM borrowed_books WHERE returned = FALSE
            )
        `;
        db.query(checkQuery, [book_id], (err, bookResults) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error occurred' });
            }
            if (bookResults.length === 0) {
                return res.status(400).json({ error: 'Book not found or already borrowed' });
            }

            // Insert borrow record
            const borrowDate = new Date();
            const dueDate = new Date();
            dueDate.setDate(borrowDate.getDate() + 14); // 2-week borrowing period
            const query = 'INSERT INTO borrowed_books (book_id, user_id, borrow_date, due_date, returned) VALUES (?, ?, ?, ?, ?)';
            db.query(query, [book_id, user_id, borrowDate, dueDate, false], (err) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error occurred' });
                }
                res.status(201).json({ message: 'Book borrowed successfully' });
            });
        });
    });
});

// Borrowed Books - Return
app.post('/api/borrowed_books/return/:borrow_id', (req, res) => {
    const borrow_id = req.params.borrow_id;
    const query = 'UPDATE borrowed_books SET returned = TRUE WHERE borrow_id = ? AND returned = FALSE';
    db.query(query, [borrow_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error occurred' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Borrow record not found or already returned' });
        }
        res.json({ message: 'Book returned successfully' });
    });
});

// Helper function for error pages
function generateErrorPage(message) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error - Library Management System</title>
            <link rel="stylesheet" href="/styles.css">
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
        </head>
        <body>
            <nav>
                <ul>
                    <li><a href="/">Login</a></li>
                    <li><a href="/register">Register</a></li>
                    <li><a href="/add_book">Add Book</a></li>
                    <li><a href="/search_book">Search Book</a></li>
                    <li><a href="/view_books">View Books</a></li>
                    <li><a href="/borrowed_books">Borrowed Books</a></li>
                    <li><a href="/borrow_book">Borrow Book</a></li>
                </ul>
            </nav>
            <main>
                <div class="container">
                    <h2>Error</h2>
                    <p style="color: #dc2626; text-align: center;">${message}</p>
                </div>
            </main>
            <footer>
                <p>Library Management System © 2025</p>
            </footer>
        </body>
        </html>`;
}

// Helper function for success pages
function generateSuccessPage(message) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Success - Library Management System</title>
            <link rel="stylesheet" href="/styles.css">
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
        </head>
        <body>
            <nav>
                <ul>
                    <li><a href="/">Login</a></li>
                    <li><a href="/register">Register</a></li>
                    <li><a href="/add_book">Add Book</a></li>
                    <li><a href="/search_book">Search Book</a></li>
                    <li><a href="/view_books">View Books</a></li>
                    <li><a href="/borrowed_books">Borrowed Books</a></li>
                    <li><a href="/borrow_book">Borrow Book</a></li>
                </ul>
            </nav>
            <main>
                <div class="container">
                    <h2>Success</h2>
                    <p style="color: #16a34a; text-align: center;">${message}</p>
                </div>
            </main>
            <footer>
                <p>Library Management System © 2025</p>
            </footer>
        </body>
        </html>`;
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});