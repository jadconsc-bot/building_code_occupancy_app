// API helper functions for bookmarks and notes

export async function fetchBookmarks(): Promise<string[]> {
  try {
    const response = await fetch("/api/bookmarks");
    if (!response.ok) return [];
    const data = await response.json();
    return data.map((b: any) => b.occupancyCode);
  } catch (error) {
    console.error("Failed to fetch bookmarks:", error);
    return [];
  }
}

export async function addBookmark(occupancyCode: string): Promise<boolean> {
  try {
    const response = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ occupancyCode }),
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to add bookmark:", error);
    return false;
  }
}

export async function removeBookmark(occupancyCode: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/bookmarks/${occupancyCode}`, {
      method: "DELETE",
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to remove bookmark:", error);
    return false;
  }
}

export async function fetchNotes(): Promise<Record<string, string>> {
  try {
    const response = await fetch("/api/notes");
    if (!response.ok) return {};
    const data = await response.json();
    const notesMap: Record<string, string> = {};
    data.forEach((note: any) => {
      notesMap[note.occupancyCode] = note.content;
    });
    return notesMap;
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    return {};
  }
}

export async function saveNote(occupancyCode: string, content: string, id?: number): Promise<boolean> {
  try {
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ occupancyCode, content, id }),
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to save note:", error);
    return false;
  }
}

export async function deleteNote(occupancyCode: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/notes/${occupancyCode}`, {
      method: "DELETE",
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to delete note:", error);
    return false;
  }
}
