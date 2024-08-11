export interface Invitation {
       invitedDate: number;
       noteDescription: string;
       noteId: string;
       noteTitle: string;
       owner: {
              uuid: string;
              username: string;
              email: string;
              imageUrl: string;
       }
       status: string;
};
