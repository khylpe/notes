// NoteType.ts

export interface NoteType {
       id: string;       // Unique identifier for the note
       title: string;    // Title of the note
       content: string;  // Content of the note
       createdDate: Date;    // Date when the note was created
       tagId: string | null;      // Tag of the note
       // Add any other fields that are relevant for your notes
}
