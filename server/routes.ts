import { Router, Request, Response } from "express";
import { getUserBookmarks, addBookmark, removeBookmark, getUserNotes, upsertNote, deleteNote, getUserNoteForCode } from "./db";
import { sdk } from "./_core/sdk";

// Simple auth middleware
const requireAuth = async (req: Request, res: Response, next: Function) => {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    (req as any).user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

const router = Router();

// Bookmarks routes
router.get("/api/bookmarks", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const bookmarks = await getUserBookmarks(userId);
    res.json(bookmarks);
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    res.status(500).json({ error: "Failed to fetch bookmarks" });
  }
});

router.post("/api/bookmarks", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const { occupancyCode } = req.body;
    
    if (!occupancyCode) {
      return res.status(400).json({ error: "occupancyCode is required" });
    }
    
    await addBookmark({ userId, occupancyCode });
    res.json({ success: true });
  } catch (error) {
    console.error("Error adding bookmark:", error);
    res.status(500).json({ error: "Failed to add bookmark" });
  }
});

router.delete("/api/bookmarks/:code", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const occupancyCode = req.params.code;
    
    await removeBookmark(userId, occupancyCode);
    res.json({ success: true });
  } catch (error) {
    console.error("Error removing bookmark:", error);
    res.status(500).json({ error: "Failed to remove bookmark" });
  }
});

// Notes routes
router.get("/api/notes", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const notes = await getUserNotes(userId);
    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

router.get("/api/notes/:code", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const occupancyCode = req.params.code;
    
    const note = await getUserNoteForCode(userId, occupancyCode);
    res.json(note);
  } catch (error) {
    console.error("Error fetching note:", error);
    res.status(500).json({ error: "Failed to fetch note" });
  }
});

router.post("/api/notes", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const { occupancyCode, content, id } = req.body;
    
    if (!occupancyCode || !content) {
      return res.status(400).json({ error: "occupancyCode and content are required" });
    }
    
    await upsertNote({ id, userId, occupancyCode, content });
    res.json({ success: true });
  } catch (error) {
    console.error("Error upserting note:", error);
    res.status(500).json({ error: "Failed to save note" });
  }
});

router.delete("/api/notes/:code", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user!.id;
    const occupancyCode = req.params.code;
    
    await deleteNote(userId, occupancyCode);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

export default router;
