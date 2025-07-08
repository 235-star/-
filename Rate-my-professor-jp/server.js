import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from '@replit/database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Replit Database
const db = new Database();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Database helper functions
async function loadReviewsFromDatabase() {
    try {
        const storedReviews = await db.get("reviews");
        if (storedReviews) {
            return JSON.parse(storedReviews);
        }
        return [];
    } catch (error) {
        console.log('No stored reviews found, starting with empty array');
        return [];
    }
}

async function saveReviewsToDatabase(reviews) {
    try {
        await db.set("reviews", JSON.stringify(reviews));
        console.log('Reviews saved to database');
    } catch (error) {
        console.error('Error saving reviews to database:', error);
    }
}

// Ensure reviews.json exists and merge with database
async function initializeReviewsFile() {
    const reviewsPath = path.join(__dirname, 'reviews.json');
    try {
        await fs.access(reviewsPath);
    } catch (error) {
        // File doesn't exist, create it with empty array
        await fs.writeFile(reviewsPath, JSON.stringify([], null, 2));
        console.log('Created reviews.json file');
    }
}

// Submit review endpoint
app.post('/submit-review', async (req, res) => {
    try {
        const { type, content } = req.body;
        
        if (!type || !content) {
            return res.status(400).json({ 
                success: false, 
                message: 'Type and content are required' 
            });
        }

        // Create review object with timestamp only
        const review = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            type: type,
            content: content,
            timestamp: new Date().toISOString()
        };

        // Load current reviews from database and file
        let reviews = await loadReviewsFromDatabase();
        
        // Also try to merge from JSON file if it exists
        const reviewsPath = path.join(__dirname, 'reviews.json');
        try {
            const data = await fs.readFile(reviewsPath, 'utf8');
            const fileReviews = JSON.parse(data);
            
            // Merge file reviews with database reviews (avoid duplicates by id)
            const existingIds = new Set(reviews.map(r => r.id));
            const newFileReviews = fileReviews.filter(r => !existingIds.has(r.id));
            reviews = reviews.concat(newFileReviews);
        } catch (error) {
            // File doesn't exist or is empty, continue with database reviews
        }

        // Add new review
        reviews.push(review);

        // Save to both database and file
        await saveReviewsToDatabase(reviews);
        await fs.writeFile(reviewsPath, JSON.stringify(reviews, null, 2));

        console.log(`Review submitted: ${type} at ${review.timestamp}`);
        
        res.json({ 
            success: true, 
            message: 'Review submitted successfully',
            id: review.id
        });

    } catch (error) {
        console.error('Error saving review:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get all reviews (optional endpoint for viewing)
app.get('/reviews', async (req, res) => {
    try {
        // Load reviews from database first
        let reviews = await loadReviewsFromDatabase();
        
        // Also try to merge from JSON file if it exists
        const reviewsPath = path.join(__dirname, 'reviews.json');
        try {
            const data = await fs.readFile(reviewsPath, 'utf8');
            const fileReviews = JSON.parse(data);
            
            // Merge file reviews with database reviews (avoid duplicates by id)
            const existingIds = new Set(reviews.map(r => r.id));
            const newFileReviews = fileReviews.filter(r => !existingIds.has(r.id));
            reviews = reviews.concat(newFileReviews);
        } catch (error) {
            // File doesn't exist or is empty, continue with database reviews
        }
        
        res.json({ 
            success: true, 
            reviews: reviews,
            count: reviews.length
        });
    } catch (error) {
        console.error('Error reading reviews:', error);
        res.json({ 
            success: true, 
            reviews: [],
            count: 0
        });
    }
});

// Fallback route - serve index.html for any unmatched routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize and start server
async function startServer() {
    await initializeReviewsFile();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Anonymous review server running on port ${PORT}`);
        console.log('No tracking or identification data is collected');
        console.log('Reviews are saved to reviews.json');
    });
}

startServer().catch(console.error);