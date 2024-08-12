export interface SharedNoteType {
       content: string;             // Content of the note
       createdDate: Date;           // Date the note was created
       id: string;                  // Unique identifier for the note
       lastUpdateBy: string;        // UID of the last user who updated the note
       owner: string;               // UID of the user who owns the note
       title: string;               // Title of the note
       updatedDate: Date;           // Date the note was last updated
       users: {                     // User-specific metadata
              [userId: string]: {
                     email: string;        // Email of the user
                     inviteDate: Date;     // Date the user was invited to the note
                     inviteAcceptedDate?: Date | null; // Date the user accepted the invitation
                     inviteRefusedDate?: Date | null;  // Date the user refused the invitation
                     inviteStatus: "accepted" | "pending" | "refused"; // Status of the user's invitation
                     isArchived: boolean;   // Whether the note is archived for this user
                     isDeleted: boolean;    // Whether the note is deleted for this user
                     isPinned: boolean;     // Whether the note is pinned for this user
                     isWatching: boolean;   // Whether the user is watching the note
                     isWriting: boolean;   // Whether the user is currently modifying the note
                     rule: "write" | "read";          // User's permission level for the note
                     username: string;      // Username of the user
                     tags: string[];        // Array of tag IDs associated with the note for this user
                     folderId: string | null; // Folder ID for organizing the note, specific to the user
                     uuid: string;          // Unique identifier for the user's note metadata
                     imageUrl: string;      // URL of the user's profile image
                     notificationSent: boolean; // Whether a notification has been sent to the user
              };
       };
}
