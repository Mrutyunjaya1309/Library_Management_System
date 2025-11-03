-- Login: Verify user credentials
SELECT user_id, username FROM users WHERE username = ? AND password = ?;

-- Register: Insert new user
INSERT INTO users (username, email, password) VALUES (?, ?, ?);

-- Add Book: Insert new book
INSERT INTO books (title, author, isbn) VALUES (?, ?, ?);

-- Search Book: Search by title or author
SELECT book_id, title, author, isbn FROM books WHERE title LIKE ? OR author LIKE ?;