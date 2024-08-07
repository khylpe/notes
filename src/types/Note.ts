// NoteType.ts

export interface NoteType {
       id: string;                 // Unique identifier for the note
       title: string;              // Title of the note
       content: string;            // Content of the note
       createdDate: Date;          // Date when the note was created
       updatedDate: Date;          // Date when the note was last updated
       tagIds: string[];       // Tags of the note
       folderId: string | null;    // Folder of the note
       isPinned: boolean;          // Is the note pinned
       isArchived: boolean;        // Is the note archived
       isDeleted: boolean;         // Is the note deleted
}
