import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReviewSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all universities
  app.get("/api/universities", async (req, res) => {
    try {
      const universities = await storage.getUniversities();
      res.json(universities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch universities" });
    }
  });

  // Get professors with optional filters
  app.get("/api/professors", async (req, res) => {
    try {
      const { universityId, search } = req.query;
      const filters: any = {};
      
      if (universityId) {
        filters.universityId = parseInt(universityId as string);
      }
      
      if (search) {
        filters.search = search as string;
      }

      const professors = await storage.getProfessors(filters);
      res.json(professors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch professors" });
    }
  });

  // Get a specific professor
  app.get("/api/professors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const professor = await storage.getProfessor(id);
      
      if (!professor) {
        return res.status(404).json({ message: "Professor not found" });
      }
      
      res.json(professor);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch professor" });
    }
  });

  // Get reviews for a professor
  app.get("/api/professors/:id/reviews", async (req, res) => {
    try {
      const professorId = parseInt(req.params.id);
      const reviews = await storage.getReviewsByProfessor(professorId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Create a new review
  app.post("/api/reviews", async (req, res) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(validatedData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Search professors
  app.get("/api/search", async (req, res) => {
    try {
      const { q, universityId } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }

      const professors = await storage.searchProfessors(
        q, 
        universityId ? parseInt(universityId as string) : undefined
      );
      
      res.json(professors);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Get recent reviews
  app.get("/api/reviews/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const recentReviews = await storage.getRecentReviews(limit);
      res.json(recentReviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent reviews" });
    }
  });

  // Get site statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Track site access
  app.post("/api/track-access", async (req, res) => {
    try {
      await storage.incrementAccessCount();
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking access:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
