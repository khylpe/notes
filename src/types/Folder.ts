// Folder.ts

export interface FolderType {
       id: string;       // Unique identifier for the Folder
       name: string;    // Title of the folder
       color: string;  // Content of the folder
       createdDate: Date;    // Date when the folder was created
       updatedDate: Date;    // Date when the folder was last updated
       numberOfNotes: number; // Number of notes in the folder
}
