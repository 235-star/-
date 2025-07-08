import express, { type Request, Response, NextFunction } from "express";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from root directory
app.use(express.static('.'));

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
