export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
}

export interface Chat {
  id: string;
  name: string;
  messages: Message[];
  createdAt: number;
}
